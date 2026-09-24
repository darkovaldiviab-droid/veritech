# Resultados de la prueba: cómo se actualizan solos

`herramientas/actualizar_resultados.py` baja las respuestas de Netlify y deja un Excel listo en
**`~/Documents/VeriTech-resultados/`**:

- `VeriTech-resultados-ULTIMO.xlsx`: siempre la versión más reciente. **Abre este.**
- `VeriTech-resultados-AAAA-MM-DD_HHMM.xlsx`: una copia por cada vez que corrió.

Solo lee de Netlify: no borra ni cambia nada allá. El Excel **no** lleva la IP ni el navegador de
nadie. Esa carpeta está fuera del repositorio: las respuestas nunca entran a git.

## 1. Crear el token de Netlify (una sola vez)

1. Entra a <https://app.netlify.com> → tu foto (arriba a la derecha) → **User settings** →
   **Applications** → **Personal access tokens** → **New access token**.
2. Nombre: `VeriTech resultados`. Vencimiento: una fecha **después** del último día de la prueba.
   Pulsa **Generate token** y cópialo (Netlify no lo vuelve a mostrar).
3. Guárdalo en el llavero de la Mac. En la Terminal escribe esto y, cuando lo pida, pega el token
   (no se ve mientras escribes; es normal):

   ```bash
   security add-generic-password -a "$USER" -s veritech-netlify -w
   ```

4. Para que la Terminal lo tenga como variable de entorno `NETLIFY_AUTH_TOKEN`, agrega esta línea
   al final de `~/.bash_profile` (o de `~/.zshrc` si usas zsh):

   ```bash
   export NETLIFY_AUTH_TOKEN="$(security find-generic-password -s veritech-netlify -w 2>/dev/null)"
   ```

   Así el token queda en el llavero y no escrito en ningún archivo. No lo pegues en el código,
   en un correo ni en un chat.

Si el token vence o lo borras en Netlify, el script lo dice y avisa. Crea uno nuevo y repite el paso 3
(antes, borra el anterior con `security delete-generic-password -s veritech-netlify`).

## 2. Correrlo a mano

Desde la carpeta del proyecto:

```bash
python3 herramientas/actualizar_resultados.py
```

Muestra algo así y deja el Excel en la carpeta:

```
VeriTech · respuestas desde el 18/09/2026 · 04/10/2026 20:00
Calibración: 10 (+4)  ·  Docentes: 3 (+1)  ·  Estudiantes: 5 (+5)   (entre paréntesis: nuevas…)
✅ Semáforo coincide con docentes ≥ 70 %: 70 % en 10 fuentes
✅ Utilidad según docentes ≥ 4 de 5: 4 de 5
...
```

**Fechas:** arriba del script están `FECHA_INICIO` (primer día que cuenta: lo anterior, como las
pruebas del 17/09, no entra) y `FECHA_FIN` (último día en que corre la tarea diaria). Cámbialas ahí.
Para una sola vez, sin editar: `--desde 2026-09-17`.

## 3. Pausar la tarea diaria

La tarea corre el script todos los días a las 20:00 (solo entre `FECHA_INICIO` y `FECHA_FIN`) y
avisa con una notificación. Lo que muestra queda en `~/Documents/VeriTech-resultados/registro.txt`.

- **Pausar:**

  ```bash
  launchctl bootout gui/$(id -u)/com.veritech.resultados
  ```

- **Volver a activarla:**

  ```bash
  launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.veritech.resultados.plist
  ```

- **Quitarla del todo:** páusala y borra `~/Library/LaunchAgents/com.veritech.resultados.plist`.

Si la Mac está dormida a las 20:00, la tarea corre al despertar. Si está apagada, ese día se salta.
Pasado `FECHA_FIN`, la tarea sigue activa pero no hace nada.
