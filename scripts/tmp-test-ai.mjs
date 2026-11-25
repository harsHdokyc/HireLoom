import { createDecipheriv, hkdfSync } from "node:crypto";
import { readFileSync } from "node:fs";
import pg from "pg";

function loadEnv() {
  const text = readFileSync("/app/.env", "utf8");
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function deriveKey(secret) {
  return new Uint8Array(hkdfSync("sha256", secret, "", "Hireloom api-key-encryption v1", 32));
}

function decryptSecret(stored, secret) {
  const [version, iv, encrypted, ...rest] = stored.split(".");
  if (version !== "v1" || !iv || !encrypted || rest.length > 0) throw new Error("unreadable format");
  const data = Buffer.from(encrypted, "base64url");
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(secret), Buffer.from(iv, "base64url"));
  decipher.setAAD(Buffer.from("Hireloom api key v1"));
  decipher.setAuthTag(data.subarray(data.length - 16));
  return Buffer.concat([decipher.update(data.subarray(0, data.length - 16)), decipher.final()]).toString("utf8");
}

const env = loadEnv();
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const { rows } = await client.query(`SELECT key, value FROM "Setting" WHERE key IN ('provider','model','baseUrl','apiKeyEnc')`);
await client.end();
const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
const apiKey = decryptSecret(settings.apiKeyEnc, env.HIRELOOM_SECRET);
console.log(
  JSON.stringify(
    {
      provider: settings.provider,
      model: settings.model,
      baseUrl: settings.baseUrl,
      keyPrefix: apiKey.slice(0, 12),
      keyLen: apiKey.length,
    },
    null,
    2,
  ),
);

const modelsRes = await fetch(`${settings.baseUrl.replace(/\/$/, "")}/v1/models`, {
  headers: {
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  },
});
console.log("MODELS_STATUS", modelsRes.status);
console.log((await modelsRes.text()).slice(0, 500));

const res = await fetch(`${settings.baseUrl.replace(/\/$/, "")}/v1/messages`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  },
  body: JSON.stringify({
    model: settings.model,
    max_tokens: 32,
    messages: [{ role: "user", content: "Reply with the single word: ok" }],
  }),
});
const body = await res.text();
console.log("MESSAGES_STATUS", res.status);
console.log(body.slice(0, 800));
