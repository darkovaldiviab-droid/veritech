# VeriTech: qué hacemos con el feedback del colegio

*Plan de trabajo · 24 de septiembre de 2026 · Complementa [PLAN-VeriTech-Aleph.md](PLAN-VeriTech-Aleph.md)*

## 1. Qué datos vamos a recibir

| Formulario en Netlify | Quién responde | La pregunta que responde |
|---|---|---|
| `calibracion` | Docentes | ¿El semáforo juzga como un docente? |
| `opinion-docentes` | Docentes | ¿Sirve en clase? ¿Qué es imprescindible? ¿Pagarían? |
| `opinion-sobre-la-web` | Estudiantes | ¿Se entiende? ¿Lo usarían en su próxima tarea? |
| Respuestas de la dirección (correo) | Dirección | ¿Google o Microsoft? ¿Cuántos alumnos? ¿Quién decide y con qué presupuesto? |

Para descargar los datos: en Netlify, entra a **Forms**, elige el formulario y pulsa **Download as CSV**.

**Para leerlos sin hacer cuentas:** abre `/analisis-prueba.html` en el sitio publicado y carga ahí los tres CSV. La página calcula todo lo de la sección 2, marca qué criterios se cumplen y copia un resumen en texto. Los archivos se leen en tu navegador y no se suben a ningún lado.

## 2. Cómo leer los resultados (la semana después del cierre)

**Calibración (M10).** En el CSV de `calibracion`, el porcentaje de filas con `coincide = si` es el acuerdo entre el semáforo y los docentes.

- **Meta: ≥ 70 %** (criterio de salida de la Fase 0a).
- Revisar una por una las filas con `coincide = no`. La columna `senales` dice qué regla pesó más. Si la misma regla aparece una y otra vez, hay que ajustar su peso en `veritech-sitio/js/motor.js` o en `veritech-app/motor/motor.js`, y subir `MOTOR_VERSION`.
- Si el acuerdo es menor al 50 %, **no** se propone el piloto hasta corregir el motor y repetir la calibración.

**Triaje de los comentarios.** Pasar cada comentario, docente o estudiante, a una tabla con estas columnas:

| Problema (en palabras del usuario) | Cuántos lo dijeron | Mejora del plan (M##) o nueva | Prioridad (P0/P1/P2) | Decisión |
|---|---|---|---|---|

Reglas para decidir la prioridad:

- Lo que **más de la mitad de los docentes** marcó como imprescindible pasa a P0 del piloto.
- Un error que **impide usar** la herramienta se arregla antes de cualquier otra cosa.
- Una idea nueva que nadie más repite queda en P2 hasta que aparezca de nuevo.

**Señales de que vale la pena seguir.** Si se cumplen estas cuatro, pedimos el piloto:

- Utilidad del semáforo según los docentes: promedio ≥ 4 de 5.
- La mayoría de los docentes respondió «Sí» o «Sí, con cambios» a usarlo en clase.
- La mayoría de los estudiantes respondió «Sí» o «Tal vez» a usarlo en su próxima tarea.
- La dirección aceptó el piloto gratuito o pidió más información.

## 3. Del feedback al cobro

| Paso | Qué | Duración estimada | Se cierra cuando… |
|---|---|---|---|
| **A. Resumen al colegio** | Enviar los resultados y la lista de cambios | 1 semana tras el cierre | La dirección lo recibe |
| **B. Fase 0a** | Adulto responsable (M01), cuentas con el proveedor del colegio (M02), permisos probados (M03), extensión (M04), panel real (M05), legal revisado por un abogado (M07, M08), motor calibrado (M10) | 5–7 semanas [estimación] | Se cumplen los criterios de salida de 0a del plan |
| **C. Piloto gratuito** | 1–2 clases usan cuentas, extensión y panel; medición antes/después | 4–6 semanas | ≥ 70 % de los alumnos entrega con VeriTech y 0 incidentes de datos |
| **D. Propuesta de pago** | Contrato con anexo de datos, forma de facturar y precio | 2–4 semanas, en paralelo con C | Contrato firmado y primer comprobante emitido |

**Precio (§7.2 del plan, todas son estimaciones del equipo).** Las opciones son:

- Tarifa plana: unos US$ 150 al mes por colegio.
- Por alumno activo: unos US$ 0,50 al mes, o US$ 0,70 con IA.
- Semáforo gratis y plan institucional de pago.

Antes de fijar un precio, contrastar estas cifras con las respuestas a «¿qué monto le parecería razonable?» del formulario docente y con el presupuesto que indique la dirección.

## 4. Lo que queda abierto

- **Adulto responsable.** Sin él no se puede firmar ni facturar (M01). Hay que resolverlo durante la prueba, no después.
- **Mejoras del motor ya hechas en `veritech-app`.** La negación en citas y la fecha de obras citadas todavía no están en la web. Conviene pasarlas antes del piloto y compararlas con los datos de calibración.
- **Tipografías.** Siguen cargándose desde Google Fonts, pendiente de decisión (ver `privacidad.html` §5).
