// gameLoop.js — RAF-driven main loop with fixed timestep updates.

export class GameLoop {
  /** @param {{ update(dt:number):void, render():void }} runner */
  constructor(runner) {
    this.runner = runner;
    this.accum = 0; this.last = 0; this.frame = null; this.paused = false;
    this.fixed = 1/60; // 60Hz

    this._tick = this._tick.bind(this);
    document.addEventListener('resin:pause', () => { this.paused = true; });
    document.addEventListener('resin:resume', () => { this.paused = false; this.last = performance.now(); });
  }

  start() { if (this.frame !== null) return; this.last = performance.now(); this.frame = requestAnimationFrame(this._tick); }
  stop()  { if (this.frame === null) return; cancelAnimationFrame(this.frame); this.frame = null; }

  _tick(now) {
    if (this.paused) { this.last = now; this.frame = requestAnimationFrame(this._tick); return; }
    const dt = Math.min(0.25, (now - this.last) / 1000); this.last = now; this.accum += dt;
    while (this.accum >= this.fixed) { this.runner.update(this.fixed); this.accum -= this.fixed; }
    this.runner.render();
    this.frame = requestAnimationFrame(this._tick);
  }
}
