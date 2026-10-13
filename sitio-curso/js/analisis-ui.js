/* Interfaz de analisis-prueba.html. Todo lo que viene de los formularios es público,
   así que se pinta solo con textContent: nunca con innerHTML. */
(function(){
"use strict";
var A=window.VeriTechAnalisis, $=function(id){return document.getElementById(id);};
var resultados={calibracion:null,docentes:null,estudiantes:null};

/* Los formularios guardan los valores sin tildes; aquí se muestran bien escritos. */
var ETIQUETA={
  "si":"Sí","tal vez":"Tal vez","no":"No","no me corresponde":"No me corresponde opinar",
  "casi siempre":"Casi siempre","a veces":"A veces","pocas veces":"Pocas veces","no lo compare":"No lo comparé",
  "si, solos":"Sí, sin ayuda","con una explicacion breve":"Con una explicación breve","no por ahora":"No por ahora",
  "si, en la proxima tarea":"Sí, en la próxima tarea","si, con cambios":"Sí, con cambios",
  "muy facil":"Muy fácil","facil":"Fácil","ni facil ni dificil":"Ni fácil ni difícil","dificil":"Difícil","muy dificil":"Muy difícil",
  "si, todo funciono":"Sí, todo funcionó","funciono con detalles":"Funcionó con detalles","tuve problemas":"Tuvo problemas importantes","no pude usarla":"No pudo completar lo que quería",
  "si, lo entendi":"Sí, lo entendió","mas o menos":"Más o menos","no lo entendi":"No lo entendió","no analice ninguna fuente":"No analizó ninguna fuente",
  "confiable":"Confiable","dudosa":"Dudosa","no confiable":"No confiable"};
function et(v){return ETIQUETA[A.norm(v)]||v;}

/* h("p",{className:"x"},"texto",hijo…): crea nodos; los textos siempre como texto */
function h(tag,props){
  var el=document.createElement(tag);
  if(props)Object.keys(props).forEach(function(k){if(k==="style")Object.assign(el.style,props[k]);else if(k.indexOf("aria-")===0)el.setAttribute(k,props[k]);else el[k]=props[k];});
  for(var i=2;i<arguments.length;i++){var c=arguments[i]; if(c==null||c===false)continue;
    if(Array.isArray(c))c.forEach(function(x){if(x!=null)el.appendChild(typeof x==="object"?x:document.createTextNode(String(x)));});
    else el.appendChild(typeof c==="object"?c:document.createTextNode(String(c)));}
  return el;
}
function stat(valor,etiqueta,base,clase){return h("div",{className:"stat"},h("span",{className:"big"+(clase?" "+clase:"")},valor),h("span",{className:"lbl"},etiqueta),base?h("span",{className:"base"},base):null);}
function barras(titulo,datos,conEtiqueta){
  if(!datos||!datos.length)return null;
  return h("div",{className:"dgrupo"},h("b",null,titulo),datos.map(function(d){
    return h("div",{className:"barra"},h("span",null,conEtiqueta===false?d.valor:et(d.valor)),
      h("div",{className:"bar"},h("i",{style:{width:d.pct+"%"}})),h("span",{className:"pct"},d.pct+" % ("+d.n+")"));
  }));
}
function lista(titulo,textos,vacio){
  return h("div",null,h("h3",null,titulo+" ("+textos.length+")"),
    textos.length?h("ol",{className:"lista"},textos.map(function(t){return h("li",null,t);})):h("p",{className:"nota-p"},vacio||"Sin respuestas."));
}

/* ---------- pintar cada sección ---------- */
function pintarCalibracion(r){
  var cls=r.acuerdo>=70?"ok":(r.acuerdo<50?"bad":"");
  var cab=h("tr",null,h("th",null,"Docente dijo ↓ · VeriTech dijo →"),r.niveles.map(function(n){return h("th",{className:"num"},et(n));}));
  var filas=r.matriz.map(function(f,i){return h("tr",null,h("th",null,et(r.niveles[i])),f.map(function(v,j){return h("td",{className:"num"+(i===j?" diag":"")},v);}));});
  return [
    h("div",{className:"stats"},
      stat(r.acuerdo+" %","de coincidencia entre el semáforo y los docentes (meta: 70 %)",r.acuerdoN+" de "+r.n+" fuentes",cls),
      stat(r.graves.length,"desacuerdos graves: uno dijo «confiable» y el otro «no confiable»",null,r.graves.length?"bad":"ok"),
      stat(r.docentes,r.docentes===1?"docente calificó":"docentes calificaron","versión del motor: "+r.versiones.join(", "))),
    h("h3",null,"Dónde coinciden y dónde no"),
    h("p",{className:"nota-p"},"La diagonal verde son las coincidencias. Lo que queda fuera de ella son los desacuerdos."),
    h("div",{className:"tabla-wrap"},h("table",null,h("thead",null,cab),h("tbody",null,filas))),
    h("h3",null,"Qué señales corregir"),
    r.estricto.n?barras("VeriTech fue más estricto que el docente en "+r.estricto.n+" fuentes. Señales que salieron mal en esos casos:",
      r.estricto.senales.map(function(s){return {valor:s.senal,n:s.n,pct:s.pct};}),false):h("p",{className:"nota-p"},"VeriTech nunca fue más estricto que el docente."),
    r.permisivo.n?barras("VeriTech fue más permisivo que el docente en "+r.permisivo.n+" fuentes. Señales que salieron bien en esos casos:",
      r.permisivo.senales.map(function(s){return {valor:s.senal,n:s.n,pct:s.pct};}),false):h("p",{className:"nota-p"},"VeriTech nunca fue más permisivo que el docente."),
    h("p",{className:"nota-p"},"Una señal que aparece en casi todos los desacuerdos es candidata a cambiar de peso en js/motor.js."),
    r.porArea.length>1?h("div",null,h("h3",null,"Coincidencia por área"),h("div",{className:"tabla-wrap"},h("table",null,
      h("thead",null,h("tr",null,h("th",null,"Área"),h("th",{className:"num"},"Fuentes"),h("th",{className:"num"},"Coincidencia"))),
      h("tbody",null,r.porArea.map(function(a){return h("tr",null,h("td",null,a.area),h("td",{className:"num"},a.n),h("td",{className:"num"},a.acuerdo+" %"));}))))):null,
    h("div",null,h("h3",null,"Desacuerdos graves, uno por uno ("+r.graves.length+")"),
      r.graves.length?h("ol",{className:"lista"},r.graves.map(function(g){
        return h("li",null,g.url||"(sin dirección)",h("br"),h("small",null,"Docente: "+et(g.docente)+" · VeriTech: "+et(g.veritech)+(g.puntaje?" ("+g.puntaje+"/100)":"")+(g.motivo?" · «"+g.motivo+"»":"")));
      })):h("p",{className:"nota-p"},"Ninguno."))
  ];
}
function pintarDocentes(r){
  return [
    h("div",{className:"stats"},
      stat(r.n,r.n===1?"docente respondió":"docentes respondieron"),
      stat(r.utilidad==null?"—":r.utilidad,"de 5: utilidad del semáforo (meta: 4)",null,r.utilidad>=4?"ok":(r.utilidad!=null&&r.utilidad<3?"bad":"")),
      stat(Math.round(r.usariaSi*100)+" %","lo usaría en clase («Sí» o «Sí, con cambios»)",null,r.usariaSi>0.5?"ok":"bad")),
    h("div",{className:"desglose"},
      barras("¿El color coincidió con su criterio?",r.coincide),
      barras("¿Los alumnos entenderían solos el color?",r.claridad),
      barras("¿Lo usaría en una tarea real?",r.usaria),
      barras("Imprescindible para usarlo de forma habitual (porcentaje de docentes)",r.imprescindible,false),
      barras("¿El colegio debería contratarlo?",r.contratar)),
    lista("Lo que cambiarían primero",r.textos.cambio),
    lista("Casos en que el color no coincidió",r.textos.ejemplos),
    lista("Otras cosas imprescindibles",r.textos.otros),
    lista("Monto que les parece razonable",r.textos.precio),
    lista("Preocupaciones sobre datos o uso",r.textos.preocupaciones),
    lista("Docentes que aceptan una conversación",r.correos,"Nadie dejó su correo."),
    h("p",{className:"nota-p"},"Los correos solo pueden usarse para esa conversación y deben borrarse al terminar la prueba (política de privacidad).")
  ];
}
function pintarEstudiantes(r){
  return [
    h("div",{className:"stats"},
      stat(r.n,r.n===1?"estudiante respondió":"estudiantes respondieron"),
      stat(r.satisfaccion==null?"—":r.satisfaccion,"de 5: satisfacción"),
      stat(r.recomendacion==null?"—":r.recomendacion,"de 5: lo recomendaría a un compañero"),
      stat(Math.round(r.usariaSi*100)+" %","lo usaría en su próxima tarea («Sí» o «Tal vez»)",null,r.usariaSi>0.5?"ok":"bad")),
    h("div",{className:"desglose"},
      barras("¿Entendió por qué salió ese color?",r.entendio),
      barras("Facilidad de uso",r.facilidad),
      barras("¿Funcionó como esperaba?",r.funcionamiento),
      barras("¿Lo usaría en su próxima tarea?",r.usaria),
      barras("Función más útil",r.funcion,false),
      barras("Grado",r.grado,false)),
    lista("Lo que mejorarían primero",r.textos.mejora),
    lista("Problemas que encontraron",r.textos.problemas)
  ];
}
var PINTAR={calibracion:pintarCalibracion,docentes:pintarDocentes,estudiantes:pintarEstudiantes};

/* ---------- resumen «¿pedimos el piloto?» ---------- */
function pintarResumen(){
  var s=A.senalesSeguir(resultados.calibracion,resultados.docentes,resultados.estudiantes);
  var ICONO={"si":"✓","no":"✕","sin-datos":"·"};
  $("criterios").replaceChildren.apply($("criterios"),s.lista.map(function(i){
    return h("div",{className:"criterio est-"+i.estado},h("span",{className:"icono","aria-hidden":"true"},ICONO[i.estado]),
      h("p",null,i.texto,h("small",null,(i.estado==="si"?"Cumple · ":i.estado==="no"?"No cumple · ":"")+i.detalle)));
  }));
  var conDatos=s.lista.filter(function(i){return i.estado!=="sin-datos";}).length;
  $("conclusion").textContent=!conDatos?"Abre los CSV de abajo para ver el resultado."
    :s.cumplidos===4?"Se cumplen los 4 criterios: si la dirección acepta, pidan el piloto."
    :conDatos<4?"Van "+s.cumplidos+" de "+conDatos+" criterios con datos. Faltan archivos por abrir."
    :"Se cumplen "+s.cumplidos+" de 4. Antes del piloto, corrijan lo que no cumple.";
  $("alerta").hidden=!s.alerta; $("alerta").textContent=s.alerta||"";
  return s;
}
function textoResumen(){
  var s=pintarResumen(), c=resultados.calibracion, d=resultados.docentes, e=resultados.estudiantes, L=[];
  L.push("RESUMEN DE LA PRUEBA DE VERITECH","");
  s.lista.forEach(function(i){L.push((i.estado==="si"?"[✓] ":i.estado==="no"?"[✕] ":"[ ] ")+i.texto+" — "+i.detalle);});
  if(s.alerta)L.push("","ATENCIÓN: "+s.alerta);
  if(c&&!c.error){L.push("","Calibración: "+c.acuerdo+" % de coincidencia en "+c.n+" fuentes ("+c.docentes+" docentes). Desacuerdos graves: "+c.graves.length+".");
    if(c.estricto.senales[0])L.push("  Cuando VeriTech fue más estricto, la señal que más falló: "+c.estricto.senales[0].senal+" ("+c.estricto.senales[0].pct+" %).");
    if(c.permisivo.senales[0])L.push("  Cuando fue más permisivo, la señal que más pesó: "+c.permisivo.senales[0].senal+" ("+c.permisivo.senales[0].pct+" %).");}
  if(d&&!d.error){L.push("","Docentes ("+d.n+"): utilidad "+(d.utilidad==null?"—":d.utilidad)+"/5; lo usaría en clase: "+Math.round(d.usariaSi*100)+" %.");
    L.push("  Imprescindible: "+d.imprescindible.filter(function(i){return i.n;}).slice(0,3).map(function(i){return i.valor+" ("+i.pct+" %)";}).join("; ")+".");}
  if(e&&!e.error)L.push("","Estudiantes ("+e.n+"): satisfacción "+(e.satisfaccion==null?"—":e.satisfaccion)+"/5; lo usaría en su próxima tarea: "+Math.round(e.usariaSi*100)+" %.");
  return L.join("\n")+"\n";
}

/* ---------- carga de archivos ---------- */
var flashT=null;
function flash(m){var el=$("flash");el.textContent=m;el.hidden=false;clearTimeout(flashT);flashT=setTimeout(function(){el.hidden=true;},2600);}
var cargadores={};
[].forEach.call(document.querySelectorAll("section[data-tipo]"),function(sec){
  var tipo=sec.dataset.tipo, aviso=sec.querySelector(".aviso"), salida=sec.querySelector(".salida");
  function analizar(txt){
    var r=A[tipo](txt); resultados[tipo]=r.error?null:r;
    aviso.hidden=!r.error; aviso.textContent=r.error||"";
    salida.replaceChildren.apply(salida,r.error?[]:PINTAR[tipo](r));
    pintarResumen();
  }
  sec.querySelector("input[type=file]").addEventListener("change",function(ev){
    var f=ev.target.files[0]; if(!f)return;
    sec.querySelector(".nombre").textContent=f.name;
    var lector=new FileReader();
    lector.onload=function(){analizar(String(lector.result));};
    lector.onerror=function(){aviso.hidden=false;aviso.textContent="No se pudo leer el archivo.";};
    lector.readAsText(f,"utf-8");
  });
  sec.querySelector("details button").addEventListener("click",function(){analizar(sec.querySelector("textarea").value);});
  cargadores[tipo]=function(txt,nombre){sec.querySelector(".nombre").textContent=nombre||"";analizar(txt);};
});
/* Para cargar un CSV desde otro script (la versión publicada carga ejemplos al abrir). */
window.VeriTechCargarCSV=function(tipo,txt,nombre){if(cargadores[tipo])cargadores[tipo](txt,nombre);};
$("copiar").addEventListener("click",function(){
  var t=textoResumen();
  (navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(t):Promise.reject())
    .then(function(){flash("Resumen copiado.");},function(){flash("Tu navegador bloqueó el portapapeles.");});
});
pintarResumen();
})();
