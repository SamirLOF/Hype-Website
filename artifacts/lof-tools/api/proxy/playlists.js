export default async function handler(req, res) {
  try {
    const r = await fetch("https://macxffplaylist.vercel.app/api/info");
    const data = await r.json();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(r.status).json(data);
  } catch (e) {
    res.status(502).json({ error: "Upstream fetch failed", detail: e?.message });
  }
}
