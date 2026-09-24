"""Convierte los .md simples del proyecto (títulos, listas, tablas, negritas, enlaces) a PDF con Chrome.
Uso: python3 herramientas/md_a_pdf.py ARCHIVO.md [...]  → entregables/ARCHIVO.pdf"""
import html, pathlib, re, subprocess, sys
RAIZ = pathlib.Path(__file__).resolve().parent.parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
CSS = """
@page{size:A4;margin:14mm 16mm}
body{font-family:-apple-system,"Helvetica Neue",Arial,sans-serif;font-size:10pt;line-height:1.45;color:#0B1726}
.marca{display:flex;align-items:center;gap:8px;color:#0F4C9C;font-weight:800;font-size:13pt;border-bottom:2px solid #0F4C9C;padding-bottom:6px;margin-bottom:14px}
.marca svg{width:22px;height:22px}
h1{font-size:18pt;margin:0 0 6px;line-height:1.2}
h2{font-size:13pt;color:#0F4C9C;margin:18px 0 6px}
h3{font-size:11pt;margin:14px 0 4px}
p{margin:0 0 8px} ul,ol{margin:0 0 8px;padding-left:20px} li{margin-bottom:3px}
a{color:#0F4C9C;text-decoration:none}
code{font-family:Menlo,monospace;font-size:9pt;background:#EDF1F6;padding:1px 4px;border-radius:3px}
blockquote{margin:0 0 12px;padding:8px 12px;border-left:3px solid #0F4C9C;background:#EEF3FA;color:#3d4d5f;font-size:9.5pt}
hr{border:0;border-top:1px solid #d5dde6;margin:14px 0}
table{width:100%;border-collapse:collapse;margin:0 0 10px;font-size:9.3pt;page-break-inside:auto}
tr{page-break-inside:avoid}
th,td{text-align:left;vertical-align:top;padding:5px 6px;border-bottom:1px solid #d5dde6}
th{background:#EDF1F6;font-weight:600}
em{color:#556678}
.pend{background:#FFE9A8;color:#5B4300;padding:0 3px;border-radius:2px}
"""
LOGO = '<svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="29" stroke="currentColor" stroke-width="4"/><path d="M19 33 L28 42 L45 23" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>'

def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)", r"<em>\1</em>", t)
    t = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', t)
    t = re.sub(r"\[([^\]<>]{2,80})\]", r'<span class="pend">[\1]</span>', t)  # huecos por completar
    return t

def convertir(md):
    out, lineas, i = [], md.splitlines(), 0
    while i < len(lineas):
        l = lineas[i]
        if not l.strip(): i += 1; continue
        if l.startswith("|"):
            filas = []
            while i < len(lineas) and lineas[i].startswith("|"):
                filas.append([c.strip() for c in lineas[i].strip().strip("|").split("|")]); i += 1
            cab, cuerpo = filas[0], [f for f in filas[1:] if not re.match(r"^:?-+:?$", f[0])]
            out.append("<table><thead><tr>" + "".join(f"<th>{inline(c)}</th>" for c in cab) + "</tr></thead><tbody>" +
                       "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in f) + "</tr>" for f in cuerpo) + "</tbody></table>")
            continue
        m = re.match(r"^(#{1,3}) (.*)", l)
        if m: n = len(m.group(1)); out.append(f"<h{n}>{inline(m.group(2))}</h{n}>"); i += 1; continue
        if l.strip() == "---": out.append("<hr>"); i += 1; continue
        if l.startswith(">"):
            b = []
            while i < len(lineas) and lineas[i].startswith(">"): b.append(lineas[i].lstrip("> ")); i += 1
            out.append(f"<blockquote>{inline(' '.join(b))}</blockquote>"); continue
        if re.match(r"^\s*([-*]|\d+\.) ", l):
            tipo = "ol" if re.match(r"^\s*\d+\.", l) else "ul"; items = []
            while i < len(lineas) and re.match(r"^\s*([-*]|\d+\.) ", lineas[i]):
                items.append(re.sub(r"^\s*([-*]|\d+\.) ", "", lineas[i])); i += 1
            out.append(f"<{tipo}>" + "".join(f"<li>{inline(x)}</li>" for x in items) + f"</{tipo}>"); continue
        p = []
        while i < len(lineas) and lineas[i].strip() and not re.match(r"^(#|\||>|---|\s*([-*]|\d+\.) )", lineas[i]):
            p.append(lineas[i]); i += 1
        out.append("<p>" + "<br>".join(inline(x) for x in p) + "</p>")
    return "\n".join(out)

for nombre in sys.argv[1:]:
    src = RAIZ / nombre
    titulo = src.stem.replace("-", " ")
    doc = f'<!doctype html><html lang="es"><head><meta charset="utf-8"><title>{titulo}</title><style>{CSS}</style></head><body><div class="marca">{LOGO}VeriTech</div>{convertir(src.read_text(encoding="utf-8"))}</body></html>'
    tmp = RAIZ / "entregables" / (src.stem + ".html"); tmp.write_text(doc, encoding="utf-8")
    pdf = RAIZ / "entregables" / (src.stem + ".pdf")
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer", f"--print-to-pdf={pdf}", tmp.as_uri()],
                   check=True, capture_output=True)
    tmp.unlink(); print("PDF:", pdf)
