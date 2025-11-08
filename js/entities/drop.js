// drop.js — Item/block drop entity with gravity and pickup.

import { Entity } from './entity.js';

export class Drop extends Entity {
  constructor(physics, itemId, count, color=[1,1,0]){
    super();
    this.itemId = itemId;
    this.count = count;
    this.color = color;
    this.size = 0.5; // render size
    this.aabb = [0.25,0.25,0.25];
    this.physics = physics;
    // light toss
    this.vel[0] = (Math.random()*2-1)*1.5;
    this.vel[1] = 4 + Math.random()*2;
    this.vel[2] = (Math.random()*2-1)*1.5;
  }
  update(dt){
    this.physics.step(this, dt);
  }
}
