# VeriTech para el Colegio Aleph: auditoría y plan para un servicio mensual

*Documento de decisión para el equipo VeriTech y la dirección del Colegio Aleph · 23 de septiembre de 2026*

> **Cómo leer las marcas.** `[estimación]` es una cifra calculada por el equipo, sin fuente externa. `[precio a verificar]` es un precio que no pudimos confirmar en una página oficial. `[verificar con abogado/contador]` es un punto legal o tributario que este documento explica pero no dictamina. Las referencias del tipo `index.html:357` señalan el archivo y la línea del código en `veritech-sitio/`.

---

## 1. Resumen ejecutivo

**Qué es VeriTech hoy.** Una web estática de hackatón con tres funciones que sí andan: un **semáforo de fuentes** (puntaje 0-100 sobre texto pegado a mano), un **verificador de citas** por coincidencia de palabras y un **generador de bibliografía** APA 7 / MLA 9. Todo corre y se guarda en el navegador: no hay servidor, cuentas ni conexión entre alumno y profesor.

**Qué falta para cobrar.** (1) **Producto real**: cuentas con el correo del colegio, panel del profesor y la **extensión que promete el pitch y no existe**; (2) **base legal**: un adulto o empresa que emita comprobantes, contrato y obligaciones por tratar datos de menores; (3) **seguridad y operación**: permisos por rol, respaldos, soporte; (4) **evidencia de que el puntaje sirve**, porque nunca se contrastó con profesores.

**Costo.** En tiempo, unas **16 a 24 semanas** de trabajo a tiempo parcial antes del primer cobro, contando el piloto [estimación]. En dinero, **US$ 25–45 al mes** de infraestructura, US$ 5 únicos por la extensión e IA opcional de **≈ US$ 0,08 por alumno al mes** (§5 y §7). Contador, abogado y dominio quedan por cotizar.

**Recomendación.** Seguir, pero **no cobrar todavía**. Cerrar la Fase 0 (los 10 P0 de la §4, empezando por el adulto responsable), hacer un **piloto gratuito de 4-6 semanas con 1-2 clases** y recién entonces proponer precio. Arquitectura: **Supabase + Netlify + extensión Chrome MV3**, con el análisis en el navegador del alumno.

---

## 2. Diagnóstico actual

### 2.1 Lo que funciona de verdad

| Función | Qué hace realmente | Evidencia |
|---|---|---|
| Semáforo de fuente | 9 reglas (autor, fecha, referencias, dominio, relleno, sensacionalismo, certezas, atribución, extensión) sobre una base de 50: verde ≥70, amarillo ≥40, rojo | `index.html:333-343`, `index.html:357-435` |
| Detección de fecha | Busca fechas en español, ISO o dd/mm/aaaa. Si no halla ninguna, toma **el año más alto** que aparezca en el texto | `index.html:344-356` |
| Verificación de cita | Solapamiento de términos: quita palabras vacías, recorta sufijos y cuenta cuántos conceptos de la afirmación aparecen en la fuente | `index.html:437-461` |
| Bibliografía | Arma entradas APA/MLA de tipo «página web» con autor, año, título y dominio, en orden alfabético | `index.html:536-583` |
| Guardado | Solo `localStorage` (clave `veritech.work`), en ese navegador | `index.html:519-521` |
| Encuesta y opinión | Netlify Forms, con trampa antibots y casilla de consentimiento | `encuesta.html:165-174`, `feedback.html:42-44`, `feedback.html:72` |
| Resultados de la encuesta | Calcula porcentajes a partir de un CSV que se **descarga y pega a mano** | `resultados.html:136-140`, `resultados.html:162` |
| Cabeceras de seguridad | nosniff, Referrer-Policy, X-Frame-Options y Permissions-Policy | `_headers:8-11` |

### 2.2 Lo que es solo demo

- **No hay backend ni cuentas**: «no requiere registro, no cobra nada» (`terminos.html:105`); nada se envía a un servidor (`index.html:298`).
- **El texto se pega a mano**: «En la extensión real esto ocurre solo» (`index.html:222`).
- **La IA solo funciona dentro de claude.ai**: los botones están ocultos (`index.html:231`, `index.html:260`) y solo aparecen si existe `window.claude` (`index.html:586-591`); en Netlify nunca se ven.
- **El título de la fuente se adivina** a partir de la primera línea de entre 12 y 130 caracteres del texto pegado (`index.html:523-527`), no del `<title>` real de la página.
- **La detección de fecha puede fallar en silencio.** Si el texto cita un estudio de 2025 y no tiene fecha propia, el sistema asume 2025 (`index.html:351-353`).
- **El verificador de citas no entiende la negación.** «no» es una palabra vacía (`index.html:437`), así que «X reduce Y» y «X no reduce Y» obtienen el mismo puntaje (`index.html:447-461`).
- **Las listas de frases están fijas y en español** (`index.html:318-329`).
- **La CSP está en modo «solo informe»** y permite `'unsafe-inline'`, así que no bloquea nada (`_headers:12`).
- **Hay etiquetas de referido de Netlify** que no forman parte del producto (`index.html:5-9`, `presentacion.html:5-9`, `feedback.html:5-9`, `resultados.html:5-9`).
- **Las tipografías se cargan desde Google** (`index.html:16-18`), y la IP del visitante llega a Google. Está reconocido como pendiente en `cookies.html:115`.
- **Los documentos legales están incompletos**: faltan responsable, correo y plazo (`privacidad.html:84-85`, `privacidad.html:117`, `privacidad.html:120`, `terminos.html:129`). Además, todos describen un prototipo gratuito, sin cuentas y sin garantías (`terminos.html:104-108`).
- **No hay control de versiones ni pruebas.** `veritech-sitio/` contiene solo los 8 HTML y `_headers`: no hay `.git`, ni `package.json`, ni carpeta de pruebas.

### 2.3 Lo que promete el pitch y no existe

| Promesa | Dónde | Estado real |
|---|---|---|
| «Una extensión del navegador. Dos funciones» | `presentacion.html:295-296` | No existe ningún archivo de extensión |
| Semáforo automático en «cada página que abre» | `presentacion.html:301-302` | Solo funciona pegando el texto (`index.html:215-222`) |
| «Cada vez que copia un párrafo, VeriTech guarda de dónde salió» | `presentacion.html:306-307` | No existe; hay que pulsar «Guardar» a mano (`index.html:632-639`) |
| Referencias de revista con volumen y páginas | `presentacion.html:376` | El generador solo produce el formato de página web (`index.html:536-547`) |
| «APA, MLA o el que pida el colegio» | `presentacion.html:381` | Solo APA y MLA (`index.html:279`) |
| «No es una maqueta. Funciona» / «ya funciona» | `presentacion.html:391`, `presentacion.html:458` | Funciona la demo web, no el producto que describe el pitch |
| Informe del curso para el profesor | `presentacion.html:421` | No existe: no hay profesores ni cursos en el sistema |
| «Solo en modo tarea» | `presentacion.html:473` | No existe |
| «Datos agregados» para el colegio | `presentacion.html:474` | No hay datos centralizados |
| «El alumno borra» todo con un botón | `presentacion.html:475` | **Sí existe** en la web (`index.html:646-656`) |
| Instalación en salas de cómputo | `presentacion.html:437` | No hay nada que instalar |
| Datos de la encuesta propia | `presentacion.html:254-265` | Siguen como «00 %» y «N» |

**Conclusión.** La demo sirve para mostrar el criterio de evaluación. El pitch, en cambio, vende un producto (extensión, informes, modo tarea) que está por construir. Estas brechas figuran como P0 o P1 en la §4.

---

## 3. Qué espera un colegio que paga mensualmente

**Quién compra y quién usa.** Compra la **dirección o coordinación académica**, que responde ante padres y ley. Usan los **profesores** (lenguaje y ciencias, según `presentacion.html:436`) y los **alumnos, casi todos menores**. Sistemas instala y administra.

**Necesidades concretas del comprador:**

1. **Cuentas institucionales** con el proveedor del colegio, **Microsoft 365 o Google Workspace (dato a confirmar)**: sin contraseñas nuevas y con baja automática cuando el alumno se va.
2. **Panel del profesor** por clase y por tarea con las fuentes entregadas, su semáforo y su bibliografía. El profesor ve **lo que el alumno entrega, no lo que navega**, como pide `presentacion.html:424`.
3. **Reportes** por curso y materia: tipos de fuente, porcentaje en rojo, evolución (`presentacion.html:421`, `presentacion.html:438`).
4. **Una extensión real** que sistemas pueda instalar de forma centralizada. Con Google Workspace se puede forzar desde la consola ([Chrome Enterprise and Education Help](https://support.google.com/chrome/a/answer/6306504), 23/09/2026).
5. **Soporte** con un contacto con nombre, tiempo de respuesta y guía para profesores.
6. **Disponibilidad** en horario escolar y épocas de entrega, con avisos de mantenimiento.
7. **Exportación (CSV) y borrado** de los datos al terminar el contrato.
8. **Garantías sobre menores**: cláusula de datos y lista de terceros que los tocan.

---

## 4. Lista completa de mejoras

Esfuerzo en semanas de un equipo escolar de 3–4 personas a tiempo parcial: **S** ≤ 1 semana · **M** 2–4 semanas · **L** 5 o más semanas [estimación].

| ID | Área | Problema | Propuesta | Prioridad | Esfuerzo | Evidencia |
|---|---|---|---|---|---|---|
| M01 | Negocio | Nadie del equipo puede firmar un contrato ni emitir comprobantes si es menor; no hay adulto responsable | Designar a un adulto responsable (padre, madre o docente) o a una persona jurídica que contrate y facture | P0 | S | `privacidad.html:85` (responsable «[completar]»), `terminos.html:81` |
| M02 | Técnico | No hay servidor, base de datos ni cuentas | Backend gestionado (Supabase) con inicio de sesión Microsoft o Google restringido al dominio del colegio | P0 | L | `terminos.html:105`, `index.html:520-521` |
| M03 | Seguridad | Sin cuentas no existen roles ni aislamiento entre alumnos, clases ni colegios | Roles (admin del colegio, profesor, alumno) con Row Level Security y pruebas automáticas de «alumno A no ve a B». Incluye exportación y borrado por colegio | P0 | M | No hay control de acceso: todo es `localStorage` (`index.html:519-521`) |
| M04 | Producto | La extensión prometida no existe | Extensión Chrome MV3 que muestre el semáforo de la página actual reutilizando el motor de `index.html:357-435` | P0 | L | `presentacion.html:295-302`, `index.html:222` |
| M05 | Producto | No hay panel del profesor ni tareas | Crear clases y tareas, que el alumno entregue su lista de fuentes y que el profesor vea las entregas con su semáforo | P0 | L | `presentacion.html:421` |
| M06 | Privacidad/Legal | No hay contrato con el colegio ni cláusula de encargo de tratamiento de datos de menores | Contrato de servicio con anexo de protección de datos: VeriTech como encargado y el colegio como titular del banco de datos | P0 | M | `terminos.html:104-111` («sin pagos», «tal cual») |
| M07 | Privacidad/Legal | Privacidad, términos y cookies describen un prototipo gratis y tienen campos vacíos | Reescribirlos para un servicio con cuentas y pago, con finalidades, plazos, terceros (Supabase, Netlify) y el flujo de derechos ARCO a través del colegio | P0 | M | `privacidad.html:84-85`, `privacidad.html:93`, `privacidad.html:117`, `terminos.html:105` |
| M08 | Privacidad/Legal | Se tratarán datos identificables de menores; no se evaluó el registro ante la ANPD, la transferencia internacional ni el consentimiento de los padres | Revisar con un abogado quién inscribe el banco de datos, cómo se obtiene el consentimiento (vía el colegio) y cómo se declara la transferencia a EE. UU. | P0 | M | `privacidad.html:103-106`, `privacidad.html:110` |
| M09 | Seguridad | CSP que no bloquea, `'unsafe-inline'`, fuentes de Google y metas de referido | Pasar el JS a archivos, activar la CSP en modo bloqueo sin `'unsafe-inline'`, alojar las tipografías en el propio dominio y quitar las metas de Netlify | P0 | S | `_headers:12`, `index.html:5-9`, `index.html:16-18`, `cookies.html:115` |
| M10 | Producto | El puntaje nunca se validó frente al juicio de un profesor; cobrar por un número sin evidencia es un riesgo | Calibración: 60–100 fuentes reales etiquetadas por profesores, medir el acuerdo y ajustar pesos y umbrales | P0 | M | Pesos fijos en `index.html:364-430`; umbrales en `index.html:433` |
| M11 | Producto | «Bibliografía automática al copiar» no existe | En la extensión, al copiar texto se registran la URL, el título, el autor y la hora en la tarea activa (solo en modo tarea) | P1 | M | `presentacion.html:306-307` |
| M12 | Producto | El «modo tarea» prometido no existe | Interruptor en la extensión: fuera de ese modo no se registra nada y no se envía nada | P1 | S | `presentacion.html:473` |
| M13 | Producto | Reportes agregados del curso prometidos pero inexistentes | Reporte por clase y materia con distribución de semáforos y tipos de dominio, sin historial individual | P1 | M | `presentacion.html:421`, `presentacion.html:474` |
| M14 | Producto | La bibliografía solo tiene el formato «página web» | Agregar artículo de revista (DOI, volumen, páginas), libro y fecha de consulta, con edición manual de campos | P1 | M | `index.html:536-547` frente a `presentacion.html:376` |
| M15 | Producto | La fecha puede salir del año de un estudio citado | La extensión lee metadatos (`article:published_time`, `<time>`, JSON-LD) antes de adivinar | P1 | S | `index.html:351-353` |
| M16 | Producto | El título sale de la primera línea del texto | La extensión usa `<title>`, `og:title` y el autor de los metadatos | P1 | S | `index.html:523-527` |
| M17 | Producto | El verificador de citas ignora la negación y no reconoce sinónimos | Tratar la negación, advertir cuando la coincidencia es solo léxica y usar la IA opcional como segunda opinión | P1 | M | `index.html:437`, `index.html:447-461` |
| M18 | Técnico | La IA depende de `window.claude`, que no existe fuera de claude.ai | Llamada propia desde el servidor (Edge Function) con la clave guardada en el servidor, límite por alumno e interruptor por colegio | P1 | M | `index.html:586-600` |
| M19 | Técnico | Sin control de versiones, pruebas ni despliegue reproducible | Repositorio git, pruebas unitarias del motor con casos fijos e integración continua antes de cada despliegue | P1 | S | Carpeta `veritech-sitio/` sin `.git` ni pruebas |
| M20 | Operación | No hay monitoreo, respaldos verificados ni registro de errores | Monitor de disponibilidad, registro de errores, restauración de respaldo ensayada al menos una vez | P1 | S | `terminos.html:108` (sin garantía de continuidad) |
| M21 | Operación | No hay soporte definido | Correo de soporte con responsable, tiempos de respuesta, guía para profesores y página de estado | P1 | S | `privacidad.html:85` (correo «[completar]») |
| M22 | Operación | Si el equipo se gradúa, el servicio queda sin dueño | Documentar el despliegue, las cuentas a nombre del adulto responsable y un plan de traspaso o cierre con exportación | P1 | S | `privacidad.html:84` (el equipo son estudiantes) |
| M23 | Negocio | El pitch afirma «ya funciona» y muestra datos vacíos | Ajustar el pitch a lo que existe y llenar las cifras con la encuesta real antes de hablar de precio | P1 | S | `presentacion.html:391`, `presentacion.html:458`, `presentacion.html:254-265` |
| M24 | UX/Accesibilidad | La extensión y el panel nuevos deben mantener el nivel AA ya logrado en la web | Revisar contraste, teclado y lector de pantalla en la ventana emergente de la extensión y en el panel | P1 | S | Patrón de pestañas ya accesible en `index.html:603-626` |
| M25 | Operación | Los datos del piloto viajarían por CSV manual | Guardar la encuesta del piloto y las métricas de uso en la base de datos, con consentimiento, y dejar `resultados.html` solo para la hackatón | P1 | S | `resultados.html:136-140` |
| M26 | Producto | Listas de dominios y de frases genéricas, sin contexto peruano | Lista curada de fuentes (.gob.pe, .edu.pe, revistas nacionales) mantenida con los profesores | P2 | M | `index.html:387-395`, `index.html:318-329` |
| M27 | Producto | Solo analiza texto en español | Listas de frases en inglés para cursos bilingües | P2 | S | `index.html:318-329` |
| M28 | Producto | La tarea vive fuera de la plataforma que ya usa el colegio | Integración con Google Classroom o Microsoft Teams para importar clases y tareas | P2 | L | Sin integraciones en ningún archivo |

---

## 5. Arquitectura propuesta

### 5.1 Opciones comparadas

Precios consultados el **23/09/2026**.

| | A. Supabase + Netlify | B. Firebase | C. Next.js (Vercel) + Neon Postgres |
|---|---|---|---|
| **Costo mensual** | Supabase Pro US$ 25; Free US$ 0, pero **los proyectos gratuitos se pausan tras 1 semana de inactividad** ([supabase.com/pricing](https://supabase.com/pricing)). Netlify Free US$ 0 / Personal US$ 9 / Pro US$ 20 ([netlify.com/pricing](https://www.netlify.com/pricing/)); uso comercial en el plan gratuito [precio a verificar] | Plan Spark sin costo: 50 000 usuarios activos al mes, 50 000 lecturas y 20 000 escrituras de Firestore al día ([firebase.google.com/pricing](https://firebase.google.com/pricing)). Pasado eso, Blaze a tarifa de Google Cloud [precio a verificar] | Vercel Hobby US$ 0, pero es «para uso personal, no comercial»; Pro US$ 20 ([vercel.com/pricing](https://vercel.com/pricing)). Neon Free US$ 0 (0,5 GB); Launch por uso, US$ 0,106 por CU-hora y US$ 0,35 por GB-mes ([neon.com/pricing](https://neon.com/pricing)) |
| **Curva de aprendizaje** | Media: SQL y RLS, todo en un panel | Baja al inicio; alta para reportes (Firestore no es relacional) | Alta: el equipo programa autenticación, permisos y API |
| **Inicio de sesión institucional** | Microsoft Entra ID con restricción a un solo tenant mediante «Azure Tenant URL» ([docs de Supabase](https://supabase.com/docs/guides/auth/social-login/auth-azure)); Google OAuth incluido. SAML no está en los planes Free ni Pro (no hace falta) | Google nativo. SAML/OIDC requiere Identity Platform, con 50 usuarios gratis y luego pago ([firebase.google.com/pricing](https://firebase.google.com/pricing)). Proveedor Microsoft integrado [verificar] | Auth.js admite Microsoft y Google, pero configurarlo y asegurarlo es tarea del equipo |

**Elección: opción A (Supabase + Netlify).** Razones:

1. Los reportes por clase y tarea son consultas relacionales: SQL simple en Postgres.
2. La RLS pone «un alumno solo ve lo suyo» *en la base de datos*, lo que reduce el riesgo de errores de permisos con datos de menores.
3. Admite Microsoft y Google, sin esperar a saber qué usa el colegio.
4. Netlify ya se usa.
5. Se debe usar **Supabase Pro** desde que haya alumnos reales: un servicio pagado no puede pausarse en vacaciones.

### 5.2 Modelo de datos (esquema)

```
colegio (id, nombre, dominio_correo, proveedor_login[microsoft|google], tenant_id, estado_contrato)
   │
   ├── usuario (id, colegio_id, correo_institucional, nombre_mostrado, rol[admin|profesor|alumno], activo)
   │
   └── clase (id, colegio_id, nombre, grado, materia, anio_escolar)
          │
          ├── clase_profesor (clase_id, usuario_id)          -- uno o varios profesores
          ├── matricula      (clase_id, usuario_id)          -- alumnos de la clase
          │
          └── tarea (id, clase_id, titulo, fecha_entrega, formato_cita[apa|mla], ia_habilitada)
                 │
                 └── entrega (id, tarea_id, alumno_id, estado[borrador|entregada], entregada_en)
                        │
                        └── fuente_evaluada (id, entrega_id, url, dominio, titulo, autor, anio,
                                             puntaje, nivel[ok|warn|bad], señales_json,
                                             version_motor, creada_en)
                               └── cita_verificada (id, fuente_id, afirmacion, porcentaje, nivel)

registro_auditoria (id, colegio_id, usuario_id, accion, objeto, fecha)   -- quién vio o exportó qué
```

**Decisiones de privacidad del modelo:**

- **No se guarda el texto de la página**, solo URL, metadatos y señales.
- **No hay historial de navegación**: solo lo que el alumno agrega a una entrega.
- `version_motor` explica cambios de puntaje tras recalibrar.
- Borrar un `colegio` borra todo en cascada al terminar el contrato.

### 5.3 Dónde corre el análisis

**En el navegador del alumno, dentro de la extensión.** El motor actual ya funciona sin servidor (`index.html:357-461`); se pasa a un módulo JS que comparten la extensión y el panel.

- **Privacidad.** El servidor nunca recibe las páginas visitadas, solo lo que el alumno guarda en una tarea (coherente con `index.html:298` y `presentacion.html:424`).
- **Costo.** Cero cómputo de servidor por análisis.
- **Desventaja.** El alumno podría alterar el puntaje; el servidor lo **recalcula** desde las señales y marca discrepancias. No es antifraude fuerte, y se dice así.

El servidor solo guarda entregas, genera reportes y, si el colegio lo activa, llama a la IA.

### 5.4 Cómo se construye la extensión (Chrome Manifest V3)

- **`manifest.json`** con `manifest_version: 3`, permisos mínimos (`activeTab`, `storage`, `scripting`) y `host_permissions` solo para el dominio de la API de VeriTech. **No se pide `<all_urls>` permanente** ni el permiso `history`.
- **Script de contenido** que se inyecta solo cuando el alumno pulsa el icono o tiene el modo tarea activo. Lee el texto visible y los metadatos (`<title>`, `og:*`, `article:published_time`, JSON-LD), ejecuta el motor y muestra el semáforo.
- **Service worker** (el que usa MV3 en lugar de las páginas de fondo) que maneja el inicio de sesión con Supabase y el envío de fuentes a la entrega activa.
- **Captura al copiar** (M11): un escuchador del evento `copy` registra la URL, el título y la hora, **solo en modo tarea**.
- **Publicación.** Cuenta de Chrome Web Store con pago único de US$ 5 según foros de soporte de Google ([support.google.com](https://support.google.com/chrome/thread/13959323/can-t-pay-developer-registration-5-fee), 23/09/2026; la documentación oficial no da el monto: [precio a verificar]). Publicación «no listada» e instalación forzada desde la consola de Google ([Chrome Enterprise and Education Help](https://support.google.com/chrome/a/answer/6306504)). Con Microsoft, la instalación centralizada va por otra vía [verificar con sistemas del colegio].

### 5.5 Si se usa un modelo de IA

**Uso propuesto:** la «lectura profunda» y la segunda opinión sobre una cita, que ya existen como prompts (`index.html:707`, `index.html:711`), pasadas a una función del servidor.

**Costo por alumno al mes con Claude Haiku 4.5:** US$ 1 por millón de tokens de entrada y US$ 5 por millón de salida ([platform.claude.com/docs/en/about-claude/pricing](https://platform.claude.com/docs/en/about-claude/pricing), consultado el 23/09/2026).

- Por consulta: unos 1 500 tokens de entrada (hasta 3 500 caracteres de fuente más las instrucciones) y 200 de salida. Eso da 1 500 × 1/1 000 000 + 200 × 5/1 000 000 ≈ **US$ 0,0025 por consulta** [estimación].
- Con 30 consultas por alumno al mes, **≈ US$ 0,075 por alumno al mes** [estimación].
- Con Claude Sonnet 5 (US$ 2 / US$ 10), el costo se duplica: ≈ US$ 0,15 por alumno al mes [estimación].
- Un límite de consultas por alumno y por día fija el techo del gasto.

**Qué datos salen del colegio:**

- Sale el texto de la fuente (casi siempre público) y, al verificar citas, la **afirmación escrita por el alumno**. **No** salen nombre, correo ni identificador.
- El destino es un proveedor en EE. UU. (Anthropic): otra transferencia internacional que el contrato debe declarar [verificar con abogado/contador].
- **La IA viene desactivada por defecto** y cada colegio decide si la activa (`tarea.ia_habilitada`).

---

## 6. Hoja de ruta por fases

### Fase 0: imprescindibles antes de cualquier cobro (8–12 semanas [estimación])

Se divide en dos partes que pueden correr en paralelo.

**0a · Bloquea el piloto.**

- Entregables: M01 (adulto responsable), M02, M03, M04 (extensión con semáforo), M05 (panel mínimo: clase, tarea y entregas), M07 y M08 en versión piloto, M09 y M10.
- Además, un **acuerdo de piloto gratuito** firmado con el colegio que incluya la cláusula de datos (versión corta de M06).

**Criterio de salida medible de 0a:**

- 3 cuentas de prueba (admin, profesor, alumno) entran con el proveedor del colegio; una de otro dominio es rechazada.
- 100 % de las pruebas de RLS pasan (A no lee a B; el profesor de X no ve Y).
- La extensión muestra el semáforo en 20 páginas de prueba sin errores de consola.
- La CSP está en modo bloqueo y no genera avisos.
- Calibración M10: el semáforo coincide con el profesor en ≥ **70 %** de 60 fuentes (meta propuesta).
- Un abogado revisó los documentos legales del piloto.

**0b · Bloquea el cobro (puede avanzar durante el piloto).**

- Entregables: M06 como contrato completo, forma de facturar resuelta (§8) y precio aprobado por el colegio.
- Criterio de salida: contrato firmado por ambas partes y una persona o empresa capaz de emitir un comprobante válido.

### Fase 1: piloto gratuito con 1 o 2 clases (4–6 semanas)

**Entregables:**

- Extensión instalada para los alumnos del piloto; ≥ 2 tareas reales en el panel.
- M12 (modo tarea), M19, M20, M21 y M25.
- Medición antes/después de la calidad de fuentes (el experimento de `presentacion.html:435`) e informe a la dirección.

**Criterio de salida medible:**

- ≥ 70 % de los alumnos del piloto entregan al menos una tarea mediante VeriTech [meta propuesta].
- Cada profesor del piloto revisa entregas en el panel en ≥ 2 tareas.
- 0 incidentes de acceso indebido a datos.
- Disponibilidad ≥ 99 % en horario escolar según el monitor.
- Satisfacción de los profesores ≥ 4 sobre 5 en la encuesta de cierre.
- La proporción de fuentes en rojo de la tarea posterior es menor que la de la tarea previa (se informa aunque no mejore).

### Fase 2: lanzamiento de pago (4–6 semanas de preparación, luego mensual)

**Entregables:**

- M11, M13, M14, M15, M16, M17, M22, M23 y M24.
- M18, si el colegio quiere IA.
- Contrato y anexo de datos definitivos.
- Primer comprobante emitido.
- Guía para profesores y página de estado.

**Criterio de salida medible:**

- Contrato mensual vigente y primer pago recibido.
- Tiempo de respuesta de soporte dentro de lo comprometido durante el primer mes.
- Un ensayo de restauración de respaldo documentado.
- Exportación CSV de un colegio de prueba verificada de punta a punta.

**Total estimado hasta el primer cobro: 16–24 semanas** [estimación], según cuántas horas por semana dedique el equipo.

---

## 7. Modelo de negocio

### 7.1 Costos mensuales de operación

| Concepto | Costo | Fuente |
|---|---|---|
| Supabase Pro | US$ 25/mes | [supabase.com/pricing](https://supabase.com/pricing), 23/09/2026 |
| Netlify | US$ 0–20/mes (Free, Personal US$ 9, Pro US$ 20) | [netlify.com/pricing](https://www.netlify.com/pricing/), 23/09/2026 |
| Chrome Web Store | US$ 5 por única vez | Foros de soporte de Google (ver §5.4); [precio a verificar] |
| Dominio propio | — | [precio a verificar] |
| IA (opcional, Haiku 4.5) | ≈ US$ 0,075 por alumno/mes | Cálculo de §5.5 [estimación] |
| Contador / emisión de comprobantes | — | [precio a verificar] |
| Revisión legal inicial | — | [precio a verificar] |

**Costo fijo técnico:** unos **US$ 25–45 al mes**, más contador y dominio.

### 7.2 Opciones de precio

Son **propuestas del equipo** [estimación], no precios de mercado (ver §9, pregunta 13).

| Opción | Precio | Incluye | Para quién |
|---|---|---|---|
| **1. Tarifa plana por colegio** | US$ 150/mes hasta 400 alumnos [estimación] | Extensión, panel, reportes, soporte en 2 días hábiles, exportación; sin IA | Presupuesto fijo |
| **2. Por alumno activo** | US$ 0,50 por alumno/mes; con IA, US$ 0,70 [estimación] | Lo de la opción 1, IA opcional; se factura por alumno que usó el servicio | Empezar por algunos grados |
| **3. Gratis + institucional** | Semáforo local gratuito; plan institucional como 1 o 2 [estimación] | Se paga por panel, reportes y soporte | Crecer a otros colegios |

### 7.3 Punto de equilibrio

Fórmula: **alumnos necesarios = costo fijo mensual ÷ (precio por alumno − costo variable por alumno)**.

- **Opción 2 sin IA**, con un costo fijo de US$ 45 más un contador de C dólares: (45 + C) ÷ 0,50. Sin contador, el equilibrio llega con **90 alumnos**. Con C = 50 (valor hipotético, [precio a verificar]), con **190 alumnos** [estimación].
- **Opción 2 con IA:** (45 + C) ÷ (0,70 − 0,075). Sin contador, **72 alumnos** [estimación].
- **Opción 1:** cubre el costo fijo si 150 > 45 + C, es decir, mientras el contador cueste menos de US$ 105 al mes [estimación].

**Advertencia.** No incluye horas del equipo, impuestos (§8) ni comisiones de cobro: la infraestructura es barata; lo caro es la responsabilidad legal y el soporte.

---

## 8. Requisitos legales y administrativos en Perú para poder cobrar

Esta sección **explica** qué hay que resolver. **No es asesoría legal ni tributaria**: cada punto se debe confirmar con un profesional.

1. **Quién emite el comprobante si el equipo es menor de edad.**
   - Según la orientación de SUNAT reproducida por fuentes especializadas, un menor de entre 16 y 18 años puede inscribirse en el RUC en ciertos supuestos, y en los demás lo inscribe su padre, madre o tutor como representante legal ([perucontable.com](https://www.perucontable.com/tributaria/pueden-inscribirse-al-ruc-los-menores-de-edad/), [orientacion.sunat.gob.pe](https://orientacion.sunat.gob.pe/preguntas-frecuentes-ruc-0), consultados el 23/09/2026).
   - En la práctica hay tres caminos: (a) un adulto (padre, madre o docente) factura con su propio RUC; (b) se crea una persona jurídica; (c) el colegio canaliza el proyecto como iniciativa estudiantil sin cobro formal.
   - Cada camino tiene consecuencias distintas en impuestos y responsabilidad. **[verificar con abogado/contador]**
2. **Boleta o factura.** Un colegio con RUC normalmente pedirá **factura** para deducir el gasto. Qué comprobante corresponde, qué régimen tributario conviene y si aplica IGV dependen de quién emita y de cómo se constituya. **[verificar con abogado/contador]**
3. **Contrato con el colegio.** Debe cubrir:
   - objeto y alcance del servicio;
   - precio, forma de pago y duración;
   - nivel de servicio (horario, tiempos de respuesta);
   - límites de responsabilidad (el semáforo no certifica la veracidad, como ya dice `terminos.html:89-93`);
   - propiedad de los datos (el colegio);
   - devolución y borrado al terminar;
   - quién firma por VeriTech si el equipo es menor.

   **[verificar con abogado/contador]**
4. **VeriTech como encargado del tratamiento (Ley N.º 29733).** En este esquema, el colegio sería el **titular del banco de datos** de sus alumnos y VeriTech trataría esos datos por su encargo. Eso suele requerir un documento que fije la finalidad, las medidas de seguridad, la prohibición de usar los datos para otros fines, los subencargados (Supabase, Netlify y, si hay IA, Anthropic) y la devolución o supresión final. **[verificar con abogado/contador]**
5. **Datos de menores y consentimiento.**
   - Hoy la política pide permiso de los padres a los menores de 14 años (`privacidad.html:106`), pensando en una encuesta anónima.
   - Con cuentas institucionales los datos son identificables: el consentimiento (u otra base legal) debería gestionarlo el colegio con los padres, y hay que definir cómo se acredita. **[verificar con abogado/contador]**
6. **Registro ante la ANPD.**
   - Según fuentes secundarias, el nuevo reglamento de la Ley 29733 (D.S. N.º 016-2024-JUS, [El Peruano](https://busquedas.elperuano.pe/dispositivo/SE/2349653-1), vigente desde el 30/03/2025 según [sza.pe](https://sza.pe/en/aprueban-nuevo-reglamento-de-la-ley-n-29733-ley-de-proteccion-de-datos-personales/)) exige inscribir los bancos de datos personales en el Registro Nacional de Protección de Datos Personales, mediante un trámite gratuito.
   - Hay que confirmar **quién** inscribe (el colegio como titular, VeriTech o ambos) y si la transferencia internacional a EE. UU. (`privacidad.html:110`) necesita una comunicación o garantía específica.

   **[verificar con abogado/contador]**
7. **Propiedad del código.** Hay que definir si pertenece al equipo o al colegio (hoy `terminos.html:115` dice «al equipo»), y si aplica el libro de reclamaciones cuando se vende a una institución. **[verificar con abogado/contador]**

---

## 9. Riesgos y preguntas abiertas

### 9.1 Preguntas que bloquean empezar la Fase 0

1. **¿Quién es el adulto responsable** que firma, factura y responde legalmente? ¿Un padre o madre, un docente, el propio colegio?
2. **¿Qué plataforma usa el Colegio Aleph**: Microsoft 365 o Google Workspace? ¿Los alumnos tienen cuenta institucional desde qué grado?
3. **¿Cuántos alumnos y profesores** usarían el servicio, y en qué grados? (Sin este dato no hay precio.)
4. **¿Qué dispositivos usan los alumnos?** ¿Chromebooks administradas, laptops propias o salas de cómputo? ¿Qué navegador? Esto decide si la extensión se puede instalar de forma centralizada.
5. **¿Qué presupuesto tiene el colegio**, y quién lo aprueba (dirección o promotoría)?
6. **¿Acepta el colegio un piloto gratuito** con acuerdo de datos firmado, y con qué clase y profesor?
7. **¿Quién paga los costos de la Fase 0** (Supabase Pro desde el piloto, revisión legal) antes del primer ingreso?

### 9.2 Otras preguntas abiertas

8. ¿El colegio quiere IA? ¿Acepta que las fuentes y las afirmaciones de los alumnos se procesen en EE. UU.?
9. ¿Cuánto tiempo se conservan las entregas?
10. ¿El colegio ya inscribió ante la ANPD sus bancos de datos de alumnos?
11. ¿Qué tiempo de respuesta de soporte espera, y quién lo cubre en exámenes y vacaciones?
12. ¿Qué pasa con el servicio cuando el equipo egrese?
13. No tenemos datos de precios de herramientas comparables ni del tamaño del mercado en Perú; hay que investigarlo antes de ofrecer VeriTech a otros colegios.
14. ¿En qué moneda será el contrato: soles o dólares?

### 9.3 Riesgos principales

- **Fuga de datos de un menor por un error de permisos.** Mitigación: RLS con pruebas automáticas (M03) y registro de accesos.
- **Un profesor califica con el semáforo y este se equivoca.** Mitigación: calibración (M10) y el aviso «orientativo, no es nota».
- **El equipo no tiene tiempo en exámenes o se gradúa.** Mitigación: compromisos de soporte realistas, un adulto responsable y un plan de traspaso (M22).
- **El pitch promete más de lo que hay.** Mitigación: corregirlo antes de negociar (M23).

