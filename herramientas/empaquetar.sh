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
find "$DIST" -name '.DS_Store' -delete
rm -f "$RAIZ/veritech-prueba-colegio.zip"
(cd "$DIST" && zip -qr "$RAIZ/veritech-prueba-colegio.zip" .)
echo "Listo: $RAIZ/veritech-prueba-colegio.zip"
