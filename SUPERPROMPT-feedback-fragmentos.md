# SUPERPROMPT: VeriTech, analizar fragmentos, PDF, infografías y capturas

## Rol
Eres el desarrollador frontend de VeriTech. Trabajas en `veritech-sitio/` de este repositorio. Es una web estática para Netlify, en JS vanilla y sin build. Escribe todo el texto visible en español claro, pensado para alumnos de secundaria.

## Contexto (léelo antes de tocar nada)
- El semáforo de fuentes vive en `veritech-sitio/js/motor.js` (`analyzeSource(url, text)`) y se pinta desde `veritech-sitio/js/index.js` (`renderSource`). La interfaz está en `veritech-sitio/index.html`, panel `#p-src`. `js/calibracion.js` también usa el motor.
- La CSP de `veritech-sitio/_headers` está en modo bloqueo con `script-src 'self'`. No se permite JS en línea ni CDNs. Cualquier librería va alojada en `veritech-sitio/js/vendor/`.
- El pie de página promete: «Lo que pegas aquí se analiza en tu navegador y no se envía a ningún servidor». Esa promesa tiene que seguir siendo cierta.
- Todo lo que viene del usuario se escapa con `esc()` antes de pintarse. Mantén esa regla.

## Problema (feedback de la prueba en el colegio)
Un alumno que hace una monografía no cita un PDF entero. Pega **solo el fragmento que va a usar**, por ejemplo unas 100 palabras de un PDF larguísimo. Entonces el motor:
- marca **Profundidad** en rojo (menos de 120 palabras, −8);
- marca **Autoría** en rojo (−14) y **Fecha** en rojo (−12), porque el autor y la fecha están en la portada y no en el fragmento;
- suele penalizar también Referencias y Precisión.

Resultado: una fuente buena sale con un puntaje malo. Además, los alumnos no saben qué hacer con un PDF largo ni con una infografía o una captura, porque hoy solo se puede pegar texto.

## Objetivo
1. Que se pueda **subir un archivo**: PDF, infografía o captura de pantalla (PNG, JPG o WEBP) de la parte de la página que el alumno quiere usar.
2. Que un **fragmento** de una fuente buena no salga en rojo solo por ser un fragmento.

## Tareas, en orden

### 1. Motor (`js/motor.js`)
- Cambia la firma a `analyzeSource(url, text, opts)`. `opts` es opcional: `{fragmento: bool, autor: string, anio: number, textoCompleto: string}`. Sin `opts`, el resultado tiene que ser **idéntico** al de ahora. `calibracion.js` no debe cambiar su comportamiento.
- Si `opts.autor` o `opts.anio` vienen informados, tienen prioridad sobre la detección automática. El detalle debe decir «indicado por ti».
- Si `opts.textoCompleto` existe (el PDF entero), Autoría, Fecha y Referencias se calculan sobre el texto completo. El resto de señales se calcula sobre el fragmento.
- Con `fragmento: true`:
  - **Profundidad** pasa a estado neutro, sin puntos. Texto: «Es un fragmento: la extensión no se evalúa».
  - Si falta el autor o la fecha, el estado es `warn`, con 0 puntos y este mensaje: «No aparece en el fragmento: búscalo en la portada o en la página y escríbelo arriba».
- Sube `MOTOR_VERSION` a `"sitio-1.1"`.

### 2. Interfaz (`index.html` + `js/index.js`)
- En la tarjeta «La página que quieres citar» añade dos opciones de entrada: **Pegar texto** (la actual) y **Subir archivo**. Usa un `<input type="file" accept=".pdf,image/png,image/jpeg,image/webp">` accesible, que también admita arrastrar y soltar. Límite: 20 MB. Si el archivo pesa más, muestra un error claro.
- **PDF**: extrae el texto de todas las páginas con pdf.js, alojado en `js/vendor/`, con su worker también alojado ahí. Enseña el número de páginas y un selector «¿Qué páginas vas a usar?» (desde/hasta). Esas páginas son el fragmento y el PDF entero es `textoCompleto`. Si el PDF no tiene texto (está escaneado), pasa a OCR.
- **Imagen o captura**: pasa la imagen por OCR con Tesseract.js en español (`spa`). El worker, el core wasm y `spa.traineddata` van alojados en `js/vendor/`. Muestra el progreso («Leyendo la imagen… 40 %»). Deja el texto extraído en el `textarea #t` para que el alumno lo revise y lo corrija antes de analizar.
- Añade la casilla **«Es un fragmento de una fuente más larga»**. Se marca sola con un archivo de imagen o con un rango de páginas parcial. Si el texto pegado tiene menos de 400 palabras, sugiérela, pero no la marques sola.
- Añade los campos opcionales **Autor** y **Año**, siempre visibles y rellenados con lo que se detecte. Pasan al motor como `opts` y a «Guardar en mi trabajo», para que la bibliografía APA/MLA los use.
- Ningún archivo sale del navegador. No hagas `fetch` a servidores externos.
- Actualiza el texto de ayuda: «¿Tu fuente es un PDF largo o una infografía? Súbela y elige la parte que vas a usar».

### 3. Seguridad (`_headers`)
- Amplía la CSP solo lo necesario: `worker-src 'self' blob:` y `'wasm-unsafe-eval'` en `script-src`. **No** añadas `'unsafe-inline'` ni dominios externos. En `_headers`, comenta por qué se añade cada cosa.

### 4. Textos
- `privacidad.html`: explica que los archivos subidos se leen en el navegador y no se guardan ni se envían.
- `guia-prueba.html`: añade una tarea de prueba: «Sube un PDF largo, elige 1 página y compáralo con pegar solo ese párrafo».
- `CAMBIOS-veritech.md`: añade una sección con la fecha de hoy y el resumen del cambio.

## Límites
- Solo toca `veritech-sitio/` y `CAMBIOS-veritech.md`. No toques `brujula-sitio/`, `prueba-funcion/`, `respaldo-agente/`, `entregables/` ni `herramientas/`.
- Haz solo lo que pide este documento. No agregues cuentas, backend, IA en la nube ni rediseños.
- **Detente y pregúntame antes de:** borrar un archivo, añadir una librería distinta de pdf.js o Tesseract.js, o superar 25 MB en total en `js/vendor/`.
- No hagas commit ni push sin que te lo pida.

## Criterios de aceptación (compruébalos todos)
1. **Regresión:** con un script de Node que cargue `motor.js`, `analyzeSource(url, text)` sin `opts` da el mismo `score` y los mismos `checks` que antes para los textos de ejemplo de `calibracion.js`.
2. Pega un fragmento de unas 100 palabras de una fuente buena (sin autor ni fecha), marca «fragmento» y escribe el autor y el año a mano. Ninguna señal sale roja por extensión, autor o fecha, y el puntaje es ≥ 70.
3. Con la casilla «fragmento» desmarcada, ese mismo fragmento se puntúa como hoy.
4. Sube un PDF de más de 10 páginas y elige la página 3. El autor y el año salen de la portada, y la profundidad aparece como «fragmento».
5. Sube una captura PNG con texto en español. El texto aparece en `#t` y se puede editar y analizar.
6. Con `preview_start` → `veritech` (puerto 8830): cero errores de consola y cero violaciones de CSP. La pestaña Red no muestra peticiones a dominios externos al subir archivos. Revisa la vista a 375 px de ancho, sin scroll horizontal.
7. «Guardar en mi trabajo» guarda el autor y el año indicados, y la bibliografía los muestra.

## Entrega
Al terminar, dame:
- la lista de archivos cambiados;
- el resultado de cada criterio (✅/❌, con la evidencia: salida del script o captura);
- el peso total de `js/vendor/`;
- lo que quedó pendiente.
