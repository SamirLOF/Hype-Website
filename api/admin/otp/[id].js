const { Pool } = require("pg");

let pool;
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

const ADMIN_PASSWORD = "1125";

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "DELETE") { res.status(405).json({ error: "Method not allowed" }); return; }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
  if (body.adminPassword !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = req.query?.id;
  if (!id) { res.status(400).json({ error: "Missing id" }); return; }

  try {
    const db = getPool();
    await db.query("DELETE FROM otps WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (e) {
    console.error("delete otp error:", e);
    res.status(500).json({ error: "Database error: " + e.message });
  }
};
