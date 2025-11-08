// physics.js — Simple AABB physics: gravity, collision with voxel world.

export class Physics {
  constructor(world) {
    this.world = world;
    this.g = -9.8; // m/s^2, Y-up with gravity negative
    this.maxStep = 0.05; // prevent tunneling
  }

  /** @param {{pos:Float32Array, vel:Float32Array, aabb:[number,number,number], contacts?:any}} ent @param {number} dt */
  step(ent, dt) {
    ent.contacts = { onGround:false, normals:[] };
    // Split into small steps for stability
    let t = dt;
    while (t > 1e-6) {
      const h = Math.min(this.maxStep, t); t -= h;
      // Integrate velocity
      ent.vel[1] += this.g * h;
      const next = [ent.pos[0] + ent.vel[0]*h, ent.pos[1] + ent.vel[1]*h, ent.pos[2] + ent.vel[2]*h];
      // Collide per-axis against solid blocks
      [0,1,2].forEach(axis => {
        const p = [...ent.pos]; p[axis] = next[axis];
        const hitN = this._collisionNormal(p, ent.aabb);
        if (hitN) {
          // Zero velocity and clamp position to block boundary
          ent.vel[axis] = 0;
          ent.contacts.normals.push(hitN);
          if (hitN[1] > 0.5) ent.contacts.onGround = true; // normal pointing up means standing on ground
          // Nudge out of block along normal
          while (this._collides(p, ent.aabb)) {
            p[0] += hitN[0]*1e-3; p[1] += hitN[1]*1e-3; p[2] += hitN[2]*1e-3;
          }
          next[axis] = p[axis];
        }
      });
      ent.pos[0]=next[0]; ent.pos[1]=next[1]; ent.pos[2]=next[2];
    }
  }

  /** Check overlap of AABB with solid blocks */
  _collides(pos, half){
    const min = [Math.floor(pos[0]-half[0]), Math.floor(pos[1]-half[1]), Math.floor(pos[2]-half[2])];
    const max = [Math.floor(pos[0]+half[0]), Math.floor(pos[1]+half[1]), Math.floor(pos[2]+half[2])];
    for (let z=min[2]; z<=max[2]; z++) for (let y=min[1]; y<=max[1]; y++) for (let x=min[0]; x<=max[0]; x++) {
      const id = this.world.getBlock(x,y,z);
      if (this.world.blockProps(id).solid) return true;
    }
    return false;
  }

  /** Approximate collision normal by sampling surrounding voxels */
  _collisionNormal(pos, half){
    // Check along each axis which side we are overlapping more on
    const n=[0,0,0];
    const eps=1e-3;
    if (this._collides([pos[0]-eps,pos[1],pos[2]], half)) n[0]+=1;
    if (this._collides([pos[0]+eps,pos[1],pos[2]], half)) n[0]-=1;
    if (this._collides([pos[0],pos[1]-eps,pos[2]], half)) n[1]+=1;
    if (this._collides([pos[0],pos[1]+eps,pos[2]], half)) n[1]-=1;
    if (this._collides([pos[0],pos[1],pos[2]-eps], half)) n[2]+=1;
    if (this._collides([pos[0],pos[1],pos[2]+eps], half)) n[2]-=1;
    const len=Math.hypot(n[0],n[1],n[2]);
    if (len<1e-6) return null; return [n[0]/len,n[1]/len,n[2]/len];
  }
}
