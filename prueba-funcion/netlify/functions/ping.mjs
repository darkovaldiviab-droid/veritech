import { getStore } from "@netlify/blobs";
export default async (req) => {
  try {
    const store = getStore("prueba");
    await store.setJSON("t", { ok: Date.now() });
    const leido = await store.get("t", { type: "json" });
    return Response.json({ funciones: true, blobs: true, leido });
  } catch (e) {
    return Response.json({ funciones: true, blobs: false, error: String(e) });
  }
};
