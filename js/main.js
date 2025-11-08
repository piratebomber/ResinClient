// main.js — Resin entry point.
// Production notes:
// - Module graph kept small and explicit. All side-effects are minimized and documented.
// - Early anti-tamper install to catch right-click and most shortcuts before UI mounts.
// - Defers heavy init until DOMContentLoaded to avoid blocking paint.

import { installAntiTamper } from './platform/security/antiTamper.js';
import { bootstrap } from './game/bootstrap.js';
import { discoverTelemetryConfig } from './telemetry/config.js';

// Install right-click/shortcut guards immediately
installAntiTamper();

// Optional telemetry wiring (tree-shakeable): only import when configured
const _telemetryCfg = discoverTelemetryConfig();
if (_telemetryCfg) {
  import('./telemetry/telemetry.js').then(({ setupTelemetry }) => {
    const client = setupTelemetry(_telemetryCfg);
    // Example: emit boot event
    client.event('boot');
    // Expose for logger integration
    window.__resinTelemetry = client;
  }).catch(() => {/* ignore */});
}

// Bootstrap the game once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
