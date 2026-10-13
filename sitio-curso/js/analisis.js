/* VeriTech · análisis de la prueba del colegio.
   Funciones puras (sin DOM): leen los CSV que exporta Netlify Forms y devuelven los números.
   Las usa js/analisis-ui.js y las prueba veritech-app/test/analisis.test.js. */
(function(g){
"use strict";

/* CSV con comillas, comas y saltos de línea dentro de los campos */
function parseCSV(txt){
  var filas=[],campo="",fila=[],dentro=false,c,i;
  txt=String(txt||"").replace(/^﻿/,"").replace(/\r\n/g,"\n").replace(/\r/g,"\n");
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
/* minúsculas, sin tildes ni espacios sobrantes: para comparar respuestas */
function norm(s){return String(s==null?"":s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s+/g," ").trim();}
/* clave de columna: «Juicio docente», «juicio_docente» e «imprescindible[]» se reconocen igual */
function clave(s){return norm(s).replace(/[^a-z0-9]/g,"");}

/* Filas del CSV → objetos con las columnas pedidas. Si falta alguna obligatoria, lo dice. */
function aObjetos(txt,columnas,obligatorias){
  var filas=parseCSV(txt);
  if(filas.length<1)return {error:"El archivo está vacío.",filas:[]};
  var cab=filas[0].map(clave), idx={}, faltan=[];
  columnas.forEach(function(k){
    /* solo coincidencia exacta de la clave: «imprescindible» no debe tomar «imprescindible_otro» */
    var i=cab.indexOf(clave(k));
    idx[k]=i;
    if(i<0&&(obligatorias||[]).indexOf(k)>=0)faltan.push(k);
  });
  if(faltan.length)return {error:"No encontré las columnas: "+faltan.join(", ")+". ¿Es el CSV del formulario correcto? Títulos del archivo: "+filas[0].join(" · "),filas:[]};
  var datos=filas.slice(1).map(function(f){
    var o={}; columnas.forEach(function(k){o[k]=idx[k]>=0?String(f[idx[k]]==null?"":f[idx[k]]).trim():"";}); return o;
  });
  return {error:null,filas:datos};
}

function contar(filas,campo,orden){
  var c={}; filas.forEach(function(f){var v=f[campo]; if(v)c[v]=(c[v]||0)+1;});
  var claves=Object.keys(c);
  if(orden)claves.sort(function(a,b){
    var ia=orden.findIndex(function(o){return norm(o)===norm(a);}), ib=orden.findIndex(function(o){return norm(o)===norm(b);});
    return (ia<0?99:ia)-(ib<0?99:ib)||c[b]-c[a];
  }); else claves.sort(function(a,b){return c[b]-c[a];});
  var total=claves.reduce(function(s,k){return s+c[k];},0);
  return claves.map(function(k){return {valor:k,n:c[k],pct:total?Math.round(c[k]/total*100):0};});
}
function promedio(filas,campo){
  var v=filas.map(function(f){return parseInt(f[campo],10);}).filter(function(x){return x>=1&&x<=5;});
  return v.length?Math.round(v.reduce(function(a,b){return a+b;},0)/v.length*10)/10:null;
}
function textos(filas,campo){return filas.map(function(f){return f[campo];}).filter(Boolean);}
/* proporción de filas cuyo campo es uno de los valores dados (comparación normalizada) */
function proporcion(filas,campo,valores){
  var con=filas.filter(function(f){return f[campo];});
  if(!con.length)return null;
  var vs=valores.map(norm);
  return con.filter(function(f){return vs.indexOf(norm(f[campo]))>=0;}).length/con.length;
}

/* ---------- calibración ---------- */
var NIVELES=["confiable","dudosa","no confiable"];
var RANGO={"confiable":2,"dudosa":1,"no confiable":0};
function calibracion(txt){
  var r=aObjetos(txt,["docente","area","url","juicio_docente","puntaje_veritech","nivel_veritech","coincide","senales","version_motor","motivo"],["juicio_docente","nivel_veritech"]);
  if(r.error)return {error:r.error};
  var filas=r.filas.filter(function(f){return RANGO[norm(f.juicio_docente)]!==undefined&&RANGO[norm(f.nivel_veritech)]!==undefined;});
  var n=filas.length;
  if(!n)return {error:"El archivo no tiene calificaciones todavía."};
  var matriz=NIVELES.map(function(d){return NIVELES.map(function(v){
    return filas.filter(function(f){return norm(f.juicio_docente)===d&&norm(f.nivel_veritech)===v;}).length;});});
  var acuerdo=filas.filter(function(f){return norm(f.juicio_docente)===norm(f.nivel_veritech);}).length;
  /* graves: uno dijo «confiable» y el otro «no confiable» */
  var graves=filas.filter(function(f){return Math.abs(RANGO[norm(f.juicio_docente)]-RANGO[norm(f.nivel_veritech)])===2;});
  /* más estricto: VeriTech puso un nivel peor que el docente → qué señales salieron mal.
     más permisivo: VeriTech puso un nivel mejor → qué señales salieron bien. */
  function senales(grupo,estado){
    var c={};
    grupo.forEach(function(f){
      String(f.senales||"").split("|").forEach(function(s){
        var p=s.trim().split(":"); if(p.length<2)return;
        if(norm(p[p.length-2])===estado){var nombre=p.slice(0,p.length-2).join(":").trim(); c[nombre]=(c[nombre]||0)+1;}
      });
    });
    return Object.keys(c).map(function(k){return {senal:k,n:c[k],pct:Math.round(c[k]/grupo.length*100)};})
      .sort(function(a,b){return b.n-a.n;});
  }
  var estricto=filas.filter(function(f){return RANGO[norm(f.nivel_veritech)]<RANGO[norm(f.juicio_docente)];});
  var permisivo=filas.filter(function(f){return RANGO[norm(f.nivel_veritech)]>RANGO[norm(f.juicio_docente)];});
  var porArea=contar(filas,"area").map(function(a){
    var g=filas.filter(function(f){return f.area===a.valor;});
    var ok=g.filter(function(f){return norm(f.juicio_docente)===norm(f.nivel_veritech);}).length;
    return {area:a.valor,n:g.length,acuerdo:Math.round(ok/g.length*100)};
  });
  var docentes={}; filas.forEach(function(f){docentes[norm(f.docente)||"(sin apodo)"]=1;});
  return {
    error:null, n:n, acuerdo:Math.round(acuerdo/n*100), acuerdoN:acuerdo,
    niveles:NIVELES, matriz:matriz,
    graves:graves.map(function(f){return {url:f.url,docente:f.juicio_docente,veritech:f.nivel_veritech,puntaje:f.puntaje_veritech,motivo:f.motivo};}),
    estricto:{n:estricto.length,senales:senales(estricto,"bad")},
    permisivo:{n:permisivo.length,senales:senales(permisivo,"ok")},
    porArea:porArea, docentes:Object.keys(docentes).length,
    versiones:contar(filas,"version_motor").map(function(v){return v.valor;})
  };
}

/* ---------- opinión docente ---------- */
var IMPRESCINDIBLE=[
  ["Ver las fuentes que entrega cada alumno","Ver las fuentes que entrega cada alumno"],
  ["Informe del curso","Informe del curso"],
  ["Extension instalada","Que funcione solo en el navegador (extensión)"],
  ["Mas formatos de cita","Más formatos de cita"],
  ["Integracion Classroom o Teams","Integración con Classroom o Teams"],
  ["Capacitacion","Capacitación o guía para docentes"],
  ["Fuentes peruanas","Que reconozca fuentes peruanas"]];
function docentes(txt){
  var r=aObjetos(txt,["area","grado","funciones_probadas","utilidad_semaforo","coincide_criterio","ejemplo_desacuerdo","claridad","usaria_en_clase","imprescindible","imprescindible_otro","cambio_principal","contratar","precio_razonable","preocupaciones","correo_contacto"],["utilidad_semaforo","usaria_en_clase"]);
  if(r.error)return {error:r.error};
  var filas=r.filas.filter(function(f){return f.utilidad_semaforo||f.usaria_en_clase;});
  var n=filas.length;
  if(!n)return {error:"El archivo no tiene respuestas todavía."};
  /* casillas múltiples: Netlify las junta en una celda; se busca cada opción conocida */
  var impr=IMPRESCINDIBLE.map(function(o){
    var k=filas.filter(function(f){return norm(f.imprescindible).indexOf(norm(o[0]))>=0;}).length;
    return {valor:o[1],n:k,pct:Math.round(k/n*100)};
  }).sort(function(a,b){return b.n-a.n;});
  return {
    error:null, n:n,
    utilidad:promedio(filas,"utilidad_semaforo"),
    coincide:contar(filas,"coincide_criterio",["Casi siempre","A veces","Pocas veces","No lo compare"]),
    claridad:contar(filas,"claridad",["Si, solos","Con una explicacion breve","No"]),
    usaria:contar(filas,"usaria_en_clase",["Si, en la proxima tarea","Si, con cambios","No por ahora"]),
    contratar:contar(filas,"contratar",["Si","Tal vez","No","No me corresponde"]),
    usariaSi:proporcion(filas,"usaria_en_clase",["Si, en la proxima tarea","Si, con cambios"]),
    imprescindible:impr,
    area:contar(filas,"area"),
    textos:{cambio:textos(filas,"cambio_principal"),ejemplos:textos(filas,"ejemplo_desacuerdo"),otros:textos(filas,"imprescindible_otro"),
            precio:textos(filas,"precio_razonable"),preocupaciones:textos(filas,"preocupaciones")},
    correos:textos(filas,"correo_contacto")
  };
}

/* ---------- opinión de estudiantes ---------- */
function estudiantes(txt){
  var r=aObjetos(txt,["satisfaccion","facilidad","funcionamiento","funcion_mas_util","entendio_semaforo","problemas","mejora_prioritaria","recomendacion","usaria_en_tarea","grado"],["satisfaccion"]);
  if(r.error)return {error:r.error};
  var filas=r.filas.filter(function(f){return f.satisfaccion;});
  var n=filas.length;
  if(!n)return {error:"El archivo no tiene respuestas todavía."};
  return {
    error:null, n:n,
    satisfaccion:promedio(filas,"satisfaccion"), recomendacion:promedio(filas,"recomendacion"),
    facilidad:contar(filas,"facilidad",["Muy facil","Facil","Ni facil ni dificil","Dificil","Muy dificil"]),
    funcionamiento:contar(filas,"funcionamiento",["Si, todo funciono","Funciono con detalles","Tuve problemas","No pude usarla"]),
    entendio:contar(filas,"entendio_semaforo",["Si, lo entendi","Mas o menos","No lo entendi","No analice ninguna fuente"]),
    usaria:contar(filas,"usaria_en_tarea",["Si","Tal vez","No"]),
    usariaSi:proporcion(filas,"usaria_en_tarea",["Si","Tal vez"]),
    funcion:contar(filas,"funcion_mas_util"),
    grado:contar(filas,"grado"),
    textos:{mejora:textos(filas,"mejora_prioritaria"),problemas:textos(filas,"problemas")}
  };
}

/* ---------- ¿vale la pena seguir? (criterios de PLAN-post-feedback.md §2) ---------- */
function senalesSeguir(cal,doc,est){
  function item(texto,valor,cumple,detalle){return {texto:texto,valor:valor,estado:valor==null?"sin-datos":(cumple?"si":"no"),detalle:detalle};}
  var lista=[
    item("El semáforo coincide con los docentes en al menos el 70 % de las fuentes",
      cal&&!cal.error?cal.acuerdo:null, cal&&!cal.error&&cal.acuerdo>=70,
      cal&&!cal.error?cal.acuerdo+" % en "+cal.n+" fuentes":"Falta el CSV de calibración"),
    item("Utilidad del semáforo según los docentes: promedio de 4 o más (de 5)",
      doc&&!doc.error?doc.utilidad:null, doc&&!doc.error&&doc.utilidad>=4,
      doc&&!doc.error?(doc.utilidad==null?"sin respuestas":doc.utilidad+" de 5"):"Falta el CSV de opinión docente"),
    item("La mayoría de los docentes lo usaría en clase («Sí» o «Sí, con cambios»)",
      doc&&!doc.error?doc.usariaSi:null, doc&&!doc.error&&doc.usariaSi>0.5,
      doc&&!doc.error?Math.round(doc.usariaSi*100)+" % de "+doc.n+" docentes":"Falta el CSV de opinión docente"),
    item("La mayoría de los estudiantes lo usaría en su próxima tarea («Sí» o «Tal vez»)",
      est&&!est.error?est.usariaSi:null, est&&!est.error&&est.usariaSi>0.5,
      est&&!est.error?Math.round(est.usariaSi*100)+" % de "+est.n+" estudiantes":"Falta el CSV de estudiantes")
  ];
  var alerta=cal&&!cal.error&&cal.acuerdo<50?"El acuerdo es menor al 50 %: según el plan, no se propone el piloto hasta corregir el motor y repetir la calibración.":null;
  return {lista:lista,alerta:alerta,cumplidos:lista.filter(function(i){return i.estado==="si";}).length};
}

g.VeriTechAnalisis={parseCSV:parseCSV,norm:norm,aObjetos:aObjetos,calibracion:calibracion,docentes:docentes,estudiantes:estudiantes,senalesSeguir:senalesSeguir};
})(typeof globalThis!=="undefined"?globalThis:this);
