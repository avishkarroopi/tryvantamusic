// Server-only Google OAuth 2.0 helpers.
// Never import from client-reachable code paths.
import { GOOGLE_SCOPES } from "./scopes";

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";

export function callbackUrl(origin: string): string {
  return `${origin.replace(/\/+$/, "")}/api/public/google/oauth/callback`;
}

export function buildAuthorizeUrl(opts: { origin: string; state: string }): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("Missing GOOGLE_CLIENT_ID");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl(opts.origin),
    response_type: "code",
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    scope: GOOGLE_SCOPES.join(" "),
    state: opts.state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

export type TokenExchangeResult = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  id_token?: string;
  token_type: string;
};

export async function exchangeCodeForTokens(opts: {
  code: string;
  origin: string;
}): Promise<TokenExchangeResult> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET");

  const body = new URLSearchParams({
    code: opts.code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: callbackUrl(opts.origin),
    grant_type: "authorization_code",
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Google token exchange failed [${res.status}]: ${text.slice(0, 300)}`);
  return JSON.parse(text) as TokenExchangeResult;
}

export async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number; scope?: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET");
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Google token refresh failed [${res.status}]: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  await fetch(REVOKE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token: refreshToken }),
  }).catch(() => {
    /* revocation is best-effort */
  });
}

export async function fetchUserinfo(accessToken: string): Promise<{ email: string; sub: string; name?: string; picture?: string }> {
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`userinfo failed [${res.status}]: ${text.slice(0, 200)}`);
  return JSON.parse(text);
}
