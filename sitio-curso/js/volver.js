/* Botón «← Volver a la guía de la prueba».
   Aparece en cualquier página si, en esta pestaña, la persona pasó por la guía
   (o llegó con ?desde=guia). Quien usa la herramienta sin la guía no lo ve. */
(function(){
  "use strict";
  var CLAVE="veritech.desdeGuia", GUIA="/guia-prueba.html";
  function leer(){try{return sessionStorage.getItem(CLAVE)==="1";}catch(e){return false;}}
  function marcar(){try{sessionStorage.setItem(CLAVE,"1");}catch(e){}}
  var enGuia=location.pathname===GUIA;
  if(enGuia||/[?&]desde=guia\b/.test(location.search))marcar();
  if(enGuia||!leer())return;
  var a=document.createElement("a");
  a.className="volver-guia"; a.href=GUIA;
  a.innerHTML='<span aria-hidden="true">←</span> Volver a la guía de la prueba';
  var barra=document.createElement("div");
  barra.className="volver-guia-barra"; barra.appendChild(a);
  document.body.insertBefore(barra,document.body.firstChild);
  /* el botón se alinea con la columna de contenido de cada página (que tienen anchos distintos) */
  var columna=document.querySelector("body > .wrap, body > main, body > .deck");
  function alinear(){if(columna)barra.style.maxWidth=columna.getBoundingClientRect().width+"px";}
  alinear(); window.addEventListener("resize",alinear);
  /* el enlace pequeño de la cabecera a la guía queda repetido: se oculta */
  [].forEach.call(document.querySelectorAll('header a[href="'+GUIA+'"]'),function(el){el.hidden=true;});
})();
