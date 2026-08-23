/**
 * M-CAM integration configuration — the one place the Dashboard's Vite build
 * knows the M-CAM backend's address. Everything downstream (auth bridge,
 * classroom REST calls, the realtime WS client, media token minting) reads
 * from here rather than hard-coding a host.
 *
 * Override in production via `.env` (`VITE_MCAM_API_BASE` / `VITE_MCAM_WS_BASE`)
 * — see `app/.env.example`. Defaults target the local dev backend started per
 * `mcam-backend/README` (or `M-CAM_PRODUCTION_INTEGRATION_STATUS.md`).
 */
export const MCAM_API_BASE: string =
  (import.meta.env.VITE_MCAM_API_BASE as string | undefined) ?? "http://localhost:8000";

export const MCAM_WS_BASE: string =
  (import.meta.env.VITE_MCAM_WS_BASE as string | undefined) ?? "ws://localhost:8000";

/** True when the dashboard build was told an M-CAM backend exists at all. */
export const MCAM_ENABLED: boolean =
  (import.meta.env.VITE_MCAM_ENABLED as string | undefined) !== "false";
