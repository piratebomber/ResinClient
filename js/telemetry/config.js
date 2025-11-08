// config.js — Telemetry configuration discovery.
// Side-effect free to keep tree-shakeable.

/** @typedef {{ endpoint:string, apiKey?:string, batchSize?:number, flushIntervalMs?:number, maxRetries?:number }} TelemetryConfig */

/**
 * Discover config from window.RESIN_TELEMETRY or query params.
 * Usage: import { discoverTelemetryConfig } and call it at runtime.
 * Returns null when disabled.
 */
export function discoverTelemetryConfig() {
  // Window override
  const winCfg = /** @type {any} */ (window).RESIN_TELEMETRY;
  if (winCfg && winCfg.endpoint) return normalize(winCfg);

  // Query params: ?telemetry=https://host/ingest&key=XYZ
  const sp = new URLSearchParams(location.search);
  const endpoint = sp.get('telemetry');
  if (!endpoint) return null;
  return normalize({ endpoint, apiKey: sp.get('key') || undefined });
}

/** @param {Partial<TelemetryConfig>} cfg */
function normalize(cfg) {
  return {
    endpoint: String(cfg.endpoint),
    apiKey: cfg.apiKey,
    batchSize: cfg.batchSize ?? 20,
    flushIntervalMs: cfg.flushIntervalMs ?? 5000,
    maxRetries: cfg.maxRetries ?? 5,
  };
}
