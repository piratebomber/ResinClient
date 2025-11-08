// surface2d.js — Canvas 2D rendering surface with resize management.
// Provides a minimal abstraction so the renderer can be swapped for WebGL later.

import { logger } from '../../core/logger.js';

export class Surface2D {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
    this.pixelRatio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
    this._onResize();
  }

  destroy() { window.removeEventListener('resize', this._onResize); }

  _onResize() {
    const { canvas, pixelRatio: dpr } = this;
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      this.ctx.imageSmoothingEnabled = false;
      logger.debug('Surface resized', { w, h, dpr });
    }
  }

  clear(color = '#0b0b0e') {
    const { ctx, canvas } = this;
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
}
