/**
 * Shared helpers for the mock service layer.
 *
 * `withDelay` simulates network latency so loading states are real and
 * visible during development, exactly like a real HTTP adapter would incur.
 * When a `services/http/*` implementation is introduced later, callers do
 * not change — only the module wired up in `services/index.ts` does.
 */
export function withDelay<T>(value: T, ms = 380): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
