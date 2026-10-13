/* VeriTech · leer una fuente desde su dirección (copia para Vercel: la llama api/fuente.mjs).
   GET /api/fuente?url=https://…  →  el contenido de esa página web o PDF, sin tocar.
   La página del alumno lo analiza en el navegador (js/fuente-url.js): aquí solo se descarga.

   Por qué hace falta: el navegador no puede leer otra web directamente (CORS),
   y el alumno a veces solo tiene el párrafo que va a citar, sin autor ni fecha.

   Qué recibe el servidor: solo la dirección. Nunca el texto que pegó el alumno.

   Protecciones:
   - Solo http/https, puertos 80 y 443, sin usuario:clave en la URL.
   - Nada de direcciones internas (localhost, redes privadas, 169.254.x, …): se
     comprueba la IP a la que resuelve el nombre, también en cada redirección.
   - Máximo 3 redirecciones, 8 s y 2 MB (HTML) o 4 MB (PDF; Netlify corta en 6 MB).
   - El HTML se devuelve como text/plain con CSP «sandbox»: aunque alguien abra
     esta URL directamente, el navegador no lo ejecuta como página de VeriTech.
   - Solo responde a fetch() de la propia web (Sec-Fetch-Site / Sec-Fetch-Dest). */
import dns from "node:dns/promises";
import net from "node:net";

// En Vercel la ruta /api/fuente la da el nombre del archivo api/fuente.mjs

const MAX_HTML = 2 * 1024 * 1024, MAX_PDF = 4 * 1024 * 1024, TIEMPO = 8000, SALTOS = 3;
const AGENTE = "Mozilla/5.0 (compatible; VeriTech/1.0; proyecto escolar de evaluación de fuentes)";

class Rechazo extends Error {
  constructor(status, codigo, mensaje) { super(mensaje); this.status = status; this.codigo = codigo; }
}

function ipv4Privada(ip) {
  const [a, b] = ip.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
    (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19));
}
export function privada(ip) {
  if (net.isIPv4(ip)) return ipv4Privada(ip);
  const v6 = ip.toLowerCase();
  const mapeada = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapeada) return ipv4Privada(mapeada[1]);
  return v6 === "::" || v6 === "::1" || /^f[cd]/.test(v6) || /^fe[89ab]/.test(v6) ||
    v6.startsWith("64:ff9b:") || v6.startsWith("::ffff:") || v6.startsWith("ff");
}

export async function validar(texto) {
  let url;
  try { url = new URL(texto); } catch { throw new Rechazo(400, "url", "La dirección no es válida."); }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Rechazo(400, "url", "Solo se pueden leer direcciones http o https.");
  if (url.username || url.password) throw new Rechazo(400, "url", "La dirección no puede llevar usuario ni contraseña.");
  if (url.port && url.port !== "80" && url.port !== "443") throw new Rechazo(400, "bloqueada", "Esa dirección no es una página pública.");
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || /\.(localhost|local|internal|lan|home|corp)$/.test(host) || !host.includes(".") && !net.isIP(host))
    throw new Rechazo(400, "bloqueada", "Esa dirección no es una página pública.");
  let ips;
  try { ips = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true, verbatim: true }); }
  catch { throw new Rechazo(502, "dns", "No existe ninguna página con esa dirección."); }
  if (!ips.length || ips.some((a) => privada(a.address))) throw new Rechazo(400, "bloqueada", "Esa dirección no es una página pública.");
  return url;
}

function rechazo(status, codigo, mensaje) {
  return Response.json({ error: codigo, mensaje }, { status, headers: { "Cache-Control": "no-store" } });
}

async function leerConLimite(resp, max, ctrl) {
  const lector = resp.body.getReader(), partes = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    total += value.length;
    if (total > max) { ctrl.abort(); return null; }
    partes.push(value);
  }
  return Buffer.concat(partes);
}

export default async (req) => {
  if (req.method !== "GET") return rechazo(405, "metodo", "Solo se admite GET.");
  const sitio = req.headers.get("sec-fetch-site"), destino = req.headers.get("sec-fetch-dest");
  if ((sitio && sitio !== "same-origin") || (destino && destino !== "empty"))
    return rechazo(403, "origen", "Este servicio solo lo usa la herramienta de VeriTech.");
  const pedida = new URL(req.url).searchParams.get("url") || "";
  if (!pedida || pedida.length > 2000) return rechazo(400, "url", "Falta la dirección de la página.");

  const ctrl = new AbortController(), reloj = setTimeout(() => ctrl.abort(), TIEMPO);
  try {
    let url = await validar(pedida), resp;
    for (let salto = 0; ; salto++) {
      resp = await fetch(url, {
        redirect: "manual", signal: ctrl.signal,
        headers: { "User-Agent": AGENTE, "Accept": "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.5", "Accept-Language": "es,en;q=0.7" }
      });
      if (![301, 302, 303, 307, 308].includes(resp.status)) break;
      const destinoRedir = resp.headers.get("location");
      if (!destinoRedir) break;
      if (salto >= SALTOS) throw new Rechazo(502, "redirecciones", "La página redirige demasiadas veces.");
      url = await validar(new URL(destinoRedir, url).href);
    }
    if (!resp.ok) {
      const bloquea = resp.status === 401 || resp.status === 403 || resp.status === 429;
      throw new Rechazo(502, "http", bloquea
        ? "La página no deja que la lean programas (error " + resp.status + "). Copia y pega su texto a mano."
        : "La página respondió con un error (" + resp.status + ").");
    }
    const tipo = (resp.headers.get("content-type") || "").toLowerCase();
    const esPDF = tipo.includes("application/pdf") || (tipo.includes("octet-stream") && /\.pdf($|\?)/i.test(url.pathname));
    const esHTML = tipo.includes("text/html") || tipo.includes("application/xhtml");
    if (!esPDF && !esHTML) throw new Rechazo(415, "tipo", "Esa dirección no es una página web ni un PDF.");
    const max = esPDF ? MAX_PDF : MAX_HTML;
    if (Number(resp.headers.get("content-length")) > max || !resp.body) {
      throw new Rechazo(413, "grande", esPDF
        ? "El PDF es demasiado grande para leerlo desde su dirección. Descárgalo y súbelo con «Subir archivo»."
        : "La página es demasiado grande para leerla.");
    }
    const cuerpo = await leerConLimite(resp, max, ctrl);
    if (!cuerpo) throw new Rechazo(413, "grande", esPDF
      ? "El PDF es demasiado grande para leerlo desde su dirección. Descárgalo y súbelo con «Subir archivo»."
      : "La página es demasiado grande para leerla.");
    const charset = (tipo.match(/charset=([\w-]+)/) || [])[1] || "";
    return new Response(cuerpo, {
      status: 200,
      headers: {
        /* el HTML viaja como texto plano: nunca se interpreta como página */
        "Content-Type": esPDF ? "application/pdf" : "text/plain",
        "X-Fuente-Tipo": esPDF ? "pdf" : "html",
        "X-Fuente-Charset": charset,
        "X-Fuente-Url": encodeURI(url.href),
        "Content-Security-Policy": "sandbox; default-src 'none'",
        "Content-Disposition": "attachment",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store"
      }
    });
  } catch (e) {
    if (e instanceof Rechazo) return rechazo(e.status, e.codigo, e.message);
    if (e && e.name === "AbortError") return rechazo(504, "tiempo", "La página tardó demasiado en responder.");
    return rechazo(502, "red", "No se pudo abrir la página.");
  } finally {
    clearTimeout(reloj);
  }
};
