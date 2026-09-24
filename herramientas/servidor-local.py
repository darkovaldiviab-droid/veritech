"""Servidor local para probar veritech-sitio como en Netlify.

- Aplica las cabeceras de veritech-sitio/_headers (incluida la CSP en bloqueo),
  así los errores de CSP aparecen en la consola igual que en producción.
- Acepta los POST de los formularios (Netlify Forms) y los guarda en
  herramientas/envios-locales.jsonl para revisar qué campos se enviarían.

Uso:  python3 herramientas/servidor-local.py [puerto] [carpeta]
      (carpeta por defecto: veritech-sitio; usa dist para probar el paquete final)
"""
import http.server
import json
import pathlib
import sys
import time
import urllib.parse

BASE = pathlib.Path(__file__).resolve().parent.parent
RAIZ = BASE / (sys.argv[2] if len(sys.argv) > 2 else "veritech-sitio")
ENVIOS = pathlib.Path(__file__).resolve().parent / "envios-locales.jsonl"


def leer_cabeceras():
    cab = []
    for linea in (RAIZ / "_headers").read_text(encoding="utf-8").splitlines():
        if linea.startswith("  ") and ":" in linea:
            nombre, valor = linea.strip().split(":", 1)
            cab.append((nombre.strip(), valor.strip()))
    return cab


class Manejador(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=str(RAIZ), **k)

    def end_headers(self):
        for nombre, valor in leer_cabeceras():
            self.send_header(nombre, valor)
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_POST(self):
        largo = int(self.headers.get("Content-Length", 0))
        datos = urllib.parse.parse_qs(self.rfile.read(largo).decode("utf-8"))
        fila = {"ruta": self.path, "hora": time.strftime("%H:%M:%S"),
                **{k: v[0] if len(v) == 1 else v for k, v in datos.items()}}
        with ENVIOS.open("a", encoding="utf-8") as f:
            f.write(json.dumps(fila, ensure_ascii=False) + "\n")
        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.end_headers()
        self.wfile.write(b"ok")


if __name__ == "__main__":
    puerto = int(sys.argv[1]) if len(sys.argv) > 1 else 8831
    print(f"VeriTech en http://localhost:{puerto} (cabeceras de _headers aplicadas)")
    http.server.ThreadingHTTPServer(("", puerto), Manejador).serve_forever()
