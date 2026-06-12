export default async function handler(req, res) {
  const region = req.query?.region || "SG";
  try {
    const r = await fetch(`https://x-ff.vercel.app/event?region=${region}&key=SHAHG`);
    const data = await r.json();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(r.status).json(data);
  } catch (e) {
    res.status(502).json({ error: "Upstream fetch failed", detail: e?.message });
  }
}
