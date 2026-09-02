// ============================================================================
// Structured logging for the worker process (Phase 2 requirement #9).
// Plain JSON-lines to stdout/stderr -- this is a systemd-deployable process
// (Phase 23), so it relies on the platform's own log capture (journald /
// `systemctl status` / redirected file) rather than shipping a logging
// dependency. Every line is a single JSON object so it's grep/jq-friendly.
// ============================================================================

type Level = "debug" | "info" | "warn" | "error";

function line(level: Level, msg: string, extra?: Record<string, unknown>) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...extra,
  };
  const out = JSON.stringify(entry);
  if (level === "error" || level === "warn") process.stderr.write(out + "\n");
  else process.stdout.write(out + "\n");
}

export const log = {
  debug: (msg: string, extra?: Record<string, unknown>) => line("debug", msg, extra),
  info: (msg: string, extra?: Record<string, unknown>) => line("info", msg, extra),
  warn: (msg: string, extra?: Record<string, unknown>) => line("warn", msg, extra),
  error: (msg: string, extra?: Record<string, unknown>) => line("error", msg, extra),
};
