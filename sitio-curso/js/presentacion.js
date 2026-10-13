(function(){
  var slides=[].slice.call(document.querySelectorAll('.slide'));
  var i=0, notesOn=false;
  var elNotes=document.getElementById('notes'), elWho=document.getElementById('who'),
      elNote=document.getElementById('note'), elCur=document.getElementById('cur'),
      elFill=document.getElementById('fill'), elTog=document.getElementById('toggle');
  document.getElementById('tot').textContent=slides.length;

  function render(){
    slides.forEach(function(s,n){ s.hidden = n!==i; });
    elCur.textContent=i+1;
    elFill.style.width=((i+1)/slides.length*100)+'%';
    elWho.textContent=slides[i].dataset.who||'';
    elNote.innerHTML=slides[i].dataset.note||'';
    elNotes.hidden=!notesOn;
    if(window.claude&&window.claude.hot&&window.claude.hot.snapshot){window.claude.hot.snapshot({i:i,notesOn:notesOn});}
  }
  function go(d){ i=Math.min(slides.length-1,Math.max(0,i+d)); render(); }

  document.getElementById('prev').onclick=function(){go(-1);};
  document.getElementById('next').onclick=function(){go(1);};
  elTog.onclick=function(){ notesOn=!notesOn; elTog.setAttribute('aria-pressed',notesOn); render(); };

  document.getElementById('full').onclick=function(){
    try{
      if(document.fullscreenElement){document.exitFullscreen();}
      else if(document.documentElement.requestFullscreen){document.documentElement.requestFullscreen();}
    }catch(err){}
  };

  document.addEventListener('keydown',function(e){
    // Mientras se escribe dentro de un hueco, el teclado es para escribir.
    if(document.activeElement&&document.activeElement.isContentEditable){
      if(e.key==='Enter'){e.preventDefault();document.activeElement.blur();}
      if(e.key==='Escape'){document.activeElement.blur();}
      return;
    }
    if(e.key==='e'||e.key==='E'){e.preventDefault();document.getElementById('editar').click();return;}
    if(e.key==='ArrowRight'||e.key==='PageDown'||e.key===' '){e.preventDefault();go(1);}
    else if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();go(-1);}
    else if(e.key==='n'||e.key==='N'){elTog.click();}
    else if(e.key==='f'||e.key==='F'){document.getElementById('full').click();}
    else if(e.key==='Home'){i=0;render();}
    else if(e.key==='End'){i=slides.length-1;render();}
  });

  /* ---------------- modo edición ---------------- */
  var phs=[].slice.call(document.querySelectorAll('.ph'));
  var original=phs.map(function(el){return el.textContent;});
  var elEd=document.getElementById('editar'), elBajar=document.getElementById('bajar'),
      elAyuda=document.getElementById('ayuda'), elFaltan=document.getElementById('faltan');
  var editando=false, LS='veritech.pitch.campos';

  function esNombre(t){return /^Nombre \d$/.test(t);}
  function marcar(){
    var faltan=0;
    phs.forEach(function(el,n){
      var cambiado=el.textContent.trim()!==original[n]&&el.textContent.trim()!=='';
      el.classList.toggle('listo',cambiado);
      if(!cambiado)faltan++;
    });
    elFaltan.textContent=faltan?('Faltan '+faltan+(faltan===1?' hueco por llenar':' huecos por llenar')):'✓ No falta ninguno';
    return faltan;
  }
  function guardar(){
    try{localStorage.setItem(LS,JSON.stringify(phs.map(function(el){return el.textContent;})));}catch(e){}
  }
  function cargar(){
    try{
      var v=JSON.parse(localStorage.getItem(LS)||'null');
      if(v&&v.length===phs.length)phs.forEach(function(el,n){el.textContent=v[n];});
    }catch(e){}
    marcar();
  }

  phs.forEach(function(el,n){
    el.addEventListener('input',function(){
      // Los nombres se repiten en la portada y en el cierre: se copian solos.
      if(esNombre(original[n])){
        phs.forEach(function(otro,m){
          if(m!==n&&original[m]===original[n])otro.textContent=el.textContent;
        });
      }
      marcar();
    });
    el.addEventListener('blur',function(){
      var t=el.textContent.replace(/\s+/g,' ').trim();
      el.textContent=t||original[n];
      if(esNombre(original[n])){
        phs.forEach(function(otro,m){ if(m!==n&&original[m]===original[n])otro.textContent=el.textContent; });
      }
      marcar(); guardar();
    });
    el.addEventListener('paste',function(e){
      e.preventDefault();
      var t=(e.clipboardData||window.clipboardData).getData('text').replace(/\s+/g,' ').trim();
      document.execCommand('insertText',false,t);
    });
  });

  elEd.onclick=function(){
    editando=!editando;
    document.body.classList.toggle('edit',editando);
    elEd.setAttribute('aria-pressed',editando);
    elBajar.hidden=!editando;
    elAyuda.hidden=!editando;
    phs.forEach(function(el){
      if(editando)el.setAttribute('contenteditable','true');
      else el.removeAttribute('contenteditable');
    });
    if(editando){marcar();
      var v=phs.filter(function(el){return !el.closest('.slide').hidden;})[0];
      if(v)v.focus();
    }
  };

  elBajar.onclick=function(){
    var eraEd=editando;
    // Se descarga la presentación limpia, con los textos ya escritos dentro.
    document.body.classList.remove('edit');
    phs.forEach(function(el){el.removeAttribute('contenteditable');});
    elBajar.hidden=true; elAyuda.hidden=true; elEd.setAttribute('aria-pressed','false');
    var html='<!doctype html>\n'+document.documentElement.outerHTML;
    if(eraEd){
      document.body.classList.add('edit');
      phs.forEach(function(el){el.setAttribute('contenteditable','true');});
      elBajar.hidden=false; elAyuda.hidden=false; elEd.setAttribute('aria-pressed','true');
    }
    /* Un archivo local o el sitio publicado descargan con un enlace normal;
       dentro del visor de artefactos hay que pedírselo a la plataforma. */
    function porEnlace(){
      try{
        var a=document.createElement('a');
        a.href=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));
        a.download='presentacion-veritech.html';
        document.body.appendChild(a); a.click();
        setTimeout(function(){URL.revokeObjectURL(a.href); a.remove();},1000);
        return true;
      }catch(err){return false;}
    }
    function descargar(){
      if(window.claude&&window.claude.use){
        window.claude.use('downloads').then(function(d){
          if(!d){porEnlace();return;}
          return d.save({filename:'presentacion-veritech.html',data:html}).catch(function(){});
        }).catch(function(){porEnlace();});
      } else porEnlace();
    }
    /* El archivo descargado se abre fuera del sitio: se le incrusta el script
       para que siga funcionando sin /js/presentacion.js. */
    var etiqueta='<script src="/js/presentacion.js"></'+'script>';
    fetch('/js/presentacion.js').then(function(r){if(!r.ok)throw 0;return r.text();})
      .then(function(js){html=html.replace(etiqueta,'<script>'+js+'</'+'script>');})
      .catch(function(){})
      .then(descargar);
  };

  cargar();

  function start(state){
    if(state&&typeof state.i==='number'){i=state.i; notesOn=!!state.notesOn; elTog.setAttribute('aria-pressed',notesOn);}
    render();
  }
  if(window.claude&&window.claude.hot&&window.claude.hot.ready){window.claude.hot.ready(start);}
  else{start((window.claude&&window.claude.hot&&window.claude.hot.data)||{});}
})();
