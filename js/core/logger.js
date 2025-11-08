// logger.js — Small, production-minded logger with levels and tagging.
// Usage:
//   import { logger } from '../core/logger.js';
//   logger.info('Booting Resin', { version: '0.1.0' });
//
// Goals:
// - Stable API for internal logging.
// - Structured logs (object payloads) for easy inspection.
// - Cheap checks to eliminate debug noise in production builds.
//
// Note: In a truly production setup, this would be tree-shaken and/or wired to
// a remote telemetry sink with batching and backpressure controls.

const LEVELS = /** @type {const} */ ({ DEBUG: 10, INFO: 20, WARN: 30, ERROR: 40 });
const LEVEL_NAMES = { 10: 'DEBUG', 20: 'INFO', 30: 'WARN', 40: 'ERROR' };

// Default log level can be overridden via ?log=debug|info|warn|error
const params = new URLSearchParams(location.search);
const levelParam = (params.get('log') || '').toUpperCase();
const DEFAULT_LEVEL = LEVELS[levelParam] || LEVELS.INFO;

class Logger {
  /** @param {number} minLevel */
  constructor(minLevel = DEFAULT_LEVEL) {
    this.minLevel = minLevel;
    this.telemetry = null;
    // Lazy bind telemetry if available
    if (typeof window !== 'undefined' && window.__resinTelemetry) this.telemetry = window.__resinTelemetry;
  }

  /** @param {keyof typeof LEVELS} name */
  setLevel(name) { this.minLevel = LEVELS[name] ?? this.minLevel; }

  /** @param {number} level @param {string} msg @param {any} [obj] */
  log(level, msg, obj) {
    if (level < this.minLevel) return;
    const ts = new Date().toISOString();
    const label = LEVEL_NAMES[level] || String(level);
    if (obj !== undefined) {
      // eslint-disable-next-line no-console
      console.log(`[${ts}] [${label}] ${msg}`, obj);
    } else {
      // eslint-disable-next-line no-console
      console.log(`[${ts}] [${label}] ${msg}`);
    }
  }

  debug(msg, obj) { this.log(LEVELS.DEBUG, msg, obj); }
  info(msg, obj)  { this.log(LEVELS.INFO,  msg, obj); }
  warn(msg, obj)  { this.log(LEVELS.WARN,  msg, obj); }
  error(msg, obj) { this.log(LEVELS.ERROR, msg, obj); }
}

export const logger = new Logger();

// Optional telemetry sink for warn/error
logger.warn = function(msg, obj){ Logger.prototype.log.call(logger, LEVELS.WARN, msg, obj); if (logger.telemetry) logger.telemetry.event('warn', { msg, ...obj }); };
logger.error = function(msg, obj){ Logger.prototype.log.call(logger, LEVELS.ERROR, msg, obj); if (logger.telemetry) logger.telemetry.event('error', { msg, ...obj }); };
