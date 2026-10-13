(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var flashTimer=null;
function flash(msg,kind){
  var el=$("flash"); el.textContent=msg; el.className="flash f-"+(kind||"ok"); el.hidden=false;
  clearTimeout(flashTimer); flashTimer=setTimeout(function(){el.hidden=true;},3600);
}
/* Todo lo que viene del usuario (texto pegado, URL, lo guardado en el navegador)
   se escapa antes de pintarlo, para que nunca se interprete como HTML. */
function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
function same(v){return v;}

/* ==================== RENDER ==================== */
function dial(score,level){
  var col=level==="ok"?"var(--ok)":level==="warn"?"var(--warn)":"var(--bad)";
  var C=2*Math.PI*44, frac=score/100, arc=C*0.75;
  return '<svg class="dial" viewBox="0 0 110 110" role="img" aria-label="Puntaje '+score+' de 100">'+
    '<circle cx="55" cy="55" r="44" fill="none" stroke="var(--line-strong)" stroke-width="7" stroke-linecap="round" '+
    'stroke-dasharray="'+arc+' '+C+'" transform="rotate(135 55 55)"/>'+
    '<circle cx="55" cy="55" r="44" fill="none" stroke="'+col+'" stroke-width="7" stroke-linecap="round" '+
    'stroke-dasharray="'+(arc*frac)+' '+C+'" transform="rotate(135 55 55)"/>'+
    '<text class="score" x="55" y="58" fill="'+col+'">'+score+'</text>'+
    '<text class="cap" x="55" y="73" fill="var(--muted)">DE 100</text></svg>';
}
var TITLES={ok:["Fuente sólida","Puedes citarla. Revisa igual que responda a tu pregunta."],
warn:["Revísala con cuidado","Sirve para orientarte, pero busca una fuente mejor para lo importante."],
bad:["No la cites","Demasiadas señales de alarma. Busca otra antes de usarla en tu trabajo."]};
var last=null;

/* Autor y año: lo que escribe el alumno manda. Si el campo lo rellenó VeriTech
   (data-auto), no cuenta como «indicado por ti» y se vuelve a calcular. */
function manual(el){return el.dataset.auto?"":el.value.trim();}
function autollenar(el,val){
  if(el.value.trim()&&!el.dataset.auto)return;
  el.value=val||""; if(val)el.dataset.auto="1"; else delete el.dataset.auto;
}
function archivo(){return window.VeriTechArchivos&&window.VeriTechArchivos.nombre()?window.VeriTechArchivos:null;}

/* ---------- la fuente completa, leída desde su dirección (js/fuente-url.js) ----------
   fuenteURL: {url, estado:"cargando"|"ok"|"error", datos, mensaje}. Si hay un archivo
   subido, manda el archivo y la dirección no se lee. */
var fuenteURL=null;
function estadoURL(msg,error){
  var el=$("estado-url"); el.hidden=!msg; el.textContent=msg||""; el.className="progreso"+(error?" error":"");
}
function dirValida(u){try{var x=new URL(u);return /^https?:$/.test(x.protocol)&&x.hostname.indexOf(".")>0;}catch(e){return false;}}
function pedirFuente(){
  var url=$("u").value.trim();
  if(!url||archivo()||!window.VeriTechURL){fuenteURL=null;estadoURL("");return;}
  if(!dirValida(url)){fuenteURL=null;estadoURL("Revisa la dirección: debe empezar por https:// o http://",true);return;}
  if(fuenteURL&&fuenteURL.url===url)return;
  var f=fuenteURL={url:url,estado:"cargando"};
  estadoURL("Leyendo la página completa…");
  window.VeriTechURL.leer(url,function(m){if(fuenteURL===f)estadoURL(m);}).then(function(d){
    if(fuenteURL!==f)return;
    f.estado="ok"; f.datos=d;
    var n=d.texto.split(/\s+/).length;
    estadoURL("Se leyó la fuente completa"+(d.tipo==="pdf"?" (PDF de "+d.paginas+" página"+(d.paginas>1?"s":"")+")":"")+": "+n.toLocaleString("es")+" palabras.");
    renderSource();
  },function(e){
    if(fuenteURL!==f)return;
    f.estado="error"; f.mensaje=e&&e.message||"No se pudo abrir la página.";
    estadoURL("No se pudo leer la página. "+f.mensaje+" Se analiza solo el texto que pegaste.",true);
    renderSource();
  });
}
/* Datos de la fuente completa para el motor: el PDF subido o la página leída */
function fuenteCompleta(){
  var a=archivo();
  if(a&&a.textoCompleto()){
    var full=a.textoCompleto(), m=a.meta()||{};
    return {texto:full,
      autor:findAuthor(full)?"":m.autor, anio:findYear(full)!==null?null:m.anio,
      titulo:m.titulo, enlaces:0};
  }
  if(fuenteURL&&fuenteURL.estado==="ok"&&fuenteURL.url===$("u").value.trim())return fuenteURL.datos;
  return null;
}
function analizar(){pedirFuente();renderSource();}
/* En un fragmento sin autor o sin año, el campo se resalta y explica qué escribir */
function marcarFaltantes(r){
  var frag=!!(r&&r.fragmento);
  [["autor",frag&&!r.author],["anio",frag&&r.year==null]].forEach(function(par){
    var el=$(par[0]), falta=par[1]&&!el.value.trim();
    el.classList.toggle("falta",falta); $(par[0]+"-aviso").hidden=!falta;
  });
}
function renderSource(){
  var url=$("u").value.trim(), text=$("t").value;
  var cargando=fuenteURL&&fuenteURL.estado==="cargando"&&fuenteURL.url===url;
  var fuente=fuenteCompleta();
  $("frag").disabled=!!fuente; $("frag-no").hidden=!fuente;
  if(!text.trim()&&!fuente){
    $("verdict").innerHTML='<div class="empty">'+(cargando?"Leyendo la página completa…":
      "Escribe la dirección de la página, pega su texto o sube un archivo, y pulsa Analizar.")+'</div>';
    $("checks").innerHTML=""; $("frag-sug").hidden=true; last=null; marcarFaltantes(null); return;
  }
  var r=analyzeSource(url,text,{
    textoCompleto:fuente&&fuente.texto, autorFuente:fuente&&fuente.autor, anioFuente:fuente&&fuente.anio, enlaces:fuente&&fuente.enlaces,
    fragmento:$("frag").checked, autor:manual($("autor")), anio:manual($("anio"))});
  last=r; last.url=url; last.text=text; last.full=fuente&&fuente.texto; last.titulo=fuente&&fuente.titulo;
  autollenar($("autor"),r.author); autollenar($("anio"),r.year);
  marcarFaltantes(r);
  $("frag-sug").hidden=!!fuente||r.fragmento||r.words>=400;
  var t=TITLES[r.level];
  var cuerpo=r.incompleto?"Es un fragmento: para un veredicto final, escribe arriba el autor y el año (búscalos en la portada o en la página), o la dirección de la página.":
    r.fuenteCompleta?t[1]+" Se evaluó la fuente completa ("+r.words.toLocaleString("es")+" palabras), no solo el texto que pegaste.":
    cargando?t[1]+" Todavía se está leyendo la página completa: el puntaje puede cambiar.":t[1];
  $("verdict").innerHTML='<div class="verdict v-'+r.level+'">'+dial(r.score,r.level)+
    '<div><div class="v-title">'+t[0]+'</div><p class="v-body">'+cuerpo+'</p></div></div>';
  $("checks").innerHTML=r.checks.map(function(c){
    return '<div class="chk"><span class="lamp l-'+c.status+'"></span><div><b>'+esc(c.label)+'</b><span>'+esc(c.detail)+'</span></div></div>';
  }).join("");
  $("aibox1").hidden=true;
}

function renderClaim(){
  var claim=$("claim").value.trim(), src=$("srctext").value.trim();
  if(!claim||!src){$("verdict2").innerHTML='<div class="empty">Pega la afirmación y el texto de la fuente.</div>';$("detail2").innerHTML="";return;}
  var r=checkClaim(claim,src);
  var col=r.level==="ok"?"var(--ok)":r.level==="warn"?"var(--warn)":"var(--bad)";
  var head=r.level==="ok"?["La fuente respalda tu afirmación","Los conceptos clave de tu frase aparecen en el texto que citas."]:
           r.level==="warn"?["Respaldo parcial","Parte de tu afirmación está en la fuente y parte no. Revisa si estás atribuyéndole algo que no dice."]:
           ["La fuente no dice eso","Los conceptos centrales de tu afirmación no aparecen en el texto. Esta cita no sostiene lo que escribiste."];
  $("verdict2").innerHTML='<div class="verdict v-'+r.level+'"><div style="min-width:78px">'+
    '<div style="font-family:Archivo,sans-serif;font-weight:800;font-size:2.4rem;line-height:1;color:'+col+';font-variant-numeric:tabular-nums">'+r.pct+'%</div>'+
    '<div class="mono" style="font-size:.6rem;letter-spacing:.12em;color:var(--muted)">COINCIDENCIA</div></div>'+
    '<div><div class="v-title">'+head[0]+'</div><p class="v-body">'+head[1]+'</p></div></div>';
  $("detail2").innerHTML='<div class="bar" style="margin-bottom:12px"><i style="width:'+r.pct+'%;background:'+col+'"></i></div>'+
    '<p style="font-size:.78rem;color:var(--muted);margin-bottom:.5em">De los '+r.total+' conceptos clave de tu afirmación:</p>'+
    '<div class="overlap">'+
      r.hits.map(function(o){return '<span class="term hit">'+esc(o.word)+'</span>';}).join("")+
      r.misses.map(function(o){return '<span class="term miss">'+esc(o.word)+' ✕</span>';}).join("")+
    '</div>'+
    (r.misses.length?'<p style="font-size:.78rem;color:var(--muted);margin-top:.9em">Los marcados en rojo no aparecen en la fuente. Si son el centro de tu afirmación, estás citando algo que la fuente no dice.</p>':'');
  $("aibox2").hidden=true;
}

/* ==================== MI TRABAJO ==================== */
var work=[];
function load(){try{var s=localStorage.getItem("veritech.work");work=s?JSON.parse(s):[];}catch(e){work=[];}}
function save(){try{localStorage.setItem("veritech.work",JSON.stringify(work));}catch(e){}}
function host(u){try{return new URL(u).hostname.replace(/^www\./,"");}catch(e){return u||"fuente sin dirección";}}
/* El título es la primera línea con largo de título que no sea firma, fecha ni dirección
   («Por Ana Torres», «Publicado el 3 de marzo de 2026», «https://…» no son títulos). */
var NO_TITULO=/^(?:por|autor(?:a|es)?|escrito por|redactado por|texto de|by|publicado|actualizado|fecha|última (?:revisión|actualización)|compartir|inicio|menú)\b|^https?:\/\/|^\d{1,2}[\/ -]|^\d{4}-\d{2}-\d{2}/i;
function title(t){
  var l=t.split("\n").map(function(s){return s.trim();}).filter(Boolean);
  for(var i=0;i<l.length;i++){if(l[i].length>12&&l[i].length<130&&!NO_TITULO.test(l[i]))return l[i];}
  for(i=0;i<l.length;i++){if(l[i].length>12&&l[i].length<130)return l[i];}
  return l[0]||"Documento sin título";
}
/* En español el primer nombre suele ser el de pila y lo demás apellidos:
   «Laura Restrepo Marín» -> «Restrepo Marín, L.» */
function bare(a){return (a||"").replace(/^(?:Dr[ao]?|Dra|Prof|Lic|Mtr[ao]?|Ing|Mg)\.\s*/,"").trim();}
function invert(a){
  var p=bare(a).split(/\s+/).filter(Boolean);
  if(p.length<2)return {sur:p[0]||"",ini:""};
  /* las iniciales sueltas tras el nombre también son del nombre: «María C. Vázquez Torres» -> «Vázquez Torres, M. C.» */
  var ini=[p[0].charAt(0).toUpperCase()+"."], i=1;
  while(i<p.length-1&&/^[A-ZÁÉÍÓÚÑ]\.?$/.test(p[i])){ini.push(p[i].charAt(0)+".");i++;}
  return {sur:p.slice(i).join(" "),ini:ini.join(" ")};
}
function apa(e,h){
  h=h||same;
  var url=e.url?" "+h(e.url):"";
  if(!e.author)return h(host(e.url))+" ("+h(e.year||"s.f.")+"). <i>"+h(e.title)+"</i>."+url;
  var v=invert(e.author);
  return h(v.sur)+", "+h(v.ini)+" ("+h(e.year||"s.f.")+"). <i>"+h(e.title)+"</i>. "+h(host(e.url))+"."+url;
}
function mla(e,h){
  h=h||same;
  var who=e.author?(function(){var v=invert(e.author);return h(v.sur)+", "+h(bare(e.author).split(/\s+/)[0])+". ";})():"";
  return who+'"'+h(e.title)+'." <i>'+h(host(e.url))+'</i>, '+h(e.year||"s.f.")+(e.url?", "+h(e.url):"")+".";
}
function renderWork(){
  var box=$("snips");
  if(!work.length){
    box.innerHTML='<div class="empty">Todavía no has guardado ninguna fuente.<br>Analiza una en la pestaña 1 y pulsa «Guardar en mi trabajo».</div>';
    $("bib").innerHTML='<span style="color:var(--muted)">Tu bibliografía aparecerá aquí, ya formateada.</span>';
    $("warnbib").textContent=""; return;
  }
  box.innerHTML=work.map(function(e,i){
    var lbl=e.level==="ok"?"sólida":e.level==="warn"?"revisar":"débil";
    return '<div class="snip lv-'+esc(e.level)+'"><q>'+esc(e.title)+'</q><div class="meta">'+
      '<span class="tag t-'+esc(e.level)+'">'+esc(e.score)+'/100 · '+lbl+'</span><span>'+esc(host(e.url))+'</span>'+
      '<span>'+esc(e.author||"sin autor")+'</span><span>'+esc(e.year||"sin fecha")+'</span>'+
      '<button class="x" type="button" data-i="'+i+'" title="Quitar">✕</button></div></div>';
  }).join("");
  var fmt=$("fmt").value;
  $("bib").innerHTML=ordered().map(function(e){return "<div>"+(fmt==="apa"?apa(e,esc):mla(e,esc))+"</div>";}).join("");
  var weak=work.filter(function(e){return e.level!=="ok";}).length, tot=work.length;
  var msg;
  if(!weak)msg=tot===1?"✓ Tu única fuente pasó el semáforo en verde.":"✓ Las "+tot+" fuentes de tu trabajo pasaron el semáforo en verde.";
  else if(tot===1)msg="⚠ Tu única fuente no llegó a verde. Busca otra antes de entregar.";
  else if(weak===1)msg="⚠ 1 de tus "+tot+" fuentes no llegó a verde. Cámbiala antes de entregar si puedes.";
  else msg="⚠ "+weak+" de tus "+tot+" fuentes no llegaron a verde. Cámbialas antes de entregar si puedes.";
  $("warnbib").innerHTML=msg;
}
/* Tanto APA como MLA ordenan alfabéticamente por apellido */
function sortKey(e){return (e.author?invert(e.author).sur:host(e.url)).toLowerCase();}
function ordered(){
  return work.slice().sort(function(a,b){
    return sortKey(a).localeCompare(sortKey(b),"es",{sensitivity:"base"});
  });
}
function bibText(){
  var fmt=$("fmt").value;
  return (fmt==="apa"?"Referencias\n\n":"Obras citadas\n\n")+
    ordered().map(function(e){return (fmt==="apa"?apa(e):mla(e)).replace(/<\/?i>/g,"");}).join("\n\n")+"\n";
}

/* ==================== IA (opcional) ==================== */
var sampler=null;
if(window.claude&&window.claude.use){
  window.claude.use("sample").then(function(s){
    if(!s)return; sampler=s; $("ai1").hidden=false; $("ai2").hidden=false;
  }).catch(function(){});
}
function runAI(btn,box,txt,prompt){
  if(!sampler)return;
  btn.disabled=true; var old=btn.textContent; btn.textContent="Leyendo…";
  box.hidden=false; txt.textContent="Pensando…";
  sampler(prompt,{modelTier:"default",onText:function(e){txt.textContent=e.text;}})
    .then(function(r){txt.textContent=r.text;})
    .catch(function(err){txt.textContent="No se pudo completar el análisis con IA ("+(err&&err.code||"error")+"). El análisis de señales de arriba sigue siendo válido.";})
    .then(function(){btn.disabled=false; btn.textContent=old;});
}

/* ==================== EVENTOS ==================== */
(function(){
  var TABS=["tab-src","tab-cite","tab-work"];
  function activar(id,foco){
    TABS.forEach(function(o){
      var sel=o===id;
      $(o).setAttribute("aria-selected",sel);
      $(o).tabIndex=sel?0:-1;                     /* roving tabindex */
      $($(o).getAttribute("aria-controls")).hidden=!sel;
    });
    if(foco)$(id).focus();
    if(id==="tab-work")renderWork();
  }
  TABS.forEach(function(id,n){
    $(id).tabIndex=(n===0?0:-1);
    $(id).addEventListener("click",function(){activar(id,false);});
    /* flechas, Inicio y Fin: patron de pestanas de la WAI */
    $(id).addEventListener("keydown",function(e){
      var d=e.key==="ArrowRight"?1:e.key==="ArrowLeft"?-1:0;
      if(d){e.preventDefault();activar(TABS[(n+d+TABS.length)%TABS.length],true);return;}
      if(e.key==="Home"){e.preventDefault();activar(TABS[0],true);}
      if(e.key==="End"){e.preventDefault();activar(TABS[TABS.length-1],true);}
    });
  });
})();
$("go").addEventListener("click",analizar);
$("u").addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();analizar();}});
/* se empieza a leer la página en cuanto el alumno termina de escribir la dirección */
$("u").addEventListener("change",function(){olvidarAuto();pedirFuente();if(last||fuenteURL)renderSource();});
$("clr").addEventListener("click",function(){
  $("u").value="";$("t").value="";$("autor").value="";$("anio").value="";$("frag").checked=false;
  delete $("autor").dataset.auto; delete $("anio").dataset.auto;
  if(window.VeriTechArchivos)window.VeriTechArchivos.quitar();
  fuenteURL=null; estadoURL("");
  renderSource();
});
["autor","anio"].forEach(function(id){
  $(id).addEventListener("input",function(){
    delete this.dataset.auto;
    if(this.value.trim()){this.classList.remove("falta");$(id+"-aviso").hidden=true;}
  });
  $(id).addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();renderSource();}});
});
$("frag").addEventListener("change",function(){if(last)renderSource();});
/* Un texto nuevo (pegado o sacado de un archivo) trae su propio autor y año */
$("t").addEventListener("input",function(){
  ["autor","anio"].forEach(function(id){if($(id).dataset.auto){$(id).value="";delete $(id).dataset.auto;}});
});
function olvidarAuto(){["autor","anio"].forEach(function(id){if($(id).dataset.auto){$(id).value="";delete $(id).dataset.auto;}});}
document.addEventListener("veritech:archivo",function(){olvidarAuto();analizar();});
$("go2").addEventListener("click",renderClaim);
$("clr2").addEventListener("click",function(){$("claim").value="";$("srctext").value="";renderClaim();});
$("save").addEventListener("click",function(){
  renderSource();                        /* reanaliza por si editaste el texto */
  if(!last){flash("Primero escribe la dirección de la página, pega su texto o sube un archivo.","bad");return;}
  var ttl=last.titulo||title(last.full||last.text), k=(last.url||"")+"|"+ttl;
  if(work.some(function(e){return (e.url||"")+"|"+e.title===k;})){flash("Esa fuente ya está en tu trabajo.","warn");return;}
  work.push({title:ttl,url:last.url,author:last.author,year:last.year,score:last.score,level:last.level});
  save(); flash("Fuente guardada.","ok"); $("tab-work").click();
});
$("snips").addEventListener("click",function(e){
  var b=e.target.closest("button[data-i]"); if(!b)return;
  work.splice(parseInt(b.dataset.i,10),1); save(); renderWork();
});
$("fmt").addEventListener("change",renderWork);
var armed=false, armTimer=null;
$("wipe").addEventListener("click",function(){
  if(!work.length){flash("No hay nada que borrar.","warn");return;}
  if(!armed){
    armed=true; $("wipe").textContent="¿Seguro? Pulsa otra vez";
    clearTimeout(armTimer);
    armTimer=setTimeout(function(){armed=false;$("wipe").textContent="Borrar todo";},4000);
    return;
  }
  clearTimeout(armTimer); armed=false; $("wipe").textContent="Borrar todo";
  work=[]; save(); renderWork(); flash("Trabajo vaciado.","ok");
});
function legacyCopy(txt){
  try{
    var ta=document.createElement("textarea");
    ta.value=txt; ta.setAttribute("readonly","");
    ta.style.cssText="position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0,txt.length);
    var ok=document.execCommand("copy"); document.body.removeChild(ta); return ok;
  }catch(e){return false;}
}
function copyBib(){
  if(!work.length){flash("Todavía no has guardado ninguna fuente.","warn");return;}
  var txt=bibText();
  var done=function(){flash("Bibliografía copiada. Pégala en tu trabajo.","ok");};
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(done).catch(function(){
      if(legacyCopy(txt))done(); else flash("Tu navegador bloqueó el portapapeles. Selecciona el texto de arriba y cópialo a mano.","bad");
    });
  } else if(legacyCopy(txt)) done();
  else flash("Tu navegador bloqueó el portapapeles. Selecciona el texto de arriba y cópialo a mano.","bad");
}
$("copy").addEventListener("click",copyBib);
/* Descarga normal del navegador: funciona en cualquier sitio donde se aloje
   la página. Dentro de claude.ai el marco la bloquea, y ahí se usa su propia
   capacidad de descarga. */
function blobDownload(txt){
  try{
    var blob=new Blob([txt],{type:"text/plain;charset=utf-8"});
    var a=document.createElement("a");
    a.href=URL.createObjectURL(blob); a.download="bibliografia.txt";
    document.body.appendChild(a); a.click();
    setTimeout(function(){URL.revokeObjectURL(a.href); a.remove();},1000);
    return true;
  }catch(e){return false;}
}
$("dl").addEventListener("click",function(){
  if(!work.length){flash("Todavía no has guardado ninguna fuente.","warn");return;}
  if(window.claude&&window.claude.use){
    window.claude.use("downloads").then(function(d){
      if(!d){ if(!blobDownload(bibText()))copyBib(); else flash("Archivo descargado.","ok"); return; }
      return d.save({filename:"bibliografia.txt",data:bibText()})
        .then(function(){flash("Archivo descargado.","ok");})
        .catch(function(){flash("Descarga cancelada. Usa «Copiar» si prefieres.","warn");});
    }).catch(function(){ if(!blobDownload(bibText()))copyBib(); });
  } else if(blobDownload(bibText())){
    flash("Archivo descargado.","ok");
  } else copyBib();
});
$("ai1").addEventListener("click",function(){
  if(!last)return;
  runAI($("ai1"),$("aibox1"),$("aitext1"),
    "Eres un bibliotecario escolar que enseña a estudiantes de secundaria a evaluar fuentes. En español, máximo 110 palabras, sin listas ni markdown. Analiza el texto de abajo y di: (1) si parece escrito por una persona experta o generado automáticamente para posicionar en buscadores, y en qué lo notas; (2) una sola pregunta concreta que el estudiante debería hacerse antes de citarlo. No digas si el contenido es verdadero o falso; habla solo de la calidad de la fuente.\n\nTEXTO:\n"+last.text.slice(0,3500));
});
$("ai2").addEventListener("click",function(){
  runAI($("ai2"),$("aibox2"),$("aitext2"),
    "En español, máximo 100 palabras, sin listas ni markdown. Un estudiante escribió esta AFIRMACIÓN en su trabajo y dice que la respalda con esta FUENTE. Di claramente si la fuente sostiene la afirmación, la sostiene solo en parte, o no la sostiene, y explica exactamente qué parte queda sin respaldo. Sé directo.\n\nAFIRMACIÓN:\n"+$("claim").value.slice(0,1200)+"\n\nFUENTE:\n"+$("srctext").value.slice(0,3500));
});

/* ==================== ARRANQUE ==================== */
load(); renderSource(); renderClaim(); renderWork();

/* Llegada desde el QR del marcapáginas (m.html envía /?url=…&desde=marcapaginas) */
(function(){
  var q; try{q=new URLSearchParams(location.search);}catch(e){return;}
  if(q.get("desde")==="marcapaginas")$("desde-marcapaginas").hidden=false;
  var u=(q.get("url")||"").trim();
  if(u&&dirValida(u)){$("u").value=u;analizar();}
})();
})();
