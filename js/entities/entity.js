// entity.js — Base entity type.

import { vec3 } from '../render3d/math.js';

export class Entity {
  constructor() {
    this.pos = vec3(0,0,0);
    this.vel = vec3(0,0,0);
    this.aabb = [0.3, 0.9, 0.3]; // half extents (player sized)
    this.yaw = 0; this.pitch = 0;
  }
}
