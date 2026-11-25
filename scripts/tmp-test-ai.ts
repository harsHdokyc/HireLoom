import { loadAiConfig } from "../src/lib/ai/config";
import { createProvider } from "../src/lib/ai";
import { AiError } from "../src/lib/ai/errors";

async function main() {
  const config = await loadAiConfig();
  console.log(
    JSON.stringify(
      {
        provider: config.provider,
        model: config.model,
        baseUrl: config.baseUrl,
        hasKey: Boolean(config.apiKey),
        keyLen: config.apiKey?.length ?? 0,
        apiKeyProblem: config.apiKeyProblem,
      },
      null,
      2,
    ),
  );

  try {
    const provider = createProvider({ ...config, timeoutMs: 60_000 });
    const result = await provider.test();
    console.log("TEST_OK", result);
  } catch (e) {
    if (e instanceof AiError) console.log("TEST_FAIL", e.kind, e.message, e.detail);
    else console.log("TEST_FAIL_OTHER", e);
  }
}

void main();
