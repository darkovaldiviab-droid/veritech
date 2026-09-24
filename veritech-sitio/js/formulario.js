/* Envío de formularios de Netlify sin salir de la página.
   Sirve para cualquier <form data-netlify> que tenga #send, #error y #thanks.
   Si la página define window.VeriTechAntesDeEnviar(form), se llama antes de enviar
   (la usa calibracion.js para calcular el puntaje) y puede cancelar devolviendo false. */
(function(){
  "use strict";
  var form=document.querySelector('form[data-netlify]');
  if(!form)return;
  var button=document.getElementById('send'),error=document.getElementById('error'),thanks=document.getElementById('thanks');
  var texto=button.textContent;
  form.addEventListener('submit',function(event){
    event.preventDefault();
    if(!form.reportValidity())return;
    if(typeof window.VeriTechAntesDeEnviar==='function'&&window.VeriTechAntesDeEnviar(form)===false)return;
    button.disabled=true; button.textContent='Enviando…'; error.hidden=true;
    fetch(location.pathname,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams(new FormData(form)).toString()})
      .then(function(response){
        if(!response.ok)throw new Error('submit');
        if(typeof window.VeriTechDespuesDeEnviar==='function'){window.VeriTechDespuesDeEnviar(form);}
        else{form.hidden=true;}
        thanks.hidden=false; thanks.focus(); window.scrollTo({top:0,behavior:'smooth'});
      })
      .catch(function(){
        error.textContent='No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.';
        error.hidden=false;
      })
      .then(function(){button.disabled=false; button.textContent=texto;});
  });
})();
