/* VeriTech · motor de señales (semáforo de fuentes y verificador de citas).
   Lo usan index.js y calibracion.js. No toca el DOM ni la red.
   La prueba veritech-app/test/paridad.test.js lee el bloque MOTORES…RENDER de este archivo. */
var YEAR=new Date().getFullYear();
/* Cambiar al modificar reglas o pesos: la calibración guarda con qué versión se calculó cada puntaje. */
var MOTOR_VERSION="sitio-1.0";

/* ==================== MOTORES ==================== */
var FILLER=["en el mundo actual","en la era digital","es importante destacar","es importante mencionar",
"cabe destacar","cabe mencionar","juega un papel fundamental","juega un papel crucial","desempeña un papel fundamental",
"en última instancia","sin lugar a dudas","abre un mundo de posibilidades","vale la pena señalar",
"en el mundo de hoy","revoluciona la forma","sumérgete","desbloquea el potencial","en definitiva"];
var CLICKBAIT=["no vas a creer","los científicos no quieren","increíble","impactante","lo que pasó después",
"nunca imaginarás","el secreto que","esto te sorprenderá","verdades ocultas","el truco que","te dejará sin palabras",
"nadie te ha dicho","lo que nadie sabe"];
var ABSOLUTE=["está comprobado que","está demostrado que","todos los expertos coinciden","los expertos coinciden",
"es un hecho indiscutible","es un hecho que","nunca falla","siempre funciona","sin excepción alguna","es indudable que"];
var NUANCE=["según","de acuerdo con","de acuerdo a","sugiere que","podría","los datos indican","el estudio",
"la investigación","et al","fuente:","citado en","se estima","los resultados muestran","evidencia","publicado en"];
var MONTHS=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","setiembre","octubre","noviembre","diciembre"];

function countPhrases(low,list){var n=0,found=[];for(var i=0;i<list.length;i++){if(low.indexOf(list[i])>=0){n++;found.push(list[i]);}}return{n:n,found:found};}

function findAuthor(text){
  var N="[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ]+";
  var TIT="(?:Dr[ao]?|Dra|Prof|Lic|Mtr[ao]?|Ing|Mg)\\.[ \\t]*";
  var pats=[
    new RegExp("(?:^|\\n)[ \\t]*(?:[Pp]or|[Aa]utor(?:a|es)?|[Ee]scrito por|[Rr]edactado por|[Tt]exto de)[ \\t]*:?[ \\t]+((?:"+TIT+")?"+N+"(?:[ \\t]+"+N+"){1,3})"),
    new RegExp("(?:^|\\n|[ \\t])((?:"+TIT+")"+N+"(?:[ \\t]+"+N+"){1,3})"),
    /\bBy[ \t]+([A-Z][a-z]+(?:[ \t]+[A-Z][a-z]+){1,3})/
  ];
  for(var i=0;i<pats.length;i++){var m=text.match(pats[i]);if(m)return m[1].trim();}
  return null;
}
function findYear(text){
  var low=text.toLowerCase(),m,best=null;
  var mm=low.match(new RegExp("\\b\\d{1,2}\\s+de\\s+("+MONTHS.join("|")+")\\s+(?:de\\s+)?(\\d{4})"));
  if(mm)best=parseInt(mm[2],10);
  if(!best&&(m=text.match(/\b(20\d{2}|19\d{2})-(\d{2})-(\d{2})\b/)))best=parseInt(m[1],10);
  if(!best&&(m=text.match(/\b\d{1,2}\/\d{1,2}\/(20\d{2}|19\d{2})\b/)))best=parseInt(m[1],10);
  if(!best&&(m=low.match(/(?:publicado|actualizado|fecha|última revisión)[^\d]{0,24}(20\d{2}|19\d{2})/)))best=parseInt(m[1],10);
  if(!best){
    var all=text.match(/\b(19[5-9]\d|20[0-4]\d)\b/g);
    if(all){var ys=all.map(Number).filter(function(y){return y<=YEAR;});if(ys.length)best=Math.max.apply(null,ys);}
  }
  return best;
}
function analyzeSource(url,text){
  var checks=[],score=50,low=text.toLowerCase();
  var words=text.trim()?text.trim().split(/\s+/).length:0;
  function add(label,status,detail,pts){checks.push({label:label,status:status,detail:detail,pts:pts});score+=pts;}

  /* 1 autoría */
  var author=findAuthor(text);
  if(author)add("Autoría","ok","Firmado por "+author+". Se puede rastrear quién responde por lo que dice.",18);
  else add("Autoría","bad","Nadie firma este texto. Si no hay un responsable, no hay a quién pedirle cuentas.",-14);

  /* 2 fecha */
  var y=findYear(text);
  if(y===null)add("Fecha","bad","No aparece ninguna fecha. No sabes si esto se escribió ayer o hace quince años.",-12);
  else if(y>=YEAR-2)add("Fecha","ok","Publicado en "+y+". Información reciente.",16);
  else if(y>=YEAR-6)add("Fecha","warn","Publicado en "+y+". Tiene "+(YEAR-y)+" años: útil, pero comprueba si hay algo más nuevo.",7);
  else add("Fecha","bad","Publicado en "+y+" — hace "+(YEAR-y)+" años. En ciencia y tecnología eso suele estar obsoleto.",-6);

  /* 3 referencias */
  var links=(text.match(/https?:\/\//g)||[]).length;
  var acad=(text.match(/\([12]\d{3}\)/g)||[]).length+(text.match(/et al\.?/gi)||[]).length+(text.match(/\[\d{1,3}\]/g)||[]).length;
  var refs=links+acad;
  if(refs>=8)add("Referencias","ok",refs+" referencias o enlaces. Puedes ir a comprobar cada afirmación en su origen.",20);
  else if(refs>=3)add("Referencias","ok",refs+" referencias. Apoya lo que dice en fuentes rastreables.",12);
  else if(refs>=1)add("Referencias","warn","Solo "+refs+" referencia"+(refs>1?"s":"")+". Casi todo lo afirma sin respaldo.",4);
  else add("Referencias","bad","Cero referencias. Todo lo que afirma hay que creerlo porque sí.",-14);

  /* 4 dominio */
  if(url&&/^https?:\/\//i.test(url)){
    var host="";try{host=new URL(url).hostname.toLowerCase().replace(/^www\./,"");}catch(e){host="";}
    if(host){
      if(/\.(edu|gov|gob|mil)(\.[a-z]{2})?$/.test(host)||/\.ac\.[a-z]{2}$/.test(host))
        add("Dominio","ok",host+" es un dominio universitario o de gobierno. No se entregan a cualquiera.",14);
      else if(/(blogspot|wordpress\.com|wixsite|blogger|medium\.com|tumblr)/.test(host))
        add("Dominio","warn",host+" es una plataforma de blogs: cualquiera publica sin revisión previa.",-6);
      else if(/\.(info|biz|xyz|click|online|site|top)$/.test(host)||/\d{2,}/.test(host)||(host.match(/-/g)||[]).length>=2)
        add("Dominio","bad",host+" tiene las marcas típicas de un sitio hecho para atraer clics, no para informar.",-12);
      else if(/\.org(\.[a-z]{2})?$/.test(host))
        add("Dominio","warn",host+" es una organización. Mira qué defiende antes de darlo por neutral.",4);
      else add("Dominio","warn",host+" es un dominio comercial común. El dominio solo no dice nada: mira el resto.",0);
    }else add("Dominio","warn","No se pudo leer la dirección.",0);
  } else add("Dominio","warn","No pegaste la dirección. Añádela arriba y el análisis mejora.",0);

  /* 5 relleno / IA */
  var f=countPhrases(low,FILLER);
  if(f.n>=4)add("Escritura de relleno","bad",f.n+" frases de relleno («"+f.found.slice(0,3).join("», «")+"»…). Así escribe el texto generado en masa para posicionar en buscadores.",-16);
  else if(f.n>=2)add("Escritura de relleno","warn",f.n+" frases de relleno («"+f.found.join("», «")+"»). Puede ser texto automático o simplemente flojo.",-7);
  else add("Escritura de relleno","ok","Sin muletillas de relleno. El texto parece escrito por alguien que tenía algo que decir.",6);

  /* 6 sensacionalismo */
  var c=countPhrases(low,CLICKBAIT);
  var bangs=(text.match(/!/g)||[]).length;
  var caps=(text.match(/\b[A-ZÁÉÍÓÚÑ]{4,}\b/g)||[]).length;
  var sens=c.n+(bangs>=3?1:0)+(caps>=3?1:0);
  if(sens>=3)add("Sensacionalismo","bad","Lenguaje de carnada: «"+(c.found[0]||"mayúsculas y signos de exclamación")+"». Busca tu clic, no tu comprensión.",-14);
  else if(sens>=1)add("Sensacionalismo","warn","Algo de lenguaje exagerado. Ojo con el tono.",-6);
  else add("Sensacionalismo","ok","Tono sobrio, sin exageraciones ni carnada.",6);

  /* 7 certeza absoluta */
  var a=countPhrases(low,ABSOLUTE);
  if(a.n>=2)add("Certezas sin respaldo","bad","Afirma en absoluto («"+a.found.slice(0,2).join("», «")+"») sin mostrar de dónde lo saca. La ciencia rara vez habla así.",-9);
  else if(a.n===1)add("Certezas sin respaldo","warn","Usa «"+a.found[0]+"» sin citar quién lo demostró.",-4);
  else add("Certezas sin respaldo","ok","No presenta opiniones disfrazadas de hechos indiscutibles.",4);

  /* 8 matiz */
  var n=countPhrases(low,NUANCE);
  if(n.n>=4)add("Precisión","ok","Atribuye lo que dice («"+n.found.slice(0,3).join("», «")+"»…). Señal de alguien que sabe distinguir dato de opinión.",10);
  else if(n.n>=2)add("Precisión","warn","Algo de atribución, pero poca.",4);
  else add("Precisión","bad","Nunca dice de dónde viene la información. Todo suena a verdad revelada.",-6);

  /* 9 profundidad */
  if(words<120)add("Profundidad","bad","Solo "+words+" palabras. Demasiado breve para tratar el tema en serio.",-8);
  else if(words<400)add("Profundidad","warn",words+" palabras. Sirve para una idea general, no para un trabajo a fondo.",0);
  else if(words<1200)add("Profundidad","ok",words+" palabras. Extensión suficiente para desarrollar el tema.",5);
  else add("Profundidad","ok",words+" palabras. Tratamiento extenso del tema.",8);

  score=Math.max(0,Math.min(100,Math.round(score)));
  var level=score>=70?"ok":(score>=40?"warn":"bad");
  return {score:score,level:level,checks:checks,author:author,year:y,words:words};
}

var STOP=("de la que el en y a los del se las por un para con no una su al lo como más pero sus le ya o "+
"este sí porque esta entre cuando muy sin sobre también me hasta hay donde quien desde todo nos durante todos "+
"uno les ni contra otros ese eso ante ellos e esto mí antes algunos qué unos yo otro otras otra él tanto esa "+
"estos mucho quienes nada muchos cual poco ella estar estas algunas algo nosotros es son fue ser han ha haber "+
"su sus dos tres cada toda todas the of and to in a is that it for on").split(/\s+/);
function terms(s){
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9ñ\s]/g," ")
    .split(/\s+/).filter(function(w){return w.length>3&&STOP.indexOf(w)<0;});
}
function stem(w){return w.replace(/(ciones|cion|mente|idades|idad|ancia|encia|ando|iendo|ados|adas|ado|ada|es|as|os|s)$/,"");}
function checkClaim(claim,src){
  var ct=terms(claim),st=terms(src).map(stem);
  /* se compara sin tildes, pero se muestra la palabra tal como la escribiste */
  var shown={};
  claim.toLowerCase().replace(/[^a-z0-9áéíóúüñ\s]/g," ").split(/\s+/).forEach(function(w){
    var f=w.normalize("NFD").replace(/[\u0300-\u036f]/g,""); if(f&&!shown[f])shown[f]=w;
  });
  var uniq=[],seen={};
  ct.forEach(function(w){var k=stem(w); if(!seen[k]){seen[k]=1;uniq.push({word:shown[w]||w,key:k});}});
  var hits=uniq.filter(function(o){return st.indexOf(o.key)>=0;});
  var misses=uniq.filter(function(o){return st.indexOf(o.key)<0;});
  var pct=uniq.length?Math.round(hits.length/uniq.length*100):0;
  var level=pct>=65?"ok":(pct>=35?"warn":"bad");
  return {pct:pct,level:level,hits:hits,misses:misses,total:uniq.length};
}

/* ==================== RENDER (fin del motor) */
