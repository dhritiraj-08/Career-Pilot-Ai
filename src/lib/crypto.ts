import "server-only";
import crypto from "crypto";

// AES-256-GCM: authenticated encryption (tamper-evident, not just
// obfuscated) for Gmail tokens at rest in oauth_tokens — RLS is the
// second layer here, not the only one, per the Email Agent's explicit
// security requirement, since these are live credentials to a real
// inbox rather than ordinary app data.
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommended for GCM

function getKey(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("TOKEN_ENCRYPTION_KEY is not set — generate one with: openssl rand -base64 32");
  }
  // Accept either base64 or hex — whichever decodes to exactly 32
  // bytes wins, so a key generated either way just works.
  for (const encoding of ["base64", "hex"] as const) {
    const buf = Buffer.from(raw, encoding);
    if (buf.length === 32) return buf;
  }
  throw new Error("TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes (base64 or hex) — generate one with: openssl rand -base64 32");
}

/** Encrypts a string, returning `iv:authTag:ciphertext` (all base64) as
 * one string — self-contained, so decrypt() needs nothing but this. */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(":");
}

export function decrypt(payload: string): string {
  const key = getKey();
  const [ivB64, authTagB64, ciphertextB64] = payload.split(":");
  if (!ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error("Malformed encrypted payload");
  }
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(ciphertextB64, "base64")), decipher.final()]);
  return plaintext.toString("utf8");
}
