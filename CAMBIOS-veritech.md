# VeriTech — cambios del 22/09/2026

Carpeta del sitio: `veritech-sitio/` · Paquete listo para Netlify: `veritech-sitio-mejorado.zip`

## 1. Legal (lo que pedía el video)

- **Páginas nuevas**: `privacidad.html`, `terminos.html`, `cookies.html`, con el mismo diseño del sitio y enlazadas desde el pie de todas las páginas.
- **Consentimiento en los formularios**: la encuesta no arranca sin marcar la casilla; el formulario de opinión la exige para enviar. El consentimiento queda registrado en cada envío (campo `consentimiento`).
- **Sin banner de cookies, a propósito**: el sitio no instala cookies, solo guarda en el navegador lo que crea el usuario. Está explicado en `cookies.html`.
- **Sin política de reembolsos**: no se cobra nada; lo dice el punto 4 de términos.
- **Afirmación sin respaldo corregida**: «El error más común de 2026» → «Un error frecuente».

## 2. Seguridad

- **Arreglada una inyección de código (XSS)**. Si alguien copiaba el texto de una página maliciosa y lo pegaba en la herramienta, ese código se ejecutaba y quedaba guardado en «Mi trabajo», ejecutándose en cada visita. Ahora todo lo que viene del usuario se escapa antes de mostrarse. Probado: la versión original ejecutaba el código, la nueva lo muestra como texto.
- **Mismo arreglo en `resultados.html`**: el formulario de la encuesta es público y cualquiera podía enviar una «respuesta» con código que se ejecutaría al abrir los resultados.
- **Cabeceras de seguridad** (`_headers`): nosniff, política de referencia, bloqueo de incrustación en iframes, permisos de cámara y micrófono desactivados. La política de contenido (CSP) va en modo «solo informe»: revisa la consola tras publicar y actívala (instrucciones dentro del archivo).

## 3. Accesibilidad

- **Contraste**: el botón principal en modo oscuro estaba en 2,5:1 (ilegible) → 7,5:1. También se corrigieron el texto secundario, los avisos y el botón naranja de la encuesta, todos ya por encima de 4,5:1.
- **Teclado**: las pestañas de la herramienta funcionan con flechas, Inicio y Fin.
- **Lectores de pantalla**: el veredicto y los resultados se anuncian al actualizarse.

## 4. Arreglos funcionales

- **El formulario de opinión no estaba registrado en Netlify** (le faltaba `data-netlify`): los envíos habrían dado error 404. Arreglado.
- Enlace «Dar mi opinión» normalizado a `/feedback.html`.
- Tildes corregidas en las descripciones para buscadores.
- En «Verificar una cita», los conceptos se muestran con sus tildes («adaptación», no «adaptacion»); la comparación sigue ignorándolas.

## Pendiente — lo tiene que completar el equipo

Los datos que faltan en las páginas legales están resaltados en amarillo:

- correo del equipo (4 veces)
- colegio y curso (3), colegio (2)
- nombres del equipo, nombre del responsable
- fecha límite para borrar las respuestas (p. ej. 31/12/2026)

En `presentacion.html` siguen sin llenar «Nombre 1…4», «N compañeros» y los «00 %». Pega el CSV de Netlify en `resultados.html` y te da los números reales.

Opcional: alojar las tipografías en el propio dominio, para no pasar la IP del visitante a Google.

---

# VeriTech — cambios del 24/09/2026 (preparar la prueba del colegio)

Paquete para Netlify: `veritech-prueba-colegio.zip` (se regenera con `bash herramientas/empaquetar.sh`).

## Nuevo
- **`guia-prueba.html`**: guía de una página para el colegio. Explica qué probar, cuánto toma, qué no incluye todavía, cómo se tratan los datos y qué preguntas tiene la dirección.
- **`calibracion.html`**: el docente juzga una fuente y, después de enviar, ve el puntaje de VeriTech. Se envían la dirección, el juicio y el resultado del análisis; el texto de la página no se envía.
- **`opinion-docentes.html`**: 12 preguntas sobre utilidad, precisión, uso en clase, lo imprescindible, si contratarían y la privacidad.
- **`/vista-previa-panel/`**: el prototipo del panel del profesor con datos ficticios. Se copia desde `veritech-app/panel` al empaquetar.
- **`herramientas/servidor-local.py`**: servidor local que aplica `_headers` como Netlify y guarda los envíos de formularios en `herramientas/envios-locales.jsonl`.

## Cambiado
- **Seguridad (M09)**:
  - Todo el JavaScript se movió a `js/`, y el motor quedó en `js/motor.js`.
  - La CSP está en **modo bloqueo**, sin `'unsafe-inline'` en los scripts.
  - Se quitaron el comentario y las metas de referido de Netlify.
- **Aviso «Orientativo, no es una nota»** junto al semáforo y al verificador de citas.
- **`feedback.html`** es ahora la opinión de estudiantes. Agrega «¿entendiste el color?», «¿lo usarías en tu próxima tarea?» y el grado, y enlaza al formulario docente.
- **Pitch (M23)**: ya no presenta como existentes la extensión, el informe del curso, el modo tarea ni los formatos de revista, y el plan de implementación coincide con el plan real.
- **Privacidad y cookies**: cubren los nuevos formularios y las claves de `localStorage`.
- **`veritech-app/test`**: las pruebas de paridad y de bibliografía leen ahora `js/motor.js` y `js/index.js`.
- **Botón «← Volver a la guía de la prueba»** (`js/volver.js`, `css/volver.css`): aparece fijo arriba en la herramienta, los formularios, la calibración, las páginas legales y la vista previa del panel, pero solo si la persona entró por la guía en esa pestaña. Quien usa la herramienta sin la guía no lo ve.
- **`analisis-prueba.html`** (solo para el equipo, sin enlace público y con `noindex`): abre los CSV de calibración, opinión docente y opinión de estudiantes, y calcula la coincidencia del semáforo, la matriz de desacuerdos, las señales que más fallan, los promedios, lo imprescindible y si se cumplen los criterios para pedir el piloto. Las respuestas se muestran siempre como texto, nunca como código. La lógica está en `js/analisis.js`, con pruebas en `veritech-app/test/analisis.test.js`.

# VeriTech — cambios del 24/09/2026 (feedback de la prueba: fragmentos y PDF)

**El problema que nos contaron:** un alumno que hace una monografía no cita un PDF entero, sino solo el párrafo que va a usar. Al pegar ese fragmento (unas 100 palabras), el semáforo lo ponía en rojo: la profundidad era poca, y el autor y la fecha no aparecían porque están en la portada. Una fuente buena salía con 28/100. Además, no había forma de analizar un PDF largo, una infografía o una captura.

## Nuevo
- **Subir archivo** en «Analizar fuente». Acepta PDF, PNG, JPG y WEBP, de hasta 20 MB, con botón o arrastrando el archivo. Todo se lee en el navegador y nada se sube a un servidor.
  - **PDF con texto:** se leen todas las páginas (hasta 400) y el alumno elige cuáles va a usar. El autor, la fecha y las referencias se buscan en el PDF entero; el resto de señales, en las páginas elegidas.
  - **Infografía, captura o PDF escaneado:** el texto se saca con OCR en español (hasta 5 páginas a la vez en un PDF escaneado). Aparece en la caja de texto para que el alumno lo revise y lo corrija.
- **Casilla «Es un fragmento de una fuente más larga».** Se marca sola con una imagen o con un rango de páginas parcial. Si el texto pegado tiene menos de 400 palabras, la herramienta la sugiere. Con la casilla marcada:
  - La **profundidad** no se evalúa.
  - Si falta el **autor** o la **fecha**, sale en amarillo y pide buscarlos en la portada, sin restar puntos.
  - La falta de **referencias** o de **precisión** en el fragmento sale en amarillo y no resta.
  - Un fragmento **sin autor o sin fecha no puede salir en verde** (tope de 69). Así la casilla no sirve para aprobar cualquier texto.
- **Campos Autor y Año** (opcionales). Se rellenan con lo que se detecta, y lo que escribe el alumno tiene prioridad y se marca como «indicado por ti». También se usan en la bibliografía de «Mi trabajo».

## Cambiado
- **Motor `sitio-1.1`:** `analyzeSource(url, text, opts)`. Sin `opts` da exactamente el mismo resultado que `sitio-1.0` (lo comprobamos en 16 casos), así que la calibración no cambia.
- **CSP:** se añadieron `'wasm-unsafe-eval'` (el lector de imágenes es WebAssembly) y `worker-src 'self'`. No hay dominios nuevos ni `'unsafe-inline'` en los scripts.
- **Librerías alojadas en el sitio** (`js/vendor/`, unos 9 MB, que se cargan solo al subir un archivo): pdf.js 3.11.174 (Apache 2.0) y Tesseract.js 5 con el idioma español (Apache 2.0).
- **Textos:** privacidad, pie de la herramienta y guía de la prueba (nueva tarea: comparar un PDF subido con el párrafo pegado).

## Ejemplo (fragmento de unas 100 palabras de una buena fuente sobre plantas C4)
| Cómo se analiza | Puntaje |
|---|---|
| Pegado, sin marcar «fragmento» (igual que antes) | 28, rojo |
| Marcado como fragmento, sin autor ni año | 69, amarillo («completa autor y año») |
| Marcado como fragmento, con autor y año escritos | 100, verde |
