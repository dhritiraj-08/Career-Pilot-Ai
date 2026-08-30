import "server-only";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
// 30s was too aggressive for this free-tier model on a larger prompt —
// observed a real analysis call abort at 30s in testing (not a model
// error, just slow), incorrectly triggering the fallback for what
// would otherwise have been a successful response.
const DEFAULT_TIMEOUT_MS = 45_000;

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface CallOpenRouterOptions {
  messages: OpenRouterMessage[];
  model?: string;
  temperature?: number;
  jsonMode?: boolean;
  timeoutMs?: number;
}

/**
 * Thin OpenRouter chat-completion client. Server-only (the `server-only`
 * import makes an accidental client-side import a build-time error) —
 * OPENROUTER_API_KEY must never reach the browser.
 *
 * Throws on any failure (missing key, network error, timeout, non-2xx,
 * empty content) rather than swallowing it — every caller is expected to
 * catch this and fall back to a deterministic alternative, per the
 * project's "every AI call has a deterministic fallback" rule.
 */
export async function callOpenRouter({
  messages,
  model,
  temperature = 0.2,
  jsonMode = false,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: CallOpenRouterOptions): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "CareerPilot AI",
      },
      body: JSON.stringify({
        model: model || process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
        messages,
        temperature,
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(`OpenRouter request failed (${response.status}): ${errorBody.slice(0, 300)}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("OpenRouter returned an empty response");
    }
    return content;
  } finally {
    clearTimeout(timeout);
  }
}
