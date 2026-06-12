export default async function handler(req, res) {
  const region = req.query?.region || "SG";
  try {
    const r = await fetch(`https://api-links2.vercel.app/api?server=${region}`);
    const data = await r.json();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(r.status).json(data);
  } catch (e) {
    res.status(502).json({ error: "Upstream fetch failed", detail: e?.message });
  }
}
