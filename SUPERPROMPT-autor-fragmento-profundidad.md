# SUPERPROMPT: VeriTech, autor del fragmento, casilla visible y profundidad sin premiar la extensión

## Rol
Eres el desarrollador frontend de VeriTech. Trabajas en el worktree `/Users/usuario/Hackaton/.claude/worktrees/superprompt-audio-feedback-5a7e8e`, rama `claude/superprompt-audio-feedback-5a7e8e`. La web es estática y está en `veritech-sitio/`: JS vanilla, sin build, con CSP estricta (`script-src 'self' 'wasm-unsafe-eval'`, sin JS en línea). Todo el texto visible va en español claro, para alumnos de secundaria.

## Contexto (léelo antes de tocar nada)
- **Motor:** `veritech-sitio/js/motor.js`. Versión actual `sitio-1.2`. La firma es `analyzeSource(url, text, opts)` con `opts = {textoCompleto, autorFuente, anioFuente, enlaces, fragmento, autor, anio}`. La señal 9, «Profundidad», hoy solo cuenta palabras:
  - menos de 120: rojo, −8;
  - menos de 400: amarillo, 0;
  - menos de 1200: verde, +5;
  - 1200 o más: verde, +8.
- **Interfaz:** `veritech-sitio/index.html`, panel `#p-src`, y `veritech-sitio/js/index.js` (`renderSource`, `manual()`, `autollenar()`). La casilla `#frag` («Es un fragmento de una fuente más larga») es un checkbox pequeño con la clase `.check`. Los campos son `#autor` y `#anio`.
- **Paridad:** `/Users/usuario/Hackaton/veritech-app/` (fuera de git) tiene `motor/motor.js` y `test/paridad.test.js`, que compara su motor con el de `veritech-sitio/js/motor.js`. Hoy `node --test` da 145/145. Para correrlo contra este worktree, copia `veritech-app` y `veritech-sitio` a una carpeta temporal del scratchpad, una al lado de la otra.
- **Publicación:** el sitio es `veritech-aleph` (ID `da9d342c-deb9-4d0c-a1bf-69cb5f79f450`). Se publica con `bash herramientas/empaquetar.sh`, que necesita un enlace simbólico temporal `veritech-app → /Users/usuario/Hackaton/veritech-app` en la raíz del worktree; bórralo al terminar. Después:
  ```
  npx netlify-cli deploy --cwd <worktree>/dist --dir . --functions netlify/functions --prod --site da9d342c-deb9-4d0c-a1bf-69cb5f79f450
  ```
  La sesión de la CLI ya está iniciada y el usuario ya autorizó este comando.

## Feedback que hay que resolver
1. **Autor del fragmento.** Cuando el alumno usa un fragmento, la web tiene que decirle claramente que escriba **el autor del texto original**: quien escribió la fuente, no él mismo ni el nombre de la web.
2. **La casilla «fragmento» pasa desapercibida.** Hay que agrandarla y hacerla visible.
3. **La profundidad premia la extensión, no la profundidad.**
   - Un artículo enorme sale verde solo por ser largo, aunque sea relleno.
   - Una noticia corta pero sustanciosa (con datos, fuentes citadas y referencias) sale roja solo por ser corta.

## Tareas, en orden

### 1. Autor del texto original (`index.html`, `js/index.js`)
- Cambia la etiqueta de `#autor` a «Autor del texto original». Debajo añade una ayuda: «Quien escribió la fuente (persona o institución), no tú ni el nombre de la web. Suele estar en la portada, bajo el título o al final».
- Si `#frag` está marcada, o se subió una imagen o un rango parcial de un PDF, y **no hay autor** detectado ni escrito:
  - resalta el campo `#autor` (borde y fondo de aviso, con los tokens `--warn` y `--warn-bg`);
  - muestra bajo el campo: «Es un fragmento: escribe aquí el autor del texto original para poder evaluarlo».
- Haz lo mismo con `#anio`, con el mensaje «Escribe el año en que se publicó el texto original».
- En las señales Autoría y Fecha del motor, cambia `FALTA_EN_FRAGMENTO` por: «No aparece en el fragmento. Escribe arriba el autor del texto original (o el año), que suele estar en la portada o bajo el título».
- El resaltado desaparece en cuanto el campo tiene valor, o cuando hay fuente completa por URL o por PDF que trae el dato.

### 2. Casilla «fragmento» grande y visible (`index.html`)
- Convierte `.check` de `#frag` en una tarjeta clicable:
  - toda la tarjeta es la zona de clic y mide **al menos 56 px** de alto;
  - borde de 1.5 px y relleno de 12–14 px;
  - checkbox de **22 px** o más;
  - título en negrita de 0.9–0.95rem: «¿Es solo una parte de un texto más largo?»;
  - debajo, en texto secundario: «Márcalo si pegaste o subiste solo el párrafo o la página que vas a citar. Así no te penaliza por la extensión».
- **Marcada:** borde y fondo de acento (`--accent`, `--accent-soft`).
- **Desactivada** (hay fuente completa): opacidad de 0.55 y una línea que explique «No hace falta: se evaluó la fuente completa».
- Colócala **justo debajo del textarea `#t`**, antes de Autor y Año.
- Mantén el `<label for="frag">` y el foco visible con teclado. En móvil (375 px) no debe haber scroll horizontal.

### 3. Profundidad sin premiar la extensión (`js/motor.js`)
Reescribe la señal 9. La extensión solo sirve como **piso mínimo**, y la profundidad se mide por **densidad de sustancia**. Todo se calcula sobre el texto evaluado, que es `textoCompleto` si existe:
- **Piso:** con menos de 60 palabras, estado `warn`, 0 puntos: «Demasiado breve para juzgar su profundidad». Nunca pongas rojo solo por ser corto.
- **Indicadores de sustancia**, contados por cada 300 palabras:
  - datos concretos: cifras con unidad o `%`, fechas completas, montos;
  - atribuciones: «según», «dijo», «afirmó», «explicó», «de acuerdo con», citas entre comillas de 5 o más palabras;
  - referencias: `https://`, `(AAAA)`, `[n]`, `et al.` y `opts.enlaces`.
- **Relleno:** las frases de la lista `FILLER`, contadas por cada 300 palabras.
- **Resultado** (ajusta los umbrales con los casos de prueba de abajo y documenta los finales en un comentario):
  - densidad alta: `ok`, +6, con el detalle «Aporta datos concretos y dice de dónde salen (N datos, M atribuciones)»;
  - densidad media: `warn`, 0;
  - densidad baja, sobre todo si es largo: `bad`, −6, con el detalle «Mucho texto y poca sustancia: casi no da datos ni dice de dónde salen».
- En modo fragmento sin fuente completa, sigue en `na` y 0, como ahora.
- El detalle debe mencionar la cifra de palabras solo como dato, nunca como el motivo del color.
- Sube `MOTOR_VERSION` a `"sitio-1.3"`.

### 4. Paridad y documentación
- Lleva **el mismo cambio de la señal 9** a `/Users/usuario/Hackaton/veritech-app/motor/motor.js`, para que `paridad.test.js` vuelva a dar 145/145. No toques nada más de `veritech-app`.
- Si algún fixture de `veritech-app/test/fixtures.js` o de `bordes.test.js` fija la profundidad antigua, **detente y pregúntame** antes de cambiarlo.
- Añade a `CAMBIOS-veritech.md` una sección con la fecha de hoy. Tiene que decir que la profundidad cambió de criterio y que las calibraciones hechas con `sitio-1.2` o anteriores no se comparan directamente con las de `sitio-1.3`.
- Actualiza la guía (`guia-prueba.html`) en la lista de limitaciones: «La profundidad mide datos y fuentes citadas, no la extensión».

## Casos de prueba (script de Node en el scratchpad que cargue `motor.js` con `vm`)

| Caso | Texto | Resultado esperado de Profundidad |
|---|---|---|
| A. Noticia corta y sustanciosa | Unas 220 palabras con 5 cifras con unidad o %, 3 atribuciones («según el INEI…», «dijo la ministra…») y 2 enlaces | `ok`. No debe salir `bad` |
| B. Texto largo y hueco | Unas 1500 palabras de relleno, sin cifras ni atribuciones, con 4 frases de `FILLER` | `bad` o `warn`. Nunca `ok` |
| C. Artículo largo y bueno | Unas 1500 palabras con datos, atribuciones y 8 referencias | `ok` |
| D. Texto de 40 palabras | — | `warn`, 0 puntos. Nunca `bad` |
| E. Fragmento sin fuente completa | — | `na`, 0 puntos |

Imprime el estado y los puntos de cada caso y el puntaje total.

## Límites
- Solo toca `veritech-sitio/index.html`, `veritech-sitio/js/index.js`, `veritech-sitio/js/motor.js`, `veritech-sitio/guia-prueba.html`, `CAMBIOS-veritech.md` y `/Users/usuario/Hackaton/veritech-app/motor/motor.js`.
- Haz solo lo que pide este documento. No cambies las otras 8 señales, ni sus pesos, ni la función de Netlify.
- **Detente y pregúntame antes de:** borrar archivos, añadir dependencias, cambiar fixtures de pruebas o tocar otra señal del motor.

## Criterios de aceptación (compruébalos todos)
1. Los 5 casos de prueba dan el resultado esperado. Muestra la salida del script.
2. `node --test` en la copia temporal de `veritech-app` da **145/145**.
3. En el navegador, con `herramientas/servidor-local.py` a través de una configuración temporal en `.claude/launch.json` que luego revertirás:
   - con «fragmento» marcada y sin autor, el campo Autor queda resaltado con el mensaje del texto original;
   - al escribir un autor, el resaltado desaparece;
   - la tarjeta mide 56 px o más de alto (compruébalo con `getBoundingClientRect`);
   - cero errores de consola y cero violaciones de CSP;
   - a 375 px de ancho no hay scroll horizontal.
   Adjunta capturas de la tarjeta sin marcar, marcada y desactivada.
4. Haz un commit en la rama con un mensaje en español, fast-forward de `main` en `/Users/usuario/Hackaton` (`git merge --ff-only`) y publica con el comando de arriba.
5. En `https://veritech-aleph.netlify.app`, repite el caso A pegado a mano y confirma que la profundidad sale en verde.

## Entrega
Al terminar, dame:
- la lista de archivos cambiados;
- ✅/❌ por cada criterio, con la evidencia;
- los umbrales finales de profundidad;
- la URL del deploy;
- lo que quedó pendiente.
