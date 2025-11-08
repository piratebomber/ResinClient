// mobHostile.js — Hostile mob that chases the player with BFS pathfinding in XZ plane.

import { Mob } from './mob.js';

export class MobHostile extends Mob {
  constructor(physics, world, player){
    super(physics);
    this.world = world; this.player = player; this.color = [0.2,0.6,1.0]; this.speed = 3.0;
    this.path = []; this.pathTimer = 0;
  }

  update(dt){
    // Line of sight toward player (sample along ray in XZ and headroom)
    const los = hasLineOfSight(this.world, this.pos, this.player.pos);
    if (los) {
      // chase directly
      const dx = this.player.pos[0]-this.pos[0], dz = this.player.pos[2]-this.pos[2];
      const len = Math.hypot(dx,dz)||1; this.vel[0]=(dx/len)*this.speed; this.vel[2]=(dz/len)*this.speed;
    } else {
      // Recompute path every 0.5s
      this.pathTimer -= dt; if (this.pathTimer<=0) { this.pathTimer=0.5; this.path = findPathXZ(this.world, this.pos, this.player.pos, 16); }
      if (this.path && this.path.length) {
        const next = this.path[0];
        const dx = next[0]-this.pos[0], dz = next[2]-this.pos[2];
        const len = Math.hypot(dx,dz)||1; this.vel[0]=(dx/len)*this.speed; this.vel[2]=(dz/len)*this.speed;
        if (Math.hypot(dx,dz)<0.3) this.path.shift();
      } else {
        // minimal wander
        super.update(0);
      }
    }

    // Obstacle avoidance: avoid stepping into voids (no ground ahead)
    const nx = this.pos[0] + Math.sign(this.vel[0])*0.6;
    const nz = this.pos[2] + Math.sign(this.vel[2])*0.6;
    const y = Math.floor(this.pos[1]);
    if (!isSolid(this.world, Math.floor(nx), y-1, Math.floor(nz))) {
      // slow or turn
      this.vel[0]*=0.5; this.vel[2]*=0.5; this.aiYaw += (Math.random()-0.5)*0.5;
    }

    this.physics.step(this, dt);
  }
}

function isSolid(world, x,y,z){ return world.blockProps(world.getBlock(x,y,z)).solid; }

function hasLineOfSight(world, from, to){
  const sx=from[0], sy=from[1]+0.9, sz=from[2];
  const dx=to[0]-sx, dy=(to[1]+0.9)-sy, dz=to[2]-sz; const len=Math.hypot(dx,dy,dz)||1; const stepx=dx/len, stepy=dy/len, stepz=dz/len;
  let x=sx, y=sy, z=sz; for (let t=0;t<len; t+=0.5){
    const ix=Math.floor(x), iy=Math.floor(y), iz=Math.floor(z);
    // check head and body
    if (isSolid(world, ix,iy,iz) || isSolid(world, ix,iy+1,iz)) return false;
    x+=stepx; y+=stepy; z+=stepz;
  }
  return true;
}

// Simple BFS on XZ at foot level y, allowing steps up/down 1 block
function findPathXZ(world, from, to, radius){
  const start=[Math.floor(from[0]), Math.floor(from[1]), Math.floor(from[2])];
  const goal=[Math.floor(to[0]), Math.floor(to[1]), Math.floor(to[2])];
  const q=[]; const seen=new Set(); const key=(x,z)=>`${x},${z}`; const prev=new Map();
  const y = start[1];
  q.push([start[0],start[2]]); seen.add(key(start[0],start[2]));
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
  let found=false;
  while (q.length){
    const [x,z]=q.shift(); if (x===goal[0] && z===goal[2]) { found=true; break; }
    for (const d of dirs){
      const nx=x+d[0], nz=z+d[1]; if (Math.abs(nx-start[0])>radius || Math.abs(nz-start[2])>radius) continue;
      const k=key(nx,nz); if (seen.has(k)) continue;
      // Find walkable y near current y within 1 block
      let ny=y; if (isSolid(world, nx, ny-1, nz)) { /* ground ok */ } else if (isSolid(world, nx, ny-2, nz)) { ny-=1; } else { continue; }
      if (isSolid(world, nx, ny, nz)) continue; // body collision
      if (isSolid(world, nx, ny+1, nz)) continue; // head collision
      seen.add(k); prev.set(k, [x,z]); q.push([nx,nz]);
    }
  }
  if (!found) return [];
  // Reconstruct
  const path=[]; let cx=goal[0], cz=goal[2];
  while (!(cx===start[0] && cz===start[2])){ path.push([cx+0.5, y, cz+0.5]); const p=prev.get(key(cx,cz)); if(!p) break; cx=p[0]; cz=p[1]; }
  path.reverse();
  return path.map(p=>[p[0], y, p[2]]);
}
