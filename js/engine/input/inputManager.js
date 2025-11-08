// inputManager.js — Aggregates keyboard/mouse input and exposes a simple API.
// Tracks camera movement, zoom, and tile interactions.

export class InputManager {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this.canvas = canvas;
    // Movement
    this.keys = new Set();
    this.speed = 10; // tiles per second
    // Zoom
    this.zoomStep = 0.1;
    // Mouse
    this.mouseTile = { x: -1, y: -1, over: false, shift: false, down: false };

    this._onKey = this._onKey.bind(this);
    this._onWheel = this._onWheel.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);

    window.addEventListener('keydown', this._onKey, true);
    window.addEventListener('keyup', this._onKey, true);
    canvas.addEventListener('wheel', this._onWheel, { passive: true });
    canvas.addEventListener('mousemove', this._onMouseMove);
    canvas.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
  }

  destroy() {
    window.removeEventListener('keydown', this._onKey, true);
    window.removeEventListener('keyup', this._onKey, true);
    this.canvas.removeEventListener('wheel', this._onWheel);
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mouseup', this._onMouseUp);
  }

  /** @param {KeyboardEvent} e */
  _onKey(e) {
    const type = e.type;
    const k = e.key.toLowerCase();
    if (type === 'keydown') this.keys.add(k); else this.keys.delete(k);
  }

  /** @param {WheelEvent} e */
  _onWheel(e) {
    // Handled by game logic; expose delta via event
    const detail = { deltaY: e.deltaY };
    document.dispatchEvent(new CustomEvent('resin:wheel', { detail }));
  }

  /** @param {MouseEvent} e */
  _onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    document.dispatchEvent(new CustomEvent('resin:mousemove', { detail: { x, y, shift: e.shiftKey } }));
  }

  /** @param {MouseEvent} e */
  _onMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    document.dispatchEvent(new CustomEvent('resin:mousedown', { detail: { button: e.button, shift: e.shiftKey, x, y } }));
  }

  /** @param {MouseEvent} e */
  _onMouseUp(e) {
    document.dispatchEvent(new CustomEvent('resin:mouseup', { detail: { button: e.button, shift: e.shiftKey } }));
  }

  /** Move camera based on held keys; returns {dx, dy} in tiles */
  pollMove(dt) {
    let dx = 0, dy = 0;
    if (this.keys.has('w')) dy -= 1;
    if (this.keys.has('s')) dy += 1;
    if (this.keys.has('a')) dx -= 1;
    if (this.keys.has('d')) dx += 1;
    const len = Math.hypot(dx, dy) || 1;
    const v = this.speed * dt;
    return { dx: (dx/len) * v, dy: (dy/len) * v };
  }
}
