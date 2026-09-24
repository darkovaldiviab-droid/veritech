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
