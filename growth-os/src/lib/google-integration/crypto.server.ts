// Server-only AES-256-GCM helpers for encrypting Google refresh tokens at rest.
// Never import from client-reachable code paths.
import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "crypto";

function keyBytes(): Buffer {
  const raw = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error("Missing GOOGLE_TOKEN_ENCRYPTION_KEY");
  // Derive a stable 32-byte key from whatever length the secret is.
  return createHmac("sha256", "google-integration-v1").update(raw).digest();
}

export function encryptToken(plaintext: string): {
  ciphertext: string;
  iv: string;
  tag: string;
} {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyBytes(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: enc.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decryptToken(parts: { ciphertext: string; iv: string; tag: string }): string {
  const decipher = createDecipheriv("aes-256-gcm", keyBytes(), Buffer.from(parts.iv, "base64"));
  decipher.setAuthTag(Buffer.from(parts.tag, "base64"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(parts.ciphertext, "base64")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}

// HMAC-signed short-lived state token for the OAuth flow.
// Payload = { u: userId, o: origin, e: expiresAtEpochSec }
export function signState(payload: { u: string; o: string; e: number }): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", keyBytes())
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

export function verifyState(state: string): { u: string; o: string; e: number } | null {
  const [body, sig] = state.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", keyBytes()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      u: string;
      o: string;
      e: number;
    };
    if (!payload.u || !payload.o || !payload.e) return null;
    if (Date.now() / 1000 > payload.e) return null;
    return payload;
  } catch {
    return null;
  }
}
