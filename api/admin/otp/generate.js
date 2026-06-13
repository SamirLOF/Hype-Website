const { Pool } = require("pg");
const { randomBytes } = require("crypto");

let pool;
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

const ADMIN_PASSWORD = "1125";

const VALIDITY_MAP = {
  "10min": { ms: 10 * 60 * 1000,            label: "10 Minutes" },
  "1hr":   { ms: 60 * 60 * 1000,            label: "1 Hour"     },
  "6hr":   { ms: 6 * 60 * 60 * 1000,        label: "6 Hours"    },
  "30d":   { ms: 30 * 24 * 60 * 60 * 1000,  label: "30 Days"    },
  "90d":   { ms: 90 * 24 * 60 * 60 * 1000,  label: "90 Days"    },
  "365d":  { ms: 365 * 24 * 60 * 60 * 1000, label: "365 Days"   },
};

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
  if (body.adminPassword !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const validity = body.validity ?? "1hr";
  const { ms, label } = VALIDITY_MAP[validity] ?? VALIDITY_MAP["1hr"];
  const code = generateCode();
  const id = randomBytes(8).toString("hex");
  const expiresAt = new Date(Date.now() + ms);

  try {
    const db = getPool();
    await db.query(
      "INSERT INTO otps (id, code, expires_at, created_at, validity_label) VALUES ($1, $2, $3, NOW(), $4)",
      [id, code, expiresAt, label]
    );
    res.json({ otp: { id, code, expiresAt, validityLabel: label } });
  } catch (e) {
    console.error("generate otp error:", e);
    res.status(500).json({ error: "Database error: " + e.message });
  }
};
