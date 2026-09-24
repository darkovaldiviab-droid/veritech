(function(){
"use strict";
var $=function(i){return document.getElementById(i);};
var f=$("f"), zona=$("zona");
var GUARDADO="veritech.borrador", ENVIADA="veritech.enviada";
function leer(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function poner(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function quitar(k){try{localStorage.removeItem(k);}catch(e){}}

/* Cada opción lleva su devolución: lo que verá la persona al terminar. */
var PREGUNTAS=[
 {id:"q1", t:"Cuando haces un trabajo, ¿revisas quién escribió la página que estás citando?",
  o:[["Siempre","Eres de los pocos. La mayoría no lo hace."],
     ["A veces","Cuando no lo haces es justo cuando más riesgo corres."],
     ["Casi nunca","VeriTech te lo dice en dos segundos, sin que lo busques."],
     ["Nunca","Entonces nunca sabes si te lo escribió un experto o un robot."]]},
 {id:"q2", t:"¿Cuántos minutos tardas armando la bibliografía?",
  o:[["Menos de 10","Rápido. Con VeriTech serían cero."],
     ["Entre 10 y 30","Media hora al mes que podrías no gastar."],
     ["Más de 30","Eso es una tarde entera al trimestre en dar formato."],
     ["No la hago","Y por eso es probable que te hayan bajado nota alguna vez."]]},
 {id:"q3", t:"¿Has usado IA para un trabajo y te dio una fuente que después no pudiste encontrar?",
  o:[["Sí, me ha pasado","No fue tu culpa: la IA se la inventó. Pasa muchísimo."],
     ["No, nunca","Ojo, puede pasar sin que te des cuenta."],
     ["No he usado IA","Cuando la uses, comprueba siempre que la fuente exista."]]},
 {id:"q4", t:"¿Sabrías explicar por qué una página de internet es confiable y otra no?",
  o:[["Sí, con seguridad","Entonces te va a gustar ver en qué se fija VeriTech."],
     ["Más o menos","VeriTech te enseña las señales mientras trabajas."],
     ["No sabría","Nadie nos lo enseñó. Ese es exactamente el problema."]]},
 {id:"q5", t:"¿De dónde sacas normalmente la información para un trabajo?",
  o:[["Los primeros resultados de Google","Google ordena por popularidad, no por veracidad."],
     ["Le pregunto a una IA","Rápido, pero hay que comprobar cada fuente que te dé."],
     ["Libros o la biblioteca","La opción más segura y la que casi nadie elige ya."],
     ["Lo que mande el profesor","Seguro, aunque te deja corto cuando hay que investigar."]]},
 {id:"q6", t:"¿Alguna vez te bajaron nota por las fuentes o por la bibliografía?",
  o:[["Sí","Te costó puntos algo que se puede evitar."],
     ["No","Todavía. A la mayoría le pasa tarde o temprano."],
     ["No estoy seguro","Casi nadie recibe explicación de por qué le bajaron."]]},
 {id:"q7", t:"¿Instalarías una extensión que revise tus fuentes y arme la bibliografía sola?",
  o:[["Sí, ya mismo","Gracias. Este dato es el que le presentamos al jurado."],
     ["Tal vez, si es fácil","Esa es la idea: instalarla una vez y que trabaje sola."],
     ["No","Nos sirve igual saberlo. Gracias por la sinceridad."]]}
];
var TOTAL=PREGUNTAS.length;
var resp={}, i=-1;

function guardar(){ poner(GUARDADO,JSON.stringify({r:resp,i:i})); }
function cargar(){
  try{var d=JSON.parse(leer(GUARDADO)||"null"); if(d&&d.r){resp=d.r; i=typeof d.i==="number"?d.i:-1;}}catch(e){}
}

function avance(){
  var hechas=PREGUNTAS.filter(function(p){return resp[p.id];}).length;
  $("avance").hidden = i<0;
  $("relleno").style.width=(hechas/TOTAL*100)+"%";
  $("paso").innerHTML="Pregunta <b>"+Math.min(i+1,TOTAL)+"</b> de "+TOTAL;
  var faltan=TOTAL-hechas;
  $("queda").textContent = faltan? (faltan===1?"falta 1":"faltan "+faltan) : "¡completa!";
}

function esc(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");}

function pintarIntro(){
  zona.innerHTML=
   '<div class="carta entra intro">'+
     '<h1>¿Cómo buscas información para tus trabajos?</h1>'+
     '<p style="color:var(--muted)">Es para un proyecto que estamos presentando en el colegio. '+
     'Queremos saber cómo lo hacemos de verdad los estudiantes.</p>'+
     '<div class="chips"><span class="chip">7 preguntas</span><span class="chip">Solo toca, no escribas nada</span><span class="chip naranja">Menos de 1 minuto</span></div>'+
     '<label class="consent" for="acepto">'+
       '<input type="checkbox" id="acepto">'+
       '<span>Acepto que mis respuestas se usen para este proyecto escolar. Son an\u00f3nimas: no se pide nombre ni correo. '+
       '<a href="/privacidad.html" target="_blank" rel="noopener">C\u00f3mo tratamos los datos</a></span>'+
     '</label>'+
     '<button type="button" class="btn" id="empezar" disabled>Empezar \u2192</button>'+
   '</div>';
  /* consentimiento previo y expreso: sin marcar la casilla no se puede empezar */
  var ok=$("acepto"), btn=$("empezar");
  ok.addEventListener("change",function(){ btn.disabled=!ok.checked; });
  btn.onclick=function(){ if(!ok.checked)return; i=0; pintar(); };
  $("avance").hidden=true;
}

function pintar(){
  if(i<0)return pintarIntro();
  if(i>=TOTAL)return enviar();
  var p=PREGUNTAS[i];
  zona.innerHTML=
   '<div class="carta entra">'+
     (i>0?'<button type="button" class="atras" id="atras">← Anterior</button>':'')+
     '<p class="preg">'+esc(p.t)+'</p>'+
     '<div class="ops">'+p.o.map(function(o,n){
        var sel = resp[p.id]===o[0];
        return '<label class="op'+(sel?' sel':'')+'" data-n="'+n+'">'+
               '<input type="radio" name="'+p.id+'" value="'+esc(o[0])+'"'+(sel?' checked':'')+'>'+
               '<span class="bolita"></span>'+esc(o[0])+'</label>';
      }).join("")+'</div>'+
   '</div>';

  [].forEach.call(zona.querySelectorAll(".op"),function(l){
    var r=l.querySelector("input");
    r.addEventListener("focus",function(){l.classList.add("foco");});
    r.addEventListener("blur",function(){l.classList.remove("foco");});
    r.addEventListener("change",function(){
      [].forEach.call(zona.querySelectorAll(".op"),function(o){o.classList.remove("sel");});
      l.classList.add("sel");
      resp[p.id]=r.value; guardar(); avance();
      /* avanza sola: es lo que hace que se sienta ágil */
      setTimeout(function(){ i++; pintar(); }, 260);
    });
  });
  if($("atras"))$("atras").onclick=function(){ i--; pintar(); };
  avance();
  window.scrollTo({top:0,behavior:"smooth"});
}

function filaEco(p,n){
  var val=resp[p.id], eco="";
  for(var j=0;j<p.o.length;j++) if(p.o[j][0]===val) eco=p.o[j][1];
  return '<div class="fila"><span class="n">'+(n+1)+'</span><div>'+
         '<p class="p">'+esc(p.t)+'</p>'+
         '<p class="r">'+esc(val||"—")+'</p>'+
         (eco?'<p class="eco-txt">'+esc(eco)+'</p>':'')+
         '</div></div>';
}

function pintarFinal(){
  $("avance").hidden=true;
  $("pie").textContent="Gracias por responder · Proyecto VeriTech";
  zona.innerHTML=
   '<div class="carta entra final" style="align-items:stretch">'+
     '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center">'+
       '<div class="tick">✓</div><h2>¡Listo, gracias!</h2>'+
       '<p style="color:var(--muted);max-width:34ch">Tu respuesta ya quedó guardada. Esto es lo que contestaste:</p>'+
     '</div>'+
     '<div class="eco">'+PREGUNTAS.map(filaEco).join("")+'</div>'+
     '<a class="cta" href="/">Ahora pruébala: analiza una página →</a>'+
     '<button type="button" class="otra" id="otra">No fui yo quien respondió · responder de nuevo</button>'+
   '</div>';
  $("otra").onclick=function(){ quitar(ENVIADA); quitar(GUARDADO); resp={}; i=-1; location.reload(); };
  window.scrollTo({top:0,behavior:"smooth"});
}

function enviar(){
  zona.innerHTML='<div class="carta entra" style="text-align:center"><p class="preg" style="font-size:1.1rem">Enviando tu respuesta…</p></div>';
  var d=new URLSearchParams();
  d.append("form-name","encuesta-veritech");
  d.append("origen","web");
  d.append("consentimiento","Sí, acepto");
  PREGUNTAS.forEach(function(p){ d.append(p.id, resp[p.id]||""); });
  fetch("/",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:d.toString()})
    .then(function(r){ if(!r.ok)throw new Error(r.status);
      poner(ENVIADA,String(Date.now())); quitar(GUARDADO); pintarFinal(); })
    .catch(function(){
      zona.innerHTML='<div class="carta entra">'+
        '<p class="preg" style="font-size:1.1rem">No se pudo enviar</p>'+
        '<p class="err">Revisa tu conexión. Tus respuestas no se han perdido.</p>'+
        '<button type="button" class="btn" id="reintentar">Reintentar</button></div>';
      $("reintentar").onclick=enviar;
    });
}

cargar();
if(leer(ENVIADA)) pintarFinal();
else { if(i>=TOTAL)i=TOTAL-1; pintar(); }
})();
