#!/bin/bash
# Arma el paquete para Netlify: veritech-sitio + la vista previa del panel del profesor.
# Uso: bash herramientas/empaquetar.sh   → deja dist/ y veritech-prueba-colegio.zip en Hackaton/
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$RAIZ/dist"
rm -rf "$DIST" && mkdir -p "$DIST/vista-previa-panel"
cp -R "$RAIZ/veritech-sitio/." "$DIST/"
for f in index.html panel.css panel.js datos.js datos-memoria.js datos-supabase.js bibliografia.js; do
  cp "$RAIZ/veritech-app/panel/$f" "$DIST/vista-previa-panel/"
done
# En el sitio, la vista previa se rotula como tal y lleva el botón «Volver a la guía» (el original en veritech-app no lo necesita)
python3 - "$DIST/vista-previa-panel/index.html" <<'PY'
import sys, pathlib
p = pathlib.Path(sys.argv[1]); s = p.read_text(encoding="utf-8")
a = '<strong>Demostración con datos ficticios.</strong>'
assert a in s, "cambió el aviso del panel"
s = s.replace(a, '<strong>Vista previa con datos ficticios.</strong>', 1)
# el panel no tiene margen lateral en <body>: el botón necesita el suyo
s = s.replace('</head>', '<link rel="stylesheet" href="/css/volver.css">\n<style>.volver-guia-barra{padding:10px 16px 0}</style>\n</head>', 1).replace('</body>', '<script src="/js/volver.js"></script>\n</body>', 1)
p.write_text(s, encoding="utf-8")
PY
find "$DIST" -name '.DS_Store' -delete
rm -f "$RAIZ/veritech-prueba-colegio.zip"
(cd "$DIST" && zip -qr "$RAIZ/veritech-prueba-colegio.zip" .)
echo "Listo: $RAIZ/veritech-prueba-colegio.zip"
