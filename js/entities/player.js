// player.js — First-person player controller binding input to physics and camera.

import { Entity } from './entity.js';
import { FPCamera } from '../engine/render3d/camera.js';
import { vec3 } from '../engine/render3d/math.js';
import { ITEM } from '../items/items.js';

export class Player extends Entity {
  constructor(physics) {
    super();
    this.cam = new FPCamera();
    this.physics = physics;
    this.pos[0]=8; this.pos[1]=30; this.pos[2]=8;
    this.cam.pos = this.pos; // camera at entity position
    this.speedMul = 1.0;
    this.onGround = false;
    this.inventory = new Map();
    // seed inventory with tools/blocks
    this.addItem(ITEM.PICK_WOOD, 1);
    this.addItem(ITEM.PICK_STONE, 1);
    this.addItem(ITEM.PICK_IRON, 1);
    this.addItem(ITEM.SWORD_WOOD, 1);
    this.addItem(ITEM.BLOCK_DIRT, 64);
    this.addItem(ITEM.BLOCK_STONE, 64);
    this.addItem(ITEM.BLOCK_PLANKS, 64);

    this.hotbar = [ITEM.BLOCK_DIRT, ITEM.PICK_WOOD, ITEM.BLOCK_STONE, ITEM.PICK_STONE, ITEM.BLOCK_PLANKS, ITEM.PICK_IRON, ITEM.SWORD_WOOD, 0, 0];
    this.selected = 1; // 1..9 slot index
  }

  look(dx,dy){ this.cam.look(dx,dy); this.yaw=this.cam.yaw; this.pitch=this.cam.pitch; }

  getItemCount(id){ return this.inventory.get(id)|0; }
  addItem(id, count){ this.inventory.set(id, (this.inventory.get(id)|0) + count); }
  removeItem(id, count){ const cur=(this.inventory.get(id)|0); const next=Math.max(0, cur-count); this.inventory.set(id, next); return next; }

  moveInput(keys, dt) {
    // WASD + Space for jump
    let f=0,r=0;
    if (keys.has('w')) f+=1;
    if (keys.has('s')) f-=1;
    if (keys.has('a')) r-=1;
    if (keys.has('d')) r+=1;

    // Horizontal movement in camera space, applied via velocity target
    const sin = Math.sin(this.cam.yaw), cos = Math.cos(this.cam.yaw);
    const ax = (sin*f + cos*r) * this.cam.speed * this.speedMul;
    const az = (cos*f - sin*r) * this.cam.speed * this.speedMul;

    // Apply to velocity (Y handled by physics + jump)
    this.vel[0] = ax;
    this.vel[2] = az;

    // Jump using physics contact info
    if (keys.has(' ') && this.physics && this.contacts?.onGround) {
      this.vel[1] = 5.5;
    }

    // Step physics
    this.physics.step(this, dt);
    this.onGround = !!this.contacts?.onGround;
  }
}
