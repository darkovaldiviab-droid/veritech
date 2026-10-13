/* VeriTech en Vercel · GET /api/fuente?url=…
   La lógica es la misma que la de Netlify (api/_fuente.mjs; el guion bajo evita
   que Vercel la publique como otra función). */
import leerFuente from "./_fuente.mjs";

export function GET(request) {
  return leerFuente(request);
}
