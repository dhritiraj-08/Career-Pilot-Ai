import "server-only";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

// Minimum scopes for what this agent actually does — read the inbox,
// send mail, and modify labels (archive) — no broader Gmail access
// requested. Plain REST via fetch throughout this file rather than the
// googleapis SDK, consistent with how every other external API in this
// app is called (lib/ai/openrouter.ts, lib/job-sources/*) — no new
// heavy dependency for what's a handful of well-documented endpoints.
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/userinfo.email",
];

function getClientCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Gmail isn't configured — set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in .env.local"
    );
  }
  return { clientId, clientSecret, redirectUri };
}

export function buildAuthUrl(state: string): string {
  const { clientId, redirectUri } = getClientCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline", // required to get a refresh_token back
    prompt: "consent", // forces a refresh_token even on a repeat connect
    scope: SCOPES.join(" "),
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
}

async function postForm(url: string, body: Record<string, string>): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  if (!res.ok) {
    // Error bodies here are Google's own OAuth error JSON (e.g.
    // {"error":"invalid_grant"}) — never the user's email content, so
    // safe to include in a thrown error/log.
    const text = await res.text().catch(() => "");
    throw new Error(`Google OAuth request failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return res.json();
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const { clientId, clientSecret, redirectUri } = getClientCredentials();
  const data = await postForm(GOOGLE_TOKEN_URL, {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  return {
    accessToken: data.access_token as string,
    refreshToken: (data.refresh_token as string) ?? null,
    expiresIn: data.expires_in as number,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
  const { clientId, clientSecret } = getClientCredentials();
  const data = await postForm(GOOGLE_TOKEN_URL, {
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });
  return { accessToken: data.access_token as string, expiresIn: data.expires_in as number };
}

export async function fetchConnectedEmail(accessToken: string): Promise<string> {
  const res = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Couldn't fetch Google account info (${res.status})`);
  const data = await res.json();
  return data.email as string;
}

/** Best-effort — disconnect still removes our own stored copy of the
 * tokens even if this fails or Google's endpoint is unreachable. */
export async function revokeGoogleToken(token: string): Promise<void> {
  try {
    await fetch(GOOGLE_REVOKE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }),
    });
  } catch {
    // ignore — see comment above
  }
}

// ---------------------------------------------------------------------
// Reading messages
// ---------------------------------------------------------------------
interface GmailHeader {
  name: string;
  value: string;
}
interface GmailMessagePayload {
  headers?: GmailHeader[];
  body?: { data?: string };
  parts?: GmailMessagePayload[];
  mimeType?: string;
}
interface GmailMessage {
  id: string;
  threadId: string;
  snippet?: string;
  payload?: GmailMessagePayload;
  internalDate?: string;
}

function decodeBase64Url(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function extractPlainText(payload?: GmailMessagePayload): string {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.parts) {
    const plainPart = payload.parts.find((p) => p.mimeType === "text/plain" && p.body?.data);
    if (plainPart?.body?.data) return decodeBase64Url(plainPart.body.data);
    for (const part of payload.parts) {
      const nested = extractPlainText(part);
      if (nested) return nested;
    }
  }
  if (payload.mimeType === "text/html" && payload.body?.data) {
    return decodeBase64Url(payload.body.data)
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  return "";
}

function getHeader(headers: GmailHeader[] | undefined, name: string): string {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function parseSenderHeader(from: string): { name: string; email: string } {
  const match = from.match(/^(.*?)\s*<(.+)>$/);
  if (match) {
    const name = match[1].replace(/"/g, "").trim();
    return { name: name || match[2], email: match[2].trim() };
  }
  return { name: from, email: from };
}

async function gmailGet(accessToken: string, path: string): Promise<GmailMessage> {
  const res = await fetch(`${GMAIL_API_BASE}${path}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    // Gmail's error responses are structured API errors (status/reason
    // codes), not message content — safe to surface in a thrown error.
    const text = await res.text().catch(() => "");
    throw new Error(`Gmail API request failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return res.json();
}

export async function listRecentMessageIds(accessToken: string, maxResults = 100): Promise<string[]> {
  const params = new URLSearchParams({ maxResults: String(maxResults), q: "in:inbox" });
  const res = await fetch(`${GMAIL_API_BASE}/messages?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gmail list failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  return ((data.messages ?? []) as { id: string }[]).map((m) => m.id);
}

export interface GmailMessageMeta {
  id: string;
  threadId: string;
  sender: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  receivedAt: string;
}

/** Cheap first pass — headers + snippet only, no full body decode.
 * Used to run the keyword filter before spending a full fetch (or an
 * LLM call) on messages that aren't job-related at all. */
export async function getMessageMetadata(accessToken: string, id: string): Promise<GmailMessageMeta> {
  const params = new URLSearchParams({ format: "metadata" });
  ["From", "Subject", "Date"].forEach((h) => params.append("metadataHeaders", h));
  const data = await gmailGet(accessToken, `/messages/${id}?${params}`);
  const { name, email } = parseSenderHeader(getHeader(data.payload?.headers, "From"));
  return {
    id: data.id,
    threadId: data.threadId,
    sender: name,
    senderEmail: email,
    subject: getHeader(data.payload?.headers, "Subject"),
    snippet: data.snippet ?? "",
    receivedAt: data.internalDate ? new Date(Number(data.internalDate)).toISOString() : new Date().toISOString(),
  };
}

export interface GmailMessageFull extends GmailMessageMeta {
  body: string;
}

const MAX_STORED_BODY_CHARS = 20_000;

/** Full fetch — only called for messages that already passed the
 * keyword filter, to keep sync's Gmail API usage proportional to how
 * much is actually job-related rather than every message in the inbox. */
export async function getMessageFull(accessToken: string, id: string): Promise<GmailMessageFull> {
  const data = await gmailGet(accessToken, `/messages/${id}?format=full`);
  const { name, email } = parseSenderHeader(getHeader(data.payload?.headers, "From"));
  return {
    id: data.id,
    threadId: data.threadId,
    sender: name,
    senderEmail: email,
    subject: getHeader(data.payload?.headers, "Subject"),
    snippet: data.snippet ?? "",
    body: extractPlainText(data.payload).slice(0, MAX_STORED_BODY_CHARS),
    receivedAt: data.internalDate ? new Date(Number(data.internalDate)).toISOString() : new Date().toISOString(),
  };
}

export async function archiveMessage(accessToken: string, id: string): Promise<void> {
  const res = await fetch(`${GMAIL_API_BASE}/messages/${id}/modify`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ removeLabelIds: ["INBOX"] }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gmail archive failed (${res.status}): ${text.slice(0, 300)}`);
  }
}

// ---------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------
function encodeHeaderValue(value: string): string {
  // eslint-disable-next-line no-control-regex
  if (/^[\x00-\x7F]*$/.test(value)) return value; // pure ASCII — no encoding needed
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function buildRawMessage({ to, subject, body }: { to: string; subject: string; body: string }): string {
  const message = [
    `To: ${to}`,
    `Subject: ${encodeHeaderValue(subject)}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset="UTF-8"`,
    "",
    body,
  ].join("\r\n");
  return Buffer.from(message, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendGmailMessage(
  accessToken: string,
  params: { to: string; subject: string; body: string; threadId?: string }
): Promise<{ id: string; threadId: string }> {
  const raw = buildRawMessage(params);
  const res = await fetch(`${GMAIL_API_BASE}/messages/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw, ...(params.threadId ? { threadId: params.threadId } : {}) }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gmail send failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  return { id: data.id, threadId: data.threadId };
}
