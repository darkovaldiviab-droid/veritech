#!/usr/bin/env python3
"""Descarga las respuestas de Netlify Forms y deja el Excel de resultados al día.

En una ejecución:
  1. lee los formularios calibracion, opinion-docentes y opinion-sobre-la-web del sitio
     veritech-aleph con la API de Netlify (solo lectura: únicamente pide datos con GET);
  2. descarta los envíos anteriores a FECHA_INICIO y los que llenaron la trampa antibots;
  3. se queda solo con los campos del formulario (nunca ip, user_agent ni referrer);
  4. copia la plantilla entregables/VeriTech-resultados.xlsx y escribe cada formulario
     en su hoja «Pegar …» (las demás hojas se calculan solas al abrir el libro);
  5. guarda el libro en ~/Documents/VeriTech-resultados/ y muestra un resumen.

El token se lee de la variable de entorno NETLIFY_AUTH_TOKEN (ver herramientas/LEEME-resultados.md).
Solo usa la biblioteca estándar de Python 3.9+: no hay que instalar nada.

Uso:
    python3 herramientas/actualizar_resultados.py              # normal
    python3 herramientas/actualizar_resultados.py --desde 2026-09-17
    python3 herramientas/actualizar_resultados.py --programada --avisar   # lo que corre la tarea diaria
"""
import argparse
import datetime as dt
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

# ---------------------------------------------------------------- configuración
FECHA_INICIO = "2026-09-18"   # primer día de la prueba (AAAA-MM-DD): lo anterior no entra
FECHA_FIN = "2026-10-31"      # último día en que corre la tarea programada
ZONA = "America/Lima"         # las fechas se cuentan con la hora de Lima
SITIO = "veritech-aleph"

RAIZ = Path(__file__).resolve().parent.parent
PLANTILLA = RAIZ / "entregables" / "VeriTech-resultados.xlsx"
CARPETA = Path.home() / "Documents" / "VeriTech-resultados"
ESTADO = ".estado-resultados.json"   # ids ya vistos, para contar las respuestas nuevas
FILAS_PLANTILLA = 1000               # respuestas por formulario que cubren las fórmulas del libro

API = "https://api.netlify.com/api/v1"
POR_PAGINA = 100                     # máximo que acepta la API

# Formulario de Netlify → hoja de la plantilla y campos del formulario, en el orden de
# herramientas/crear_excel.py (CAMPOS_CAL, CAMPOS_DOC, CAMPOS_EST). Solo estos campos salen al Excel.
FORMULARIOS = [
    ("calibracion", "Pegar calibracion", "Calibración",
     ["docente", "area", "url", "juicio_docente", "puntaje_veritech", "nivel_veritech", "coincide",
      "senales", "palabras", "version_motor", "motivo", "consentimiento"]),
    ("opinion-docentes", "Pegar docentes", "Docentes",
     ["area", "grado", "funciones_probadas[]", "utilidad_semaforo", "coincide_criterio",
      "ejemplo_desacuerdo", "claridad", "usaria_en_clase", "imprescindible[]", "imprescindible_otro",
      "cambio_principal", "contratar", "precio_razonable", "preocupaciones", "correo_contacto",
      "consentimiento"]),
    ("opinion-sobre-la-web", "Pegar estudiantes", "Estudiantes",
     ["satisfaccion", "facilidad", "funcionamiento", "funcion_mas_util", "entendio_semaforo",
      "problemas", "mejora_prioritaria", "recomendacion", "usaria_en_tarea", "grado", "consentimiento"]),
]
TRAMPA = "trampa"   # netlify-honeypot de los tres formularios: un humano la deja vacía

COMO_CREAR_TOKEN = """\
Falta la variable de entorno NETLIFY_AUTH_TOKEN.

Cómo crearla (una sola vez):
  1. Entra a https://app.netlify.com → tu foto → User settings → Applications
     → Personal access tokens → New access token. Ponle de nombre «VeriTech resultados»
     y una fecha de vencimiento después del fin de la prueba. Copia el token.
  2. Guárdalo en el llavero de la Mac (te pedirá pegarlo; no se ve al escribir):
       security add-generic-password -a "$USER" -s veritech-netlify -w
  3. Cárgalo en la terminal antes de correr el script:
       export NETLIFY_AUTH_TOKEN="$(security find-generic-password -s veritech-netlify -w)"

Instrucciones completas: herramientas/LEEME-resultados.md"""


class Falla(Exception):
    """Error que se explica al usuario en una línea, sin traza."""


# ---------------------------------------------------------------- API de Netlify (solo GET)
def _siguiente(link):
    """URL con rel="next" de la cabecera Link, o None."""
    for parte in (link or "").split(","):
        m = re.match(r'\s*<([^>]+)>\s*;\s*rel="?next"?', parte)
        if m:
            return m.group(1)
    return None


def _pedir(url, token):
    req = urllib.request.Request(url, method="GET", headers={
        "Authorization": "Bearer " + token, "User-Agent": "veritech-resultados"})
    for intento in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode("utf-8")), r.headers.get("Link")
        except urllib.error.HTTPError as e:
            if e.code == 401:
                raise Falla("Netlify rechazó el token (401): venció o está mal copiado. "
                            "Crea uno nuevo como dice herramientas/LEEME-resultados.md.")
            if e.code in (429, 500, 502, 503, 504) and intento < 2:
                import time
                time.sleep(5 * (intento + 1))
                continue
            raise Falla(f"Netlify respondió con error {e.code} al pedir {url.split('?')[0]}.")
        except urllib.error.URLError as e:
            if intento < 2:
                import time
                time.sleep(5)
                continue
            raise Falla(f"No hay conexión con Netlify ({e.reason}).")


def _todas_las_paginas(ruta, token, **params):
    """GET con paginación: sigue la cabecera Link rel="next" hasta el final."""
    params = dict(params, per_page=POR_PAGINA, page=1)
    url = f"{API}{ruta}?{urllib.parse.urlencode(params)}"
    todo, vistas = [], 0
    while url:
        datos, link = _pedir(url, token)
        if not isinstance(datos, list):
            raise Falla(f"Respuesta inesperada de Netlify en {ruta}.")
        todo += datos
        vistas += 1
        url = _siguiente(link) if datos and vistas < 1000 else None
    return todo


def leer_netlify(token):
    """{nombre de formulario: [envíos]} de los tres formularios del sitio."""
    sitios = [s for s in _todas_las_paginas("/sites", token, name=SITIO, filter="all")
              if s.get("name") == SITIO]
    if not sitios:
        raise Falla(f"El token no tiene acceso a un sitio llamado «{SITIO}».")
    sitio = sitios[0]["id"]
    formularios = {f.get("name"): f.get("id") for f in _todas_las_paginas(f"/sites/{sitio}/forms", token)}
    envios = {}
    for nombre, *_ in FORMULARIOS:
        fid = formularios.get(nombre)
        envios[nombre] = _todas_las_paginas(f"/forms/{fid}/submissions", token) if fid else []
    return envios


# ---------------------------------------------------------------- limpieza
def norm(s):
    """Como norm() de analisis.js: minúsculas, sin tildes ni espacios sobrantes."""
    s = unicodedata.normalize("NFD", str("" if s is None else s).lower())
    s = "".join(c for c in s if not "\u0300" <= c <= "\u036f")
    return re.sub(r"\s+", " ", s).strip()


def clave(s):
    """Como clave() de analisis.js: «imprescindible[]» e «imprescindible» son la misma columna."""
    return re.sub(r"[^a-z0-9]", "", norm(s))


def _texto(v):
    if v is None:
        return ""
    if isinstance(v, (list, tuple)):   # casillas múltiples
        return ", ".join(_texto(x) for x in v if _texto(x) != "")
    return str(v)


def _fecha_local(iso):
    from zoneinfo import ZoneInfo
    t = dt.datetime.fromisoformat(str(iso).replace("Z", "+00:00"))
    if t.tzinfo is None:
        t = t.replace(tzinfo=dt.timezone.utc)
    return t.astimezone(ZoneInfo(ZONA))


def limpiar(envios, campos, desde):
    """Envíos válidos → (filas de valores en el orden de `campos`, ids), del más antiguo al más nuevo.
    Toma solo los campos del formulario desde `data`: todo lo demás (ip, user_agent, referrer,
    nombre, correo que Netlify deduce…) se descarta aquí."""
    buenos = []
    for e in envios:
        datos = e.get("data") or {}
        por_clave = {}
        for k, v in datos.items():
            por_clave.setdefault(clave(k), v)
        if _texto(por_clave.get(clave(TRAMPA))).strip():
            continue
        cuando = _fecha_local(e.get("created_at"))
        if cuando.date() < desde:
            continue
        buenos.append((cuando, str(e.get("id")), [_texto(por_clave.get(clave(c))) for c in campos]))
    buenos.sort(key=lambda b: (b[0], b[1]))
    return [b[2] for b in buenos], [b[1] for b in buenos]


# ---------------------------------------------------------------- Excel
# Se edita el .xlsx como zip: openpyxl perdería los 13 gráficos de la hoja Resumen al guardar.
NS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
XML_INVALIDO = re.compile("[\x00-\x08\x0b\x0c\x0e-\x1f\ufffe\uffff]")
PELIGROSOS = ("=", "+", "-", "@")


def _col(n):
    s = ""
    while n:
        n, r = divmod(n - 1, 26)
        s = chr(65 + r) + s
    return s


def _celda(ref, valor, estilo_apostrofo):
    valor = XML_INVALIDO.sub("", valor)[:32767]
    # Texto siempre como texto (inlineStr), nunca fórmula. Si empieza con = + - @ lleva además el
    # apóstrofo inicial de Excel (quotePrefix): se ve y se edita como '=… y las fórmulas lo leen sin él.
    s = f' s="{estilo_apostrofo}"' if valor.startswith(PELIGROSOS) else ""
    return f'<c r="{ref}" t="inlineStr"{s}><is><t xml:space="preserve">{escape(valor)}</t></is></c>'


def _hoja_xml(original, titulos, filas, estilo_apostrofo):
    """Reemplaza <sheetData> y <dimension> de la hoja «Pegar …» (vacía en la plantilla)."""
    xml = [f'<row r="1">' + "".join(_celda(f"{_col(j)}1", t, estilo_apostrofo)
                                   for j, t in enumerate(titulos, 1)) + "</row>"]
    for i, fila in enumerate(filas, 2):
        celdas = "".join(_celda(f"{_col(j)}{i}", v, estilo_apostrofo)
                         for j, v in enumerate(fila, 1) if v != "")
        if celdas:
            xml.append(f'<row r="{i}">{celdas}</row>')
    fin = f"{_col(len(titulos))}{len(filas) + 1}"
    hoja = re.sub(r"<sheetData\s*/>|<sheetData>.*?</sheetData>",
                  lambda _: "<sheetData>" + "".join(xml) + "</sheetData>", original, count=1, flags=re.S)
    return re.sub(r'<dimension ref="[^"]*"\s*/>', f'<dimension ref="A1:{fin}" />', hoja, count=1)


def _con_estilo_apostrofo(styles):
    """Agrega a cellXfs un formato con quotePrefix="1" y devuelve (styles.xml, índice)."""
    m = re.search(r'<cellXfs count="(\d+)"', styles)
    n = int(m.group(1))
    styles = styles.replace(m.group(0), f'<cellXfs count="{n + 1}"', 1)
    xf = '<xf numFmtId="49" fontId="0" fillId="0" borderId="0" applyNumberFormat="1" quotePrefix="1" xfId="0" />'
    return styles.replace("</cellXfs>", xf + "</cellXfs>", 1), n


def _rutas_de_hojas(z):
    """{nombre de hoja: ruta dentro del zip}, según workbook.xml y sus relaciones."""
    wb = z.read("xl/workbook.xml").decode("utf-8")
    rels = z.read("xl/_rels/workbook.xml.rels").decode("utf-8")
    destino = {}
    for rel in re.findall(r"<Relationship\b[^>]*>", rels):
        rid, tgt = re.search(r'Id="([^"]+)"', rel), re.search(r'Target="([^"]+)"', rel)
        if rid and tgt:
            t = tgt.group(1)
            destino[rid.group(1)] = t.lstrip("/") if t.startswith("/") else "xl/" + t
    hojas = {}
    for s in re.findall(r"<sheet\b[^>]*>", wb):
        nombre = re.search(r'name="([^"]+)"', s).group(1)
        rid = re.search(r'r:id="([^"]+)"', s) or re.search(r'\bid="([^"]+)"', s)
        hojas[nombre.replace("&amp;", "&")] = destino[rid.group(1)]
    return hojas


def escribir_excel(plantilla, destino, por_hoja):
    """por_hoja: {nombre de hoja «Pegar …»: (títulos, filas)}. Escribe en un temporal y lo mueve."""
    with zipfile.ZipFile(plantilla) as z:
        rutas = _rutas_de_hojas(z)
        faltan = [h for h in por_hoja if h not in rutas]
        if faltan:
            raise Falla(f"La plantilla no tiene las hojas {faltan}: ¿cambió crear_excel.py?")
        styles, apostrofo = _con_estilo_apostrofo(z.read("xl/styles.xml").decode("utf-8"))
        nuevos = {"xl/styles.xml": styles}
        for hoja, (titulos, filas) in por_hoja.items():
            nuevos[rutas[hoja]] = _hoja_xml(z.read(rutas[hoja]).decode("utf-8"), titulos, filas, apostrofo)
        fd, tmp = tempfile.mkstemp(suffix=".xlsx", dir=destino.parent)
        os.close(fd)
        try:
            with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as out:
                for info in z.infolist():
                    datos = nuevos[info.filename].encode("utf-8") if info.filename in nuevos else z.read(info)
                    out.writestr(info, datos, compress_type=zipfile.ZIP_DEFLATED)
            os.chmod(tmp, 0o600)
            os.replace(tmp, destino)
        finally:
            if os.path.exists(tmp):
                os.remove(tmp)


# ---------------------------------------------------------------- criterios (réplica de analisis.js)
def _redondear(x):
    """Math.round de JavaScript (0,5 sube), no el redondeo bancario de Python."""
    import math
    return math.floor(x + 0.5)


def _entero_inicial(s):
    """parseInt(s, 10): «5 - Muy satisfecho» → 5."""
    m = re.match(r"\s*([+-]?\d+)", s)
    return int(m.group(1)) if m else None


def _promedio(valores):
    v = [n for n in map(_entero_inicial, valores) if n is not None and 1 <= n <= 5]
    return _redondear(sum(v) / len(v) * 10) / 10 if v else None


def _proporcion(valores, aceptados):
    con = [v for v in valores if v]
    if not con:
        return None
    ok = {norm(a) for a in aceptados}
    return sum(1 for v in con if norm(v) in ok) / len(con)


def _si_mayoria(usa, texto, n):
    if usa is None:   # nadie contestó esa pregunta: «sin datos», como en analisis.js
        return (None, texto, "sin respuestas")
    return (usa > 0.5, texto, f"{_redondear(usa * 100)} % de {n}")


def criterios(datos):
    """datos: {formulario: [dict campo→valor]}. Devuelve las 4 líneas de senalesSeguir()."""
    rango = {"confiable": 2, "dudosa": 1, "no confiable": 0}
    cal = [f for f in datos["calibracion"]
           if norm(f["juicio_docente"]) in rango and norm(f["nivel_veritech"]) in rango]
    doc = [f for f in datos["opinion-docentes"] if f["utilidad_semaforo"] or f["usaria_en_clase"]]
    est = [f for f in datos["opinion-sobre-la-web"] if f["satisfaccion"]]

    lista, alerta = [], None
    if cal:
        acuerdo = _redondear(sum(1 for f in cal if norm(f["juicio_docente"]) == norm(f["nivel_veritech"]))
                             / len(cal) * 100)
        lista.append((acuerdo >= 70, "Semáforo coincide con docentes ≥ 70 %", f"{acuerdo} % en {len(cal)} fuentes"))
        if acuerdo < 50:
            alerta = "acuerdo < 50 %: corregir el motor antes del piloto"
    else:
        lista.append((None, "Semáforo coincide con docentes ≥ 70 %", "sin calificaciones"))
    if doc:
        util = _promedio([f["utilidad_semaforo"] for f in doc])
        lista.append((None if util is None else util >= 4, "Utilidad según docentes ≥ 4 de 5",
                      "sin respuestas" if util is None else f"{util:g} de 5".replace(".", ",")))
        usa = _proporcion([f["usaria_en_clase"] for f in doc], ["Si, en la proxima tarea", "Si, con cambios"])
        lista.append(_si_mayoria(usa, "Mayoría de docentes lo usaría en clase", len(doc)))
    else:
        lista += [(None, "Utilidad según docentes ≥ 4 de 5", "sin respuestas"),
                  (None, "Mayoría de docentes lo usaría en clase", "sin respuestas")]
    if est:
        usa = _proporcion([f["usaria_en_tarea"] for f in est], ["Si", "Tal vez"])
        lista.append(_si_mayoria(usa, "Mayoría de estudiantes lo usaría en su tarea", len(est)))
    else:
        lista.append((None, "Mayoría de estudiantes lo usaría en su tarea", "sin respuestas"))
    return lista, alerta


# ---------------------------------------------------------------- estado y aviso
def _leer_estado(carpeta):
    try:
        return json.loads((carpeta / ESTADO).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def _guardar_estado(carpeta, ids):
    tmp = carpeta / (ESTADO + ".tmp")
    tmp.write_text(json.dumps(ids, ensure_ascii=False), encoding="utf-8")
    os.chmod(tmp, 0o600)
    os.replace(tmp, carpeta / ESTADO)


def avisar(titulo, texto):
    """Notificación de macOS (no bloquea; si falla, no pasa nada)."""
    script = f"display notification {json.dumps(texto)} with title {json.dumps(titulo)}"
    try:
        subprocess.run(["osascript", "-e", script], check=False, timeout=15,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except (OSError, subprocess.SubprocessError):
        pass


# ---------------------------------------------------------------- principal
def ejecutar(desde, carpeta, envios=None, token=None, ahora=None):
    """Devuelve (líneas de resumen, texto corto para el aviso). `envios` permite probar sin red."""
    if envios is None:
        envios = leer_netlify(token)
    if not PLANTILLA.exists():
        raise Falla(f"No encuentro la plantilla {PLANTILLA}. Genérala con herramientas/crear_excel.py.")
    carpeta.mkdir(parents=True, exist_ok=True)
    os.chmod(carpeta, 0o700)

    por_hoja, datos, ids, conteo = {}, {}, {}, []
    for nombre, hoja, etiqueta, campos in FORMULARIOS:
        filas, ids[nombre] = limpiar(envios.get(nombre, []), campos, desde)
        por_hoja[hoja] = (campos, filas)
        datos[nombre] = [dict(zip(campos, [v.strip() for v in f])) for f in filas]
        conteo.append((nombre, etiqueta, len(filas)))

    ahora = ahora or dt.datetime.now()
    archivo = carpeta / f"VeriTech-resultados-{ahora:%Y-%m-%d_%H%M}.xlsx"
    escribir_excel(PLANTILLA, archivo, por_hoja)
    ultimo = carpeta / "VeriTech-resultados-ULTIMO.xlsx"
    shutil.copy2(archivo, carpeta / "VeriTech-resultados-ULTIMO.tmp")
    os.replace(carpeta / "VeriTech-resultados-ULTIMO.tmp", ultimo)

    previo = _leer_estado(carpeta)
    _guardar_estado(carpeta, ids)

    def nuevas(nombre):
        if previo is None:
            return ""
        n = len(set(ids[nombre]) - set(previo.get(nombre, [])))
        return f" (+{n})"

    lista, alerta = criterios(datos)
    cumplidos = sum(1 for c in lista if c[0])
    marca = {True: "✅", False: "❌", None: "⚪"}
    lineas = [
        f"VeriTech · respuestas desde el {desde:%d/%m/%Y} · {ahora:%d/%m/%Y %H:%M}",
        "  ·  ".join(f"{et}: {n}{nuevas(nom)}" for nom, et, n in conteo)
        + ("   (entre paréntesis: nuevas desde la ejecución anterior)" if previo is not None
           else "   (primera ejecución: todas son nuevas)"),
    ]
    lineas += [f"{marca[c[0]]} {c[1]}: {c[2]}" for c in lista]
    lineas.append(f"Criterios cumplidos: {cumplidos} de 4" + (f" · ⚠️ {alerta}" if alerta else "")
                  + f" · Excel: {ultimo}")
    exceso = [et for _, et, n in conteo if n > FILAS_PLANTILLA]
    if exceso:
        lineas.append(f"⚠️ {', '.join(exceso)} pasa(n) de {FILAS_PLANTILLA} respuestas: el Resumen solo cuenta "
                      f"las primeras {FILAS_PLANTILLA}. Hay que ampliar la plantilla.")
    corto = " · ".join(f"{et} {n}{nuevas(nom)}" for nom, et, n in conteo) + f" — {cumplidos}/4 criterios"
    return lineas, corto


def main():
    p = argparse.ArgumentParser(description="Actualiza el Excel de resultados de VeriTech desde Netlify Forms.")
    p.add_argument("--desde", default=FECHA_INICIO, help="primer día que entra (AAAA-MM-DD); por defecto FECHA_INICIO")
    p.add_argument("--carpeta", default=str(CARPETA), help="dónde guardar el Excel")
    p.add_argument("--programada", action="store_true",
                   help="modo tarea diaria: no hace nada fuera de FECHA_INICIO…FECHA_FIN")
    p.add_argument("--avisar", action="store_true", help="muestra además una notificación de macOS")
    a = p.parse_args()

    try:
        desde = dt.date.fromisoformat(a.desde)
        fin = dt.date.fromisoformat(FECHA_FIN)
    except ValueError:
        print("Fecha mal escrita: usa AAAA-MM-DD, por ejemplo 2026-09-18.", file=sys.stderr)
        return 2
    if a.programada:
        hoy = _fecha_local(dt.datetime.now(dt.timezone.utc).isoformat()).date()
        if not dt.date.fromisoformat(FECHA_INICIO) <= hoy <= fin:
            print(f"Hoy ({hoy}) está fuera de la prueba ({FECHA_INICIO} a {FECHA_FIN}): no hago nada.")
            return 0

    token = os.environ.get("NETLIFY_AUTH_TOKEN", "").strip()
    if not token:
        print(COMO_CREAR_TOKEN, file=sys.stderr)
        if a.avisar:
            avisar("VeriTech · resultados", "No se actualizó: falta el token de Netlify (ver LEEME-resultados.md).")
        return 1
    try:
        lineas, corto = ejecutar(desde, Path(a.carpeta).expanduser(), token=token)
    except Falla as e:
        print(f"No se pudo actualizar: {e}", file=sys.stderr)
        if a.avisar:
            avisar("VeriTech · resultados", f"No se actualizó: {e}")
        return 1
    print("\n".join(lineas))
    if a.avisar:
        avisar("VeriTech · resultados", corto)
    return 0


if __name__ == "__main__":
    sys.exit(main())
