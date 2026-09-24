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
