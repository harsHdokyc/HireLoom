import { createDecipheriv, hkdfSync } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import pg from "pg";
import { z } from "zod";

const require = createRequire(import.meta.url);
const Anthropic = require("@anthropic-ai/sdk").default;
const { zodOutputFormat } = require("@anthropic-ai/sdk/helpers/zod");
const { toJSONSchema } = z;

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

function decryptApiKey(stored, secret) {
  const [, iv, encrypted] = stored.split(".");
  const data = Buffer.from(encrypted, "base64url");
  const key = new Uint8Array(hkdfSync("sha256", secret, "", "Hireloom api-key-encryption v1", 32));
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
  decipher.setAAD(Buffer.from("Hireloom api key v1"));
  decipher.setAuthTag(data.subarray(data.length - 16));
  return Buffer.concat([decipher.update(data.subarray(0, data.length - 16)), decipher.final()]).toString("utf8");
}

const textField = z.string().nullable();
const dates = {
  startYear: z.number().int().nullable(),
  startMonth: z.number().int().nullable(),
  endYear: z.number().int().nullable(),
  endMonth: z.number().int().nullable(),
  current: z.boolean(),
};
const answerSchema = z.object({
  basics: z.object({
    name: textField,
    headline: textField,
    email: textField,
    phone: textField,
    dob: textField,
    website: textField,
    address: textField,
    city: textField,
    country: textField,
    linkedin: textField,
    summary: textField,
  }),
  skills: z.array(z.string()),
  languages: z.array(z.object({ name: z.string(), level: z.enum(["NATIVE", "C2", "C1", "B2", "B1", "A2", "A1"]).nullable() })),
  experience: z.array(
    z.object({ role: z.string(), company: z.string(), location: textField, ...dates, bullets: z.array(z.string()), skills: z.array(z.string()) }),
  ),
  projects: z.array(z.object({ name: z.string(), link: textField, ...dates, bullets: z.array(z.string()), skills: z.array(z.string()) })),
  education: z.array(z.object({ degree: z.string(), school: z.string(), ...dates, notes: textField })),
  publications: z.array(z.object({ citation: z.string(), link: textField })),
  references: z.array(z.object({ name: z.string(), relation: textField, company: textField, email: textField, phone: textField })),
});

const env = loadEnv();
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const {
  rows: [job],
} = await client.query(`SELECT input FROM "Job" WHERE id = $1`, ["cmwvoulb200016ypp1x1a07hm"]);
const { rows: settingsRows } = await client.query(`SELECT key, value FROM "Setting" WHERE key IN ('apiKeyEnc','model','baseUrl')`);
await client.end();

const settings = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));
const apiKey = decryptApiKey(settings.apiKeyEnc, env.HIRELOOM_SECRET);
const resume = job.input.resume;
const anthropic = new Anthropic({ apiKey, baseURL: settings.baseUrl, maxRetries: 0 });
const format = zodOutputFormat(answerSchema);
const system =
  "You turn the text of a candidate's resume into their profile, as JSON.\n\nReply with only a JSON object, no other text, that matches this JSON schema:\n" +
  JSON.stringify(toJSONSchema(answerSchema));

try {
  await anthropic.messages.create({
    model: settings.model,
    max_tokens: 16000,
    system: "Return JSON only.",
    messages: [{ role: "user", content: `<resume>\n${resume}\n</resume>` }],
    output_config: { format, effort: "low" },
  });
  console.log("UNEXPECTED_STRUCTURED_OK");
} catch (error) {
  console.log("STRUCTURED_FAIL", error.status, String(error.message).slice(0, 120));
}

const message = await anthropic.messages.create({
  model: settings.model,
  max_tokens: 16000,
  system,
  messages: [{ role: "user", content: `<resume>\n${resume}\n</resume>` }],
  output_config: { effort: "low" },
});
const text = message.content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("");
const parsed = answerSchema.safeParse(JSON.parse(text.match(/\{[\s\S]*\}/)[0]));
console.log("FALLBACK_OK", parsed.success, parsed.success ? parsed.data.basics.name : parsed.error?.issues?.[0]);
