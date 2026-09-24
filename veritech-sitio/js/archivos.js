/* VeriTech · subir un PDF, una infografía o una captura de pantalla.
   Todo se lee en el navegador: el archivo no se sube a ningún servidor.
   - PDF con texto: pdf.js saca el texto de cada página; el alumno elige qué páginas usa
     (eso es el fragmento) y el PDF entero queda como «texto completo» para el motor.
   - Imagen, o PDF escaneado: Tesseract.js lee el texto (OCR en español).
   Las librerías están en /js/vendor/ y se cargan solo cuando hacen falta.
   index.js lee el estado con window.VeriTechArchivos. */
(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var MAX=20*1024*1024, MAX_PAGINAS=400, MAX_PAGINAS_OCR=5;
var V="/js/vendor/";
function abs(p){return new URL(p,location.href).href;}

/* nombre: archivo actual · textos: texto de cada página del PDF · completo: PDF entero
   pdf: documento de pdf.js (para el OCR de un PDF escaneado) · ocr: páginas ya leídas */
var estado=null, turno=0;

function progreso(msg,error){
  var el=$("progreso"); el.hidden=!msg; el.textContent=msg||""; el.className="progreso"+(error?" error":"");
}
function cargarScript(src){
  return new Promise(function(ok,no){
    var ya=document.querySelector('script[src="'+src+'"]');
    if(ya){ if(ya.dataset.listo)ok(); else{ya.addEventListener("load",ok);ya.addEventListener("error",no);} return; }
    var s=document.createElement("script"); s.src=src;
    s.onload=function(){s.dataset.listo="1";ok();};
    s.onerror=function(){no(new Error("No se pudo cargar "+src));};
    document.head.appendChild(s);
  });
}
function limpio(t){return t.replace(/[ \t]+\n/g,"\n").replace(/\n{3,}/g,"\n\n").replace(/[ \t]{2,}/g," ").trim();}
function avisar(tipo){document.dispatchEvent(new CustomEvent("veritech:archivo",{detail:{tipo:tipo}}));}

/* ==================== OCR ==================== */
var ocr=null, etiquetaOCR="Leyendo la imagen… ";
/* El núcleo wasm va en dos versiones (con y sin SIMD). Se elige aquí y se usa la
   que trae el .wasm aparte: la versión «.wasm.js» lo lleva incrustado como data:,
   y la CSP (connect-src 'self') bloquea ese fetch. El .wasm se busca junto al worker. */
function nucleo(){
  var simd=false;
  try{simd=WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11]));}catch(e){}
  return V+"tesseract/tesseract-core-"+(simd?"simd-":"")+"lstm.js";
}
function lectorOCR(){
  if(ocr)return ocr;
  progreso("Preparando el lector de imágenes… la primera vez tarda unos segundos.");
  ocr=cargarScript(V+"tesseract/tesseract.min.js").then(function(){
    return window.Tesseract.createWorker("spa",1,{
      workerPath:abs(V+"tesseract/worker.min.js"),
      corePath:abs(nucleo()),
      langPath:abs(V+"tesseract/lang"),
      workerBlobURL:false,
      logger:function(m){ if(m.status==="recognizing text")progreso(etiquetaOCR+Math.round(m.progress*100)+" %"); }
    });
  });
  ocr.catch(function(){ocr=null;});
  return ocr;
}
function leerImagen(fuente,etiqueta){
  etiquetaOCR=etiqueta;
  return lectorOCR().then(function(w){return w.recognize(fuente);}).then(function(r){return limpio(r.data.text||"");});
}

/* ==================== PDF ==================== */
function unir(items){
  return items.map(function(it){return (it.str||"")+(it.hasEOL?"\n":" ");}).join("");
}
/* Metadatos del PDF (campo Autor y fecha de creación). Muchos PDF traen ahí el nombre
   del programa o del usuario del equipo, así que solo se aceptan nombres con pinta de nombre. */
var NO_ES_AUTOR=/^(user|usuario|admin|administra|owner|propietario|microsoft|word|autor|author|unknown|desconocido|pc|hp|dell|lenovo|acer|asus|windows|mac|equipo)\b/i;
function metaPDF(pdf){
  return pdf.getMetadata().then(function(m){
    var info=m&&m.info||{}, autor=String(info.Author||"").trim(), titulo=String(info.Title||"").trim();
    if(autor.length<4||autor.length>80||!/[a-záéíóúñ]{2}/i.test(autor)||NO_ES_AUTOR.test(autor)||/@|\.(docx?|pdf)$/i.test(autor))autor="";
    var y=parseInt((String(info.CreationDate||"").match(/^D:(\d{4})/)||[])[1],10);
    if(!(y>=1900&&y<=new Date().getFullYear()))y=null;
    if(titulo.length<6||/\.(docx?|pdf|indd)$/i.test(titulo)||/^microsoft/i.test(titulo))titulo="";
    return {autor:autor,anio:y,titulo:titulo};
  }).catch(function(){return {autor:"",anio:null,titulo:""};});
}
/* Texto de cada página (hasta MAX_PAGINAS) y metadatos. La usa también fuente-url.js
   para los PDF que se leen desde su dirección. */
function textoPDF(buf,aviso,vigente){
  return cargarScript(V+"pdfjs/pdf.min.js").then(function(){
    var lib=window.pdfjsLib;
    lib.GlobalWorkerOptions.workerSrc=V+"pdfjs/pdf.worker.min.js";
    return lib.getDocument({data:buf,isEvalSupported:false}).promise;
  }).then(function(pdf){
    var n=pdf.numPages, lim=Math.min(n,MAX_PAGINAS), textos=[], i=0;
    function siguiente(){
      if(vigente&&!vigente())return Promise.reject(new Error("cancelado"));
      if(i>=lim)return Promise.resolve();
      i++; if(aviso)aviso("Leyendo el PDF… página "+i+" de "+lim);
      return pdf.getPage(i).then(function(p){return p.getTextContent();})
        .then(function(tc){textos.push(limpio(unir(tc.items)));return siguiente();});
    }
    return siguiente().then(function(){return metaPDF(pdf);})
      .then(function(meta){return {pdf:pdf,textos:textos,total:n,meta:meta};});
  });
}
function leerPDF(file,t){
  return file.arrayBuffer().then(function(buf){
    return textoPDF(buf,progreso,function(){return t===turno;});
  }).then(function(d){
    var pdf=d.pdf, n=d.total, textos=d.textos, lim=textos.length;
    var letras=textos.join("").replace(/\s/g,"").length;
    estado.pdf=pdf; estado.textos=textos; estado.total=n; estado.meta=d.meta;
    estado.escaneado=letras<30*lim;          /* casi sin texto: son fotos de páginas */
    estado.completo=estado.escaneado?null:textos.join("\n\n");
    estado.ocr={};
    $("pag-total").textContent="PDF de "+n+" página"+(n>1?"s":"")+
      (n>lim?" (se leyeron las primeras "+lim+")":"")+
      (estado.escaneado?". Es un PDF escaneado: se leerá como imagen, hasta "+MAX_PAGINAS_OCR+" páginas a la vez.":".");
    ["pag-desde","pag-hasta"].forEach(function(id){$(id).max=lim;});
    $("pag-desde").value=1;
    $("pag-hasta").value=estado.escaneado?Math.min(lim,1):lim;
    $("paginas").hidden=false;
    return aplicarRango();
  });
}
function renderizar(pagina){
  return estado.pdf.getPage(pagina).then(function(p){
    var vp=p.getViewport({scale:2}), c=document.createElement("canvas");
    c.width=vp.width; c.height=vp.height;
    /* intent "print": pdf.js no usa requestAnimationFrame, que el navegador pausa
       si el alumno cambia de pestaña mientras se lee el PDF */
    return p.render({canvasContext:c.getContext("2d"),viewport:vp,intent:"print"}).promise.then(function(){return c;});
  });
}
function aplicarRango(){
  if(!estado||!estado.textos)return Promise.resolve();
  var lim=estado.textos.length;
  var d=Math.min(Math.max(parseInt($("pag-desde").value,10)||1,1),lim);
  var h=Math.min(Math.max(parseInt($("pag-hasta").value,10)||d,d),lim);
  $("pag-desde").value=d; $("pag-hasta").value=h;
  $("frag").checked=!(d===1&&h===estado.total);
  if(!estado.escaneado){
    $("t").value=estado.textos.slice(d-1,h).join("\n\n");
    progreso(d===h?"Listo: usarás la página "+d+".":"Listo: usarás las páginas "+d+" a "+h+".");
    avisar("pdf"); return Promise.resolve();
  }
  if(h-d+1>MAX_PAGINAS_OCR){progreso("En un PDF escaneado elige como máximo "+MAX_PAGINAS_OCR+" páginas a la vez.",true);return Promise.resolve();}
  var t=turno, partes=[], p=d;
  progreso("Leyendo "+(d===h?"la página "+d:"las páginas "+d+" a "+h)+"…");
  function siguiente(){
    if(t!==turno)return Promise.reject(new Error("cancelado"));
    if(p>h)return Promise.resolve();
    var pag=p++;
    if(estado.ocr[pag]!=null){partes.push(estado.ocr[pag]);return siguiente();}
    return renderizar(pag).then(function(c){return leerImagen(c,"Leyendo la página "+pag+"… ");})
      .then(function(txt){estado.ocr[pag]=txt;partes.push(txt);return siguiente();});
  }
  return siguiente().then(function(){
    $("t").value=partes.join("\n\n");
    progreso("Listo. Revisa el texto: la lectura de imágenes puede tener errores.");
    avisar("pdf");
  });
}

/* ==================== ENTRADA ==================== */
function quitar(){
  turno++; estado=null;
  $("f").value=""; $("archivo").hidden=true; $("paginas").hidden=true; progreso("");
}
function manejar(file){
  if(!file)return;
  var esPDF=file.type==="application/pdf"||/\.pdf$/i.test(file.name);
  var esImg=/^image\/(png|jpeg|webp)$/.test(file.type);
  if(!esPDF&&!esImg){progreso("Ese formato no se puede leer. Usa un PDF o una imagen PNG, JPG o WEBP.",true);return;}
  if(file.size>MAX){progreso("El archivo pesa "+(file.size/1048576).toFixed(1)+" MB. El máximo es 20 MB.",true);return;}
  quitar();
  var t=turno; estado={nombre:file.name};
  $("archivo-nombre").textContent=(esPDF?"PDF · ":"Imagen · ")+file.name; $("archivo").hidden=false;
  $("t").value="";
  var trabajo=esPDF?leerPDF(file,t):leerImagen(file,"Leyendo la imagen… ").then(function(txt){
    if(t!==turno)return;
    $("t").value=txt; $("frag").checked=true;
    progreso(txt?"Listo. Revisa el texto: la lectura de imágenes puede tener errores.":"No se encontró texto en la imagen. Prueba con una captura más grande o más nítida.",!txt);
    avisar("imagen");
  });
  trabajo.catch(function(e){
    if(t!==turno||(e&&e.message==="cancelado"))return;
    progreso(esPDF?"No se pudo leer el PDF. Puede estar dañado o protegido con contraseña.":"No se pudo leer la imagen. Prueba con otra captura.",true);
  });
}

function modo(subir){
  $("m-pegar").setAttribute("aria-pressed",!subir);
  $("m-subir").setAttribute("aria-pressed",subir);
  $("subir").hidden=!subir; $("ayuda-subir").hidden=!subir; $("ayuda-pegar").hidden=subir;
  $("t-label").textContent=subir?"Texto sacado del archivo (revísalo y corrígelo si hace falta)":"El texto que vas a usar (si pusiste la dirección, basta con el párrafo que vas a citar, o nada)";
  if(!subir&&estado){quitar();avisar("quitado");}   /* al volver a pegar, el PDF anterior deja de contar */
}
$("m-pegar").addEventListener("click",function(){modo(false);});
$("m-subir").addEventListener("click",function(){modo(true);});
$("f").addEventListener("change",function(){manejar(this.files&&this.files[0]);});
$("archivo-quitar").addEventListener("click",function(){quitar();$("t").value="";avisar("quitado");});
["pag-desde","pag-hasta"].forEach(function(id){
  $(id).addEventListener("change",function(){
    aplicarRango().catch(function(e){if(!(e&&e.message==="cancelado"))progreso("No se pudieron leer esas páginas.",true);});
  });
});
var zona=$("zona");
["dragenter","dragover"].forEach(function(ev){zona.addEventListener(ev,function(){zona.classList.add("encima");});});
["dragleave","drop"].forEach(function(ev){zona.addEventListener(ev,function(){zona.classList.remove("encima");});});
/* Un archivo soltado fuera de la zona no debe abrirse en la pestaña (se perdería lo escrito) */
window.addEventListener("dragover",function(e){if(e.target!==$("f"))e.preventDefault();});
window.addEventListener("drop",function(e){
  if(e.target===$("f"))return;
  e.preventDefault();
  var f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];
  if(f&&!$("p-src").hidden){modo(true);manejar(f);}
});

window.VeriTechArchivos={
  textoCompleto:function(){return estado&&estado.completo||null;},
  nombre:function(){return estado&&estado.nombre||null;},
  meta:function(){return estado&&estado.meta||null;},
  textoPDF:textoPDF,
  quitar:quitar
};
})();
