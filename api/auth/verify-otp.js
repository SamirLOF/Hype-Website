const { Pool } = require("pg");

let pool;
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
  const code = (body.code ?? "").toUpperCase();
  if (!code) { res.json({ valid: false }); return; }

  try {
    const db = getPool();
    const { rows } = await db.query(
      "SELECT expires_at FROM otps WHERE code = $1 AND expires_at > NOW() LIMIT 1",
      [code]
    );
    if (rows.length > 0) {
      res.json({ valid: true, expiresAt: rows[0].expires_at });
    } else {
      res.json({ valid: false });
    }
  } catch (e) {
    console.error("verify-otp error:", e);
    res.status(500).json({ valid: false, error: "Database error" });
  }
};
