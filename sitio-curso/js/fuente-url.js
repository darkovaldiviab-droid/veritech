/* VeriTech · leer la fuente completa desde su dirección.
   Con esto el alumno puede pegar solo el párrafo que va a citar (o nada) y aun así
   se evalúa la fuente entera: su autor, su fecha, sus referencias y su contenido.

   Pide la página a /api/fuente (netlify/functions/fuente.mjs), que solo la descarga.
   Todo el análisis se hace aquí, en el navegador:
   - Página web: se lee con DOMParser, que no ejecuta scripts ni carga imágenes.
     Autor y fecha salen de los metadatos (citation_*, article:*, JSON-LD, author…);
     el texto, de <article> o <main>, sin menús ni pies de página.
   - PDF: se lee con pdf.js (archivos.js).
   Al servidor solo va la dirección, nunca el texto pegado. */
(function(){
"use strict";
var YEAR_ACTUAL=new Date().getFullYear();
var cache={};

function anio(v){
  var m=String(v||"").match(/\b(19\d{2}|20\d{2})\b/);
  var y=m?parseInt(m[1],10):null;
  return y&&y<=YEAR_ACTUAL?y:null;
}
function nombre(v){
  /* «Por Ana Pérez*», «Ana Pérez,» → «Ana Pérez» (el asterisco suele remitir a una nota del cargo) */
  var t=String(v||"").replace(/\s+/g," ").trim().replace(/^(por|by)\s+/i,"").replace(/[\s*†‡,;:.|\-–—]+$/,"");
  if(!t||t.length>90||/^https?:|@|^\W+$/i.test(t))return "";
  return t;
}

/* ---------- JSON-LD: objetos con author / datePublished / headline ---------- */
function objetosLD(doc){
  var out=[];
  [].forEach.call(doc.querySelectorAll('script[type="application/ld+json"]'),function(s){
    var d; try{d=JSON.parse(s.textContent);}catch(e){return;}
    (function recorrer(x,prof){
      if(!x||typeof x!=="object"||prof>4)return;
      if(Array.isArray(x)){x.forEach(function(y){recorrer(y,prof+1);});return;}
      out.push(x);
      if(x["@graph"])recorrer(x["@graph"],prof+1);
    })(d,0);
  });
  return out;
}
function autorLD(a){
  if(!a)return "";
  if(Array.isArray(a))return autorLD(a[0]);
  if(typeof a==="string")return nombre(a);
  return nombre(a.name||"");
}

/* ---------- HTML ---------- */
var FUERA="script,style,noscript,template,nav,header,footer,aside,form,iframe,svg,button,select,[role=navigation],[role=banner],[role=contentinfo],[aria-hidden=true],.comments,#comments,.share,.social,.related,.newsletter,.cookie,.cookies";
function extraerHTML(html,urlFinal){
  var doc=new DOMParser().parseFromString(html,"text/html");
  function meta(sel){var el=doc.querySelector(sel);return el?(el.getAttribute("content")||el.getAttribute("datetime")||"").trim():"";}
  function metas(sel){return [].map.call(doc.querySelectorAll(sel),function(el){return (el.getAttribute("content")||"").trim();}).filter(Boolean);}
  var ld=objetosLD(doc), art=ld.filter(function(o){return o.author||o.datePublished;})[0]||{};

  var autores=metas('meta[name="citation_author"]').map(nombre).filter(Boolean);
  /* citation_author viene como «Apellido, Nombre»: se usa el primer autor, en orden natural,
     que es como lo espera la bibliografía («Nombre Apellido» → «Apellido, N.») */
  var primero=autores.length?autores[0].replace(/^([^,]+),\s*(.+)$/,"$2 $1"):"";
  var autor=primero||
    autorLD(art.author)||
    nombre(meta('meta[name="author"]'))||nombre(meta('meta[name="dc.creator" i]'))||nombre(meta('meta[name="DC.Creator"]'))||
    nombre(meta('meta[property="article:author"]'))||nombre(meta('meta[name="parsely-author"]'))||
    nombre((doc.querySelector('[itemprop="author"] [itemprop="name"],[itemprop="author"],[rel="author"]')||{}).textContent);

  var fecha=anio(meta('meta[name="citation_publication_date"]'))||anio(meta('meta[name="citation_date"]'))||
    anio(art.datePublished)||anio(meta('meta[property="article:published_time"]'))||
    anio(meta('meta[name="date"]'))||anio(meta('meta[name="dc.date" i]'))||anio(meta('meta[name="DC.date.issued"]'))||
    anio(meta('meta[itemprop="datePublished"]'))||anio(meta('time[datetime]'))||
    anio(art.dateModified)||anio(meta('meta[property="article:modified_time"]'));

  var titulo=meta('meta[name="citation_title"]')||(typeof art.headline==="string"?art.headline:"")||
    meta('meta[property="og:title"]')||((doc.querySelector("title")||{}).textContent||"").trim();

  /* contenido: el artículo, sin menús, pies, comentarios ni botones */
  var raiz=doc.querySelector("article")||doc.querySelector("main,[role=main]")||doc.body;
  if(!raiz)return {texto:"",autor:autor,anio:fecha,titulo:titulo,enlaces:0};
  raiz=raiz.cloneNode(true);
  [].forEach.call(raiz.querySelectorAll(FUERA),function(el){el.remove();});
  var bloques=[].map.call(raiz.querySelectorAll("h1,h2,h3,h4,p,li,blockquote,figcaption,td,pre,dd,dt"),function(el){
    return el.textContent.replace(/\s+/g," ").trim();
  }).filter(function(t){return t.length>1;});
  var texto=bloques.join("\n");
  if(texto.split(/\s+/).length<60)texto=raiz.textContent.replace(/[ \t]+/g," ").replace(/\n\s*\n+/g,"\n").trim();
  if(titulo&&texto.indexOf(titulo)<0)texto=titulo+"\n"+texto;

  /* enlaces del contenido a otros sitios: son sus referencias */
  var propio=""; try{propio=new URL(urlFinal).hostname.replace(/^www\./,"");}catch(e){}
  var vistos={};
  [].forEach.call(raiz.querySelectorAll("a[href]"),function(a){
    var h; try{h=new URL(a.getAttribute("href"),urlFinal);}catch(e){return;}
    if(!/^https?:$/.test(h.protocol))return;
    var host=h.hostname.replace(/^www\./,"");
    if(!host||host===propio||host.endsWith("."+propio))return;
    if(/(facebook|twitter|x\.com|instagram|whatsapp|linkedin|t\.me|pinterest|tiktok|youtube\.com\/(channel|user|@))/.test(host))return;
    vistos[h.origin+h.pathname]=1;
  });
  return {texto:texto,autor:autor,anio:fecha,titulo:titulo.slice(0,200),enlaces:Object.keys(vistos).length};
}
function decodificar(buf,charset){
  var cs=charset;
  if(!cs){
    var inicio=new TextDecoder("latin1").decode(buf.slice(0,4096));
    cs=(inicio.match(/<meta[^>]+charset=["']?([\w-]+)/i)||[])[1]||"utf-8";
  }
  try{return new TextDecoder(cs).decode(buf);}catch(e){return new TextDecoder("utf-8").decode(buf);}
}

/* ---------- PDF ---------- */
function extraerPDF(buf,aviso){
  if(!window.VeriTechArchivos)return Promise.reject(new Error("Falta el lector de PDF."));
  return window.VeriTechArchivos.textoPDF(buf,aviso).then(function(d){
    var texto=d.textos.join("\n\n");
    if(texto.replace(/\s/g,"").length<30*d.textos.length)
      throw new Error("Ese PDF es escaneado (son fotos de páginas). Descárgalo y súbelo con «Subir archivo» para leerlo.");
    /* los metadatos del PDF solo cuentan si la portada no dice nada */
    var autor=typeof findAuthor==="function"&&findAuthor(texto)?"":d.meta.autor;
    var fecha=typeof findYear==="function"&&findYear(texto)!==null?null:d.meta.anio;
    return {texto:texto,autor:autor,anio:fecha,titulo:d.meta.titulo,enlaces:0,paginas:d.total};
  });
}

/* ---------- pedir la fuente ---------- */
function leer(url,aviso){
  if(cache[url])return cache[url];
  var p=fetch("/api/fuente?url="+encodeURIComponent(url),{credentials:"same-origin",cache:"no-store"})
    .then(function(r){
      var tipo=r.headers.get("X-Fuente-Tipo");
      if(!r.ok||!tipo){
        return r.json().catch(function(){return {};}).then(function(j){
          var e=new Error(j.mensaje||(r.status===404?"El lector de páginas no está disponible en esta versión de la web.":"No se pudo abrir la página."));
          e.codigo=j.error||"sin-servicio"; throw e;
        });
      }
      var final=decodeURI(r.headers.get("X-Fuente-Url")||url);
      return r.arrayBuffer().then(function(buf){
        if(tipo==="pdf")return extraerPDF(buf,aviso).then(function(d){d.tipo="pdf";d.url=final;return d;});
        var d=extraerHTML(decodificar(buf,r.headers.get("X-Fuente-Charset")),final);
        if(d.texto.split(/\s+/).length<40)
          throw new Error("La página casi no tiene texto que se pueda leer (quizá se arma con JavaScript o pide iniciar sesión). Copia y pega su texto a mano.");
        d.tipo="html"; d.url=final; return d;
      });
    });
  cache[url]=p;
  /* un error se recuerda 30 s (para no repetir la petición en cada clic) y luego se reintenta */
  p.catch(function(){setTimeout(function(){if(cache[url]===p)delete cache[url];},30000);});
  return p;
}

window.VeriTechURL={leer:leer,extraerHTML:extraerHTML};
})();
