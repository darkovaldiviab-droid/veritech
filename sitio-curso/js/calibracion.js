/* Calibración: el docente juzga una fuente y, al enviar, se calcula el puntaje de VeriTech
   con el mismo motor de la herramienta (motor.js). El texto de la página no se envía. */
(function(){
  "use strict";
  var $=function(id){return document.getElementById(id);};
  var form=$("calibracion"), CUENTA="veritech.calibracion.n", ALIAS="veritech.calibracion.docente";
  var NIVEL={ok:"confiable",warn:"dudosa",bad:"no confiable"};
  var ETIQUETA={ok:"Verde",warn:"Amarillo",bad:"Rojo"};
  function leer(k){try{return localStorage.getItem(k);}catch(e){return null;}}
  function poner(k,v){try{localStorage.setItem(k,v);}catch(e){}}
  function contar(){
    var n=parseInt(leer(CUENTA)||"0",10)||0;
    $("contador").textContent=n?("Lleva "+n+(n===1?" fuente calificada":" fuentes calificadas")+" en este navegador"):"";
    return n;
  }
  var alias=leer(ALIAS); if(alias)form.elements.docente.value=alias;
  contar();

  var ultimo=null;
  window.VeriTechAntesDeEnviar=function(){
    var r=analyzeSource(form.elements.url.value.trim(),$("texto").value);
    var juicio=form.querySelector('input[name="juicio_docente"]:checked').value;
    form.elements.puntaje_veritech.value=r.score;
    form.elements.nivel_veritech.value=NIVEL[r.level];
    form.elements.coincide.value=NIVEL[r.level]===juicio?"si":"no";
    form.elements.senales.value=r.checks.map(function(c){return c.label+":"+c.status+":"+(c.pts>0?"+":"")+c.pts;}).join(" | ");
    form.elements.palabras.value=r.words;
    form.elements.version_motor.value=MOTOR_VERSION;
    ultimo={r:r,juicio:juicio};
    return true;
  };
  window.VeriTechDespuesDeEnviar=function(){
    poner(CUENTA,String((parseInt(leer(CUENTA)||"0",10)||0)+1));
    poner(ALIAS,form.elements.docente.value.trim());
    var r=ultimo.r, igual=NIVEL[r.level]===ultimo.juicio;
    $("r-docente").textContent=ultimo.juicio.charAt(0).toUpperCase()+ultimo.juicio.slice(1);
    $("r-veritech").textContent=ETIQUETA[r.level]+" · "+r.score+"/100";
    $("r-veritech").className="n-"+r.level;
    $("r-coincide").textContent=igual?"Coinciden. Gracias: cada caso nos dice si el semáforo va bien encaminado."
      :"No coinciden. Justamente estos casos son los que más nos ayudan a corregir el semáforo.";
    form.hidden=true; contar();
  };
  $("otra").addEventListener("click",function(){
    form.elements.url.value=""; $("texto").value=""; form.elements.motivo.value="";
    [].forEach.call(form.querySelectorAll('input[name="juicio_docente"]'),function(i){i.checked=false;});
    $("thanks").hidden=true; form.hidden=false; form.elements.url.focus();
  });
})();
