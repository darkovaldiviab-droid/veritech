# SUPERPROMPT — VeriTech: dejar lista la prueba del colegio (entrega: próxima semana)

## Rol
Actúa como líder técnico y de producto de VeriTech. Trabajas en `/Users/usuario/Hackaton`. Eres práctico: priorizas lo que el colegio va a tocar la próxima semana y dejas por escrito lo que no se alcanza. Escribe todo en español, en frases claras y sin tecnicismos cuando el texto vaya a leerlo el colegio.

## Contexto (léelo antes de hacer nada)
- **VeriTech** ayuda a los alumnos a evaluar fuentes. Tiene tres funciones: un **semáforo de fuentes** (puntaje de 0 a 100), un **verificador de citas** y un **generador de bibliografía** APA/MLA.
- **Web pública:** `veritech-sitio/`. Son HTML estáticos para Netlify con `_headers`. Para verla en local está `.claude/launch.json` → `veritech` (puerto 8830).
- **Producto en construcción:** `veritech-app/`. Incluye el motor, la extensión Chrome MV3, el panel del profesor (con datos ficticios), el esquema Supabase con RLS, un CLI de alta de colegios y las pruebas. Hoy `node --test` pasa sin fallos.
- **Documentos clave:**
  - `PLAN-VeriTech-Aleph.md`: auditoría y lista de mejoras M01 a M28, con fases y criterios de salida.
  - `CAMBIOS-veritech.md`: cambios ya hechos y pendientes.
  - `veritech-app/docs/preguntas-direccion.md`
- **Cliente:** el Colegio Aleph (Perú). Los usuarios son alumnos menores de edad y sus profesores.

## Objetivo
La próxima semana le enviamos VeriTech al colegio para que lo **pruebe** y nos dé **feedback**. Con ese feedback mejoramos el producto y después **habilitamos el servicio de pago**. Tu trabajo es dejar la prueba lista, segura y medible, y preparar el camino hacia el cobro.

## Regla de oro: honestidad sobre el alcance
El plan calcula entre 8 y 12 semanas para cuentas reales, backend y un piloto con datos de alumnos. **No se llega en una semana.** Por eso esta prueba es una **prueba de validación**:
- Sin cuentas.
- Sin datos personales de alumnos en ningún servidor.
- Con la web y los prototipos que ya existen.

Si algo del pitch no existe, la prueba **no lo promete**.

---

## Tareas, en orden de prioridad

### P0 — Sin esto no se envía

1. **Completar los datos pendientes** (marcados en amarillo o con «[completar]») en `privacidad.html`, `terminos.html`, `cookies.html`, `feedback.html`, `index.html` y `presentacion.html`: correo del equipo, colegio y curso, nombres, responsable adulto y fecha de borrado de respuestas.
   - **Pídeme los datos que no tengas. No los inventes.**
   - Verifica al final con `grep -i "completar\|Nombre 1\|00 %"`: no debe devolver nada.
2. **Ajustar el pitch a la realidad (M23).** En `presentacion.html` cambia «ya funciona», «no es una maqueta», el informe del profesor, el modo tarea y la instalación en salas. Esas funciones deben aparecer como «en desarrollo» o «lo que viene». Llena las cifras de la encuesta con datos reales o quita esa sección.
3. **Seguridad básica (M09):**
   - Quita las metas y comentarios de referido de Netlify de todos los HTML.
   - Aloja las tipografías en el propio sitio, en lugar de cargarlas desde Google.
   - Mueve el JS en línea a archivos `.js` y activa la CSP en modo bloqueo, sin `'unsafe-inline'`.
   - Verifica en el navegador que no aparezcan errores de consola ni violaciones de CSP.
4. **Aviso visible «orientativo, no es nota»** junto a cada puntaje del semáforo y del verificador de citas.
5. **Instrumento de feedback del colegio.** Amplía `feedback.html` o crea una página nueva con dos formularios de Netlify:
   - **Para profesores:** utilidad del semáforo de 1 a 5, ¿el puntaje coincidió con tu criterio? (sí/no/a veces con ejemplo), claridad, qué falta, ¿pagarías o recomendarías pagar?, qué precio te parece razonable y qué necesitarías para usarlo en clase.
   - **Para alumnos:** anónimo y sin datos personales. Preguntas: facilidad, qué entendieron y qué les confundió.
   - Los dos formularios deben incluir consentimiento y la trampa antibots. Prueba que el envío funcione (el atributo `data-netlify` debe estar presente).
6. **Guía de prueba para el colegio** en `veritech-sitio/guia-prueba.html`, con el mismo diseño del sitio. Debe explicar en 1 página:
   - qué es VeriTech;
   - qué probar: 3 a 5 tareas concretas con fuentes de ejemplo buenas y malas;
   - cuánto dura: 1 a 2 semanas;
   - qué **no** incluye todavía;
   - cómo dar feedback;
   - a quién escribir.
7. **Mini calibración (adelanto de M10).** Prepara una hoja o un formulario donde cada profesor etiquete 10 a 20 fuentes reales como «confiable / dudosa / no confiable». Así mediremos luego si el semáforo coincide con su criterio en al menos el 70 % de los casos.

### P1 — Muy recomendable si da el tiempo

8. **Demo del panel del profesor.** Deja `veritech-app/panel/index.html` presentable con datos ficticios y un rótulo claro «Vista previa, datos de ejemplo», para que la dirección vea hacia dónde va el servicio.
9. **Demo de la extensión.** Prepara instrucciones de 5 pasos para cargarla en modo desarrollador desde `veritech-app/extension/LEEME.md`. Solo la usa el equipo para mostrarla; no se instala a los alumnos todavía.
10. **Control de versiones (M19).** Ejecuta `git init` en `Hackaton/`, crea un `.gitignore` (excluye los `.zip` y `node_modules`) y haz un primer commit. Antes de enviar, confirma que `node --test` pasa.
11. **Checklist de despliegue.** Verifica:
    - que Netlify sirve `_headers`;
    - que los formularios aparecen en el panel de Netlify;
    - que el sitio se ve bien en móvil (375 px) y en modo oscuro;
    - que el contraste es AA.

### P2 — Preparar el cobro (documentos, no código)

12. **Correo o carta para la dirección.** Qué enviamos, qué pedimos (probarlo 1 a 2 semanas y responder el feedback), fecha límite y las preguntas bloqueantes de `PLAN §9.1`:
    - adulto responsable;
    - Microsoft 365 o Google Workspace;
    - número de alumnos y profesores;
    - dispositivos que usan;
    - presupuesto y quién lo aprueba;
    - si aceptan un piloto gratuito con acuerdo de datos.
13. **Plan post-feedback de una página.** Cómo convertiremos el feedback en cambios. Por ejemplo: triaje en una tabla «problema → frecuencia → mejora M## → prioridad». Incluye el camino hacia el cobro:
    - Fase 0 completa: cuentas, RLS, extensión, panel, legal revisado por un abogado y adulto que facture;
    - piloto gratuito de 4 a 6 semanas;
    - contrato y primer cobro.
    - Incluye también las opciones de precio de `PLAN §7`.

---

## Restricciones
- **Nunca** recojas nombres, correos ni datos identificables de alumnos en esta prueba.
- No inventes cifras, precios ni datos legales. Marca `[a verificar]` lo que no esté confirmado.
- Mantén el diseño, la accesibilidad (AA) y el tono actuales del sitio.
- No publiques ni despliegues sin mi confirmación. Deja el `.zip` listo para Netlify.
- Antes de editar un archivo, léelo. Si algo contradice el plan, avísame.

## Cómo trabajar
1. Lee los documentos de contexto y haz una lista de lo que falta, con archivo y línea.
2. Hazme **en un solo mensaje** todas las preguntas cuya respuesta no esté en el repositorio: datos legales, contacto, fechas y profesor del piloto.
3. Ejecuta P0 → P1 → P2. Después de cada bloque, verifica en el navegador con el preview `veritech`, revisa la consola y ejecuta `node --test`.
4. Al terminar, entrega:
   - un resumen de lo hecho y verificado;
   - lo que quedó pendiente y por qué;
   - la ruta del `.zip` final;
   - el texto del correo para la dirección, listo para copiar.

## Criterio de «listo para enviar»
- [ ] 0 resultados «[completar]», «Nombre 1» y «00 %».
- [ ] El pitch no promete nada que no exista.
- [ ] CSP en bloqueo, sin errores de consola, sin Google Fonts ni metas de Netlify.
- [ ] Formularios de feedback (profesor y alumno) probados de punta a punta.
- [ ] Guía de prueba y hoja de calibración listas.
- [ ] `node --test` en verde y primer commit hecho.
- [ ] Correo a la dirección y plan post-feedback redactados.
- [ ] `.zip` final generado y probado en local.
