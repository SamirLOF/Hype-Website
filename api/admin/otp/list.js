const { Pool } = require("pg");

let pool;
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

const ADMIN_PASSWORD = "1125";

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "GET") { res.status(405).json({ error: "Method not allowed" }); return; }
  if (req.query?.adminPassword !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const db = getPool();
    const { rows } = await db.query(
      `SELECT id, code, expires_at AS "expiresAt", validity_label AS "validityLabel", created_at AS "createdAt"
       FROM otps WHERE expires_at > NOW() ORDER BY created_at DESC`
    );
    res.json({ otps: rows });
  } catch (e) {
    console.error("list otps error:", e);
    res.status(500).json({ error: "Database error: " + e.message });
  }
};
