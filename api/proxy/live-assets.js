const REGION_MAP = {
  SG: "sg", BD: "bd", IND: "ind", CIS: "cis", EU: "eu",
  NA: "na", PK: "pk", ID: "id", TH: "th", MEA: "mea",
  BR: "br", LATAM: "sac", VN: "vn", TW: "tw",
};

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const data = await r.json();
      if (data && data.error === "token_generation_failed") {
        if (i < retries - 1) { await new Promise(res => setTimeout(res, 600 * (i + 1))); continue; }
        throw new Error("Upstream token error — please retry");
      }
      return { status: r.status, data };
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(res => setTimeout(res, 600 * (i + 1)));
    }
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const region = req.query?.region || "SG";
  const server = REGION_MAP[region] || region.toLowerCase();
  try {
    const { status, data } = await fetchWithRetry(
      `https://api-links1.vercel.app/api?server=${server}`
    );
    res.status(status).json(data);
  } catch (e) {
    res.status(502).json({ error: "Upstream fetch failed", detail: e?.message });
  }
};
