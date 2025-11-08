// stateManager.js — Simple finite state machine for Resin.

export const STATE = /** @type {const} */ ({ MENU: 'MENU', PLAY: 'PLAY', PAUSED: 'PAUSED' });

export class StateManager {
  constructor() { this.state = STATE.MENU; this.listeners = new Set(); }
  get() { return this.state; }
  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  _emit() { this.listeners.forEach(fn => { try { fn(this.state); } catch {} }); }
  enter(state) { if (this.state !== state) { this.state = state; this._emit(); } }
  is(state) { return this.state === state; }
}
