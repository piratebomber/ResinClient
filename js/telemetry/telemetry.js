// telemetry.js — Minimal, production-grade telemetry client with batching and backoff.
// Side-effect free; instantiate when needed to keep tree-shakeable.

/** @typedef {{ endpoint:string, apiKey?:string, batchSize?:number, flushIntervalMs?:number, maxRetries?:number }} TelemetryConfig */

export class TelemetryClient {
  /** @param {TelemetryConfig} cfg */
  constructor(cfg) {
    this.cfg = cfg;
    this.buf = [];
    this.timer = null;
    this.retry = 0;
    this.online = true;

    this._flush = this._flush.bind(this);
    this._schedule();
    window.addEventListener('online', () => { this.online = true; });
    window.addEventListener('offline', () => { this.online = false; });
  }

  destroy() { if (this.timer) clearTimeout(this.timer); this.timer = null; }

  /** @param {string} name @param {Record<string,any>} [props] */
  event(name, props={}) { this._push({ t: 'e', n: name, p: props, ts: Date.now() }); }
  /** @param {string} name @param {number} value @param {Record<string,any>} [props] */
  metric(name, value, props={}) { this._push({ t: 'm', n: name, v: value, p: props, ts: Date.now() }); }

  _push(item) {
    this.buf.push(item);
    if (this.buf.length >= (this.cfg.batchSize || 20)) this._flush();
  }

  _schedule() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(this._flush, this.cfg.flushIntervalMs || 5000);
  }

  async _flush() {
    if (!this.online || this.buf.length === 0) { this._schedule(); return; }
    const batch = this.buf.splice(0, this.cfg.batchSize || 20);
    try {
      const payload = JSON.stringify({ client: 'resin', ver: '0.2.0', items: batch });
      const headers = { 'content-type': 'application/json' }; if (this.cfg.apiKey) headers['x-api-key'] = this.cfg.apiKey;
      let ok = false;
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        ok = navigator.sendBeacon(this.cfg.endpoint, blob);
      }
      if (!ok) {
        const res = await fetch(this.cfg.endpoint, { method: 'POST', headers, body: payload, keepalive: true });
        ok = res.ok;
      }
      if (!ok) throw new Error('send failed');
      this.retry = 0; // reset backoff
    } catch {
      // Requeue
      this.buf.unshift(...batch);
      this.retry = Math.min((this.retry || 0) + 1, this.cfg.maxRetries || 5);
      const backoff = Math.min(60000, (this.cfg.flushIntervalMs || 5000) * Math.pow(2, this.retry));
      if (this.timer) clearTimeout(this.timer); this.timer = setTimeout(this._flush, backoff);
      return;
    }
    this._schedule();
  }
}

/**
 * Optional convenience setup to wire global telemetry, returning the client.
 * Callers can not import this to avoid side effects (tree-shakeable).
 */
export function setupTelemetry(cfg) {
  const client = new TelemetryClient(cfg);
  // Minimal auto-events
  client.event('session_start', { ua: navigator.userAgent });
  window.addEventListener('beforeunload', () => client.event('session_end'));
  return client;
}
