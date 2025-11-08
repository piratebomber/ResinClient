// camera.js — First-person camera with yaw/pitch and movement.

import { clamp, vec3, add3, scale3, lookFrom, perspective } from './math.js';

export class FPCamera {
  constructor() {
    this.pos = vec3(8, 20, 8);
    this.yaw = 0; // radians
    this.pitch = 0; // radians
    this.fov = 70 * Math.PI/180;
    this.near = 0.1; this.far = 1000;
    this.sens = 0.0025; // mouse sensitivity
    this.speed = 6; // m/s
    this._view = null; this._proj = null; this.aspect = 1;

    // Animation offsets (applied in view())
    this.yawOff = 0; this.pitchOff = 0; this.posOff = vec3(0,0,0);
  }
  resize(w,h){ this.aspect = w / h; this._proj = null; }
  view(){ this._view = lookFrom(add3(this.pos, this.posOff), this.yaw + this.yawOff, this.pitch + this.pitchOff); return this._view; }
  proj(){ if (!this._proj) this._proj = perspective(this.fov, this.aspect, this.near, this.far); return this._proj; }

  look(dx, dy) {
    this.yaw -= dx * this.sens;
    this.pitch -= dy * this.sens;
    this.pitch = clamp(this.pitch, -Math.PI/2 + 0.01, Math.PI/2 - 0.01);
  }

  move(dir, dt) {
    const speed = this.speed * dt;
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    // dir: {f: -1..1, r: -1..1, u: -1..1}
    const forward = vec3(sin, 0, cos);
    const right = vec3(cos, 0, -sin);
    let delta = vec3(0,0,0);
    delta = add3(delta, scale3(forward, dir.f * speed));
    delta = add3(delta, scale3(right,   dir.r * speed));
    delta = add3(delta, scale3(vec3(0,1,0), dir.u * speed));
    this.pos = add3(this.pos, delta);
  }
}
