(function(){
"use strict";
var $=function(i){return document.getElementById(i);}, ft=null;
function flash(m){var e=$("flash");e.textContent=m;e.hidden=false;clearTimeout(ft);ft=setTimeout(function(){e.hidden=true;},2600);}

/* CSV con comillas, comas y saltos de línea dentro de los campos */
function parseCSV(txt){
  var filas=[],campo="",fila=[],dentro=false,c,i;
  txt=txt.replace(/\r\n/g,"\n").replace(/\r/g,"\n");
  for(i=0;i<txt.length;i++){
    c=txt[i];
    if(dentro){
      if(c==='"'){ if(txt[i+1]==='"'){campo+='"';i++;} else dentro=false; }
      else campo+=c;
    } else if(c==='"'){ dentro=true; }
    else if(c===","){ fila.push(campo); campo=""; }
    else if(c==="\n"){ fila.push(campo); filas.push(fila); fila=[]; campo=""; }
    else campo+=c;
  }
  if(campo!==""||fila.length){ fila.push(campo); filas.push(fila); }
  return filas.filter(function(f){return f.some(function(x){return x.trim()!=="";});});
}
function norm(s){return (s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim();}

var MIN={"menos de 10":5,"entre 10 y 30":20,"mas de 30":40};

function calcular(){
  var filas=parseCSV($("csv").value);
  if(filas.length<2){ $("aviso").hidden=false; $("aviso").textContent="No encontré datos. Asegúrate de pegar el archivo completo, con su primera fila de títulos."; return; }
  var cab=filas[0].map(norm), idx={};
  ["q1","q2","q3","q4","q5","q6","q7","origen"].forEach(function(k){
    idx[k]=cab.findIndex(function(h){return h===k||h.indexOf(k)>=0;});
  });
  if(idx.q1<0||idx.q2<0||idx.q3<0){
    $("aviso").hidden=false;
    $("aviso").textContent="No reconocí las columnas q1, q2 y q3 en la primera fila. Títulos encontrados: "+filas[0].join(" · ");
    return;
  }
  $("aviso").hidden=true;

  var todas=filas.slice(1).map(function(f){
    var d={};
    ["q1","q2","q3","q4","q5","q6","q7"].forEach(function(c){d[c]=idx[c]>=0?norm(f[idx[c]]):"";});
    d.origen=idx.origen>=0?norm(f[idx.origen]):"web";
    return d;
  }).filter(function(d){return d.q1||d.q2||d.q3;});
  /* Solo cuentan las respuestas llegadas desde la web. */
  var datos=todas.filter(function(d){return d.origen===""||d.origen==="web";});
  var descartadas=todas.length-datos.length;

  var N=datos.length;
  if(!N){ $("aviso").hidden=false; $("aviso").textContent="El archivo tiene títulos pero ninguna respuesta todavía."; return; }
  var pct=function(n,d){return d?Math.round(n/d*100):0;};

  /* 1 — no revisa el autor */
  var noRevisa=datos.filter(function(d){return d.q1==="casi nunca"||d.q1==="nunca";}).length;

  /* 2 — minutos promedio (excluye a quien no la hace) */
  var conBib=datos.filter(function(d){return MIN[d.q2]!==undefined;});
  var media=conBib.length?Math.round(conBib.reduce(function(a,d){return a+MIN[d.q2];},0)/conBib.length):0;

  /* 3 — fuente inventada por IA */
  var usaIA=datos.filter(function(d){return d.q3!==""&&d.q3.indexOf("no he usado")<0;});
  var fantasma=datos.filter(function(d){return d.q3.indexOf("si")===0;}).length;

  /* 4 — no sabe juzgar una fuente */
  var noSabe=datos.filter(function(d){return d.q4.indexOf("no")===0||d.q4.indexOf("mas o menos")===0;}).length;
  var conQ7=datos.filter(function(d){return d.q7!=="";});
  var adoptan=conQ7.filter(function(d){return d.q7.indexOf("si")===0;}).length;
  var quizas=conQ7.filter(function(d){return d.q7.indexOf("tal vez")===0;}).length;

  /* Las respuestas llegan de un formulario publico: cualquiera puede enviar texto
     arbitrario, asi que se escapa antes de pintarlo. */
  function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
  function grupo(titulo,col,orden){
    var cont={},tot=0;
    datos.forEach(function(d){ var v=d[col]; if(!v)return; cont[v]=(cont[v]||0)+1; tot++; });
    var claves=orden.filter(function(k){return cont[norm(k)];});
    Object.keys(cont).forEach(function(k){ if(claves.map(norm).indexOf(k)<0)claves.push(k); });
    return '<div class="dgrupo"><b>'+titulo+'</b>'+claves.map(function(k){
      var n=cont[norm(k)]||cont[k]||0, p=pct(n,tot);
      return '<div class="barra"><span>'+esc(k)+'</span><span class="bar"><i style="width:'+p+'%"></i></span><span class="pct">'+p+'% ('+n+')</span></div>';
    }).join("")+'</div>';
  }

  var f1=pct(noRevisa,N), f3=pct(fantasma,usaIA.length);
  $("salida").innerHTML=
    '<div class="card">'+
      '<div class="n"><b>'+N+'</b> respuestas contadas'+(descartadas?' <span style="opacity:.8">· '+descartadas+(descartadas===1?' fila de prueba descartada':' filas de prueba descartadas')+'</span>':'')+'</div>'+
      '<div class="stats">'+
        '<div class="stat"><span class="big">'+f1+'%</span><span class="lbl">nunca o casi nunca revisa quién escribió la página que cita.</span><span class="base">'+noRevisa+' de '+N+'</span></div>'+
        '<div class="stat"><span class="big">'+media+' min</span><span class="lbl">tardan, en promedio, armando la bibliografía.</span><span class="base">entre los '+conBib.length+' que sí la hacen</span></div>'+
        '<div class="stat"><span class="big">'+f3+'%</span><span class="lbl">usó IA y recibió una fuente que después no pudo encontrar.</span><span class="base">'+fantasma+' de los '+usaIA.length+' que han usado IA</span></div>'+
        (conQ7.length?'<div class="stat" style="border-color:var(--accent)"><span class="big">'+pct(adoptan+quizas,conQ7.length)+'%</span><span class="lbl">instalaría VeriTech o la probaría. <strong style="color:var(--ink)">El dato que valida el producto.</strong></span><span class="base">'+adoptan+' seguros · '+quizas+' tal vez · de '+conQ7.length+'</span></div>':'')+
      '</div>'+
      '<div class="frase"><p id="frase">Encuestamos a '+N+' compañeros de nuestro colegio. El '+f1+'% nunca revisa quién escribió la página que cita, tardan '+media+' minutos de media armando la bibliografía, y el '+f3+'% de quienes usan IA ya recibió una fuente que no existía.</p>'+
      '<div class="row"><button id="copiar" type="button">Copiar esta frase</button></div></div>'+
    '</div>'+
    '<div class="card"><h2>Desglose completo</h2><div class="desglose">'+
      grupo("¿Revisas quién escribió la página?","q1",["Siempre","A veces","Casi nunca","Nunca"])+
      grupo("¿Cuánto tardas con la bibliografía?","q2",["Menos de 10","Entre 10 y 30","Más de 30","No la hago"])+
      grupo("¿La IA te dio una fuente inexistente?","q3",["Sí, me ha pasado","No, nunca","No he usado IA"])+
      grupo("¿Sabrías explicar por qué una fuente es confiable?","q4",["Sí, con seguridad","Más o menos","No sabría"])+
      grupo("¿De dónde sacas la información?","q5",["Los primeros resultados de Google","Le pregunto a una IA","Libros o la biblioteca","Lo que mande el profesor"])+
      grupo("¿Te bajaron nota por las fuentes?","q6",["Sí","No","No estoy seguro"])+
      grupo("¿Instalarías la extensión?","q7",["Sí, ya mismo","Tal vez, si es fácil","No"])+
    '</div>'+
      (true?'<p class="lbl" style="font-size:.82rem;color:var(--muted)">Dato extra para la diapositiva 2: <strong style="color:var(--ink)">'+pct(noSabe,N)+'%</strong> no sabe explicar con seguridad por qué una fuente es confiable.</p>':"")+
    '</div>';

  var b=$("copiar");
  if(b)b.addEventListener("click",function(){
    var t=$("frase").textContent;
    var ok=function(){flash("Frase copiada.");};
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(t).then(ok).catch(function(){legacy(t)&&ok();});
    } else if(legacy(t)) ok();
  });
}
function legacy(t){
  try{var a=document.createElement("textarea");a.value=t;a.style.cssText="position:fixed;opacity:0";
    document.body.appendChild(a);a.select();var r=document.execCommand("copy");a.remove();return r;}catch(e){return false;}
}
$("calc").addEventListener("click",calcular);
$("limpiar").addEventListener("click",function(){
  $("csv").value=""; $("aviso").hidden=true;
  $("salida").innerHTML='<div class="vacio">Pega el CSV y pulsa Calcular.<br>Aquí aparecerán los tres números listos para la diapositiva 3.</div>';
});
})();
