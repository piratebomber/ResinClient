// mob.js — Simple wandering mob entity with health and basic AI.

import { Entity } from './entity.js';

export class Mob extends Entity {
  constructor(physics) {
    super();
    this.health = 10;
    this.aiTimer = 0;
    this.aiYaw = Math.random()*Math.PI*2;
    this.speed = 2.5;
    this.physics = physics;
    this.color = [0.8, 0.2, 0.2];
  }

  damage(d){ this.health -= d; return this.health <= 0; }

  update(dt){
    // Simple wander: change direction periodically
    this.aiTimer -= dt;
    if (this.aiTimer <= 0) { this.aiTimer = 2 + Math.random()*3; this.aiYaw = Math.random()*Math.PI*2; }

    // Move forward in facing direction
    const sin = Math.sin(this.aiYaw), cos = Math.cos(this.aiYaw);
    this.vel[0] = sin * this.speed;
    this.vel[2] = cos * this.speed;

    // Gravity handled by physics
    this.physics.step(this, dt);

    // If collided horizontally, pick a new direction
    if (this.contacts && this.contacts.normals.some(n=>Math.abs(n[0])>0.5 || Math.abs(n[2])>0.5)) {
      this.aiYaw += Math.PI * (0.5 + Math.random()*0.5);
    }
  }
}
