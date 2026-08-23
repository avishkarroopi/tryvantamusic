/**
 * Teacher identity -> M-CAM auth bridge.
 *
 * The Dashboard's own "teacher" identity (see `@/domain/types#Teacher`) has no
 * real authentication system yet (see `CLONE_STATUS.md` — auth is mocked).
 * M-CAM, on the other hand, has a real one (`/v1/auth/register|login`,
 * bcrypt + JWT, backed by Postgres). This module is the seam between them: it
 * derives a stable M-CAM account for the current dashboard teacher and
 * returns a real M-CAM access token, so every M-CAM API/WS call the teacher
 * makes is properly authenticated end-to-end.
 *
 * PRODUCTION NOTE: this is a *bridge*, not real SSO. It signs the teacher into
 * a dedicated M-CAM account using a fixed, non-secret bridge password local to
 * this integration — safe only because the derived account is meaningless
 * outside M-CAM (no billing/PII beyond name+a synthetic email) and this repo
 * has no real authentication of its own to delegate from yet. The correct
 * production replacement, once the Dashboard has real auth: mint the M-CAM
 * token server-side (Dashboard backend -> M-CAM backend, service-to-service,
 * e.g. a trusted-issuer/OIDC exchange) instead of the browser registering a
 * shadow account. That seam is exactly this module — swap its body, keep
 * `useMcamAuth`'s return shape, and no caller changes.
 */
import { useEffect, useState } from "react";
import { MCAM_API_BASE } from "./config";

export interface TeacherIdentity {
  id: string;
  name: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface CachedAuth extends TokenResponse {
  cachedAt: number;
}

const TOKEN_TTL_SAFETY_MARGIN_MS = 60_000; // re-auth a minute before the 15-min access token actually expires
const ACCESS_TOKEN_LIFETIME_MS = 15 * 60 * 1000;
const BRIDGE_PASSWORD = "muziclly-dashboard-bridge-2026"; // see PRODUCTION NOTE above

function bridgeEmail(teacherId: string): string {
  // Deterministic per-teacher M-CAM account. `.local` is rejected by strict
  // email validation server-side, so this uses a real-looking subdomain.
  return `${teacherId}@mcam-bridge.muziclly.app`;
}

function cacheKey(teacherId: string): string {
  return `mcam.auth.${teacherId}`;
}

function readCache(teacherId: string): CachedAuth | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(teacherId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedAuth;
    if (Date.now() - parsed.cachedAt > ACCESS_TOKEN_LIFETIME_MS - TOKEN_TTL_SAFETY_MARGIN_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(teacherId: string, tokens: TokenResponse): void {
  const entry: CachedAuth = { ...tokens, cachedAt: Date.now() };
  sessionStorage.setItem(cacheKey(teacherId), JSON.stringify(entry));
}

async function loginOrRegister(teacher: TeacherIdentity): Promise<TokenResponse> {
  const email = bridgeEmail(teacher.id);
  const loginRes = await fetch(`${MCAM_API_BASE}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: BRIDGE_PASSWORD }),
  });
  if (loginRes.ok) return loginRes.json();

  // First time this teacher has opened Live Classroom — provision the bridge account.
  const registerRes = await fetch(`${MCAM_API_BASE}/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: BRIDGE_PASSWORD, display_name: teacher.name, is_minor: false }),
  });
  if (!registerRes.ok) {
    const body = await registerRes.json().catch(() => ({}));
    throw new Error(body?.title ?? `M-CAM auth bridge failed (${registerRes.status})`);
  }
  return registerRes.json();
}

export interface McamAuthState {
  token: string | undefined;
  loading: boolean;
  error: Error | undefined;
}

// Dedupe concurrent auth attempts for the same teacher (React StrictMode's
// double-invoked effects, two components mounting the hook at once, a fast
// remount) into a single in-flight network call rather than racing two
// register/login requests — belt-and-braces alongside the backend's own
// unique-constraint handling (see mcam-backend/app/features/auth/repository.py).
const inFlight = new Map<string, Promise<TokenResponse>>();

function loginOrRegisterDeduped(teacher: TeacherIdentity): Promise<TokenResponse> {
  const existing = inFlight.get(teacher.id);
  if (existing) return existing;
  const promise = loginOrRegister(teacher).finally(() => inFlight.delete(teacher.id));
  inFlight.set(teacher.id, promise);
  return promise;
}

/** Resolves (and caches per tab session) a real M-CAM access token for the given dashboard teacher. */
export function useMcamAuth(teacher: TeacherIdentity): McamAuthState {
  const [token, setToken] = useState<string | undefined>(() => readCache(teacher.id)?.access_token);
  const [loading, setLoading] = useState(!token);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    const cached = readCache(teacher.id);
    if (cached) {
      setToken(cached.access_token);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(undefined);
    loginOrRegisterDeduped(teacher)
      .then((tokens) => {
        if (cancelled) return;
        writeCache(teacher.id, tokens);
        setToken(tokens.access_token);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [teacher.id, teacher.name]);

  return { token, loading, error };
}
