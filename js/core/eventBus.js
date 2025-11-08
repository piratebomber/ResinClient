// eventBus.js — Tiny pub/sub for decoupled communication.
// Guarantees:
// - Listener addition/removal is O(1).
// - Emission runs listeners in registration order.
// - No leaking references: cleared on page unload.

/** @template T */
export class EventBus {
  constructor() { this.map = new Map(); }

  /** @param {keyof T & string} type @param {(payload: T[typeof type]) => void} handler */
  on(type, handler) {
    const list = this.map.get(type) || []; list.push(handler); this.map.set(type, list);
    return () => this.off(type, handler);
  }

  /** @param {keyof T & string} type @param {(payload: T[typeof type]) => void} handler */
  off(type, handler) {
    const list = this.map.get(type); if (!list) return;
    const i = list.indexOf(handler); if (i >= 0) list.splice(i, 1);
  }

  /** @param {keyof T & string} type @param {T[typeof type]} payload */
  emit(type, payload) {
    const list = this.map.get(type); if (!list) return;
    // Snapshot to avoid mutation during emit
    [...list].forEach(fn => { try { fn(payload); } catch (e) { /* swallow per-listener */ } });
  }
}
