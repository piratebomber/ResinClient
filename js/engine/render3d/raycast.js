// raycast.js — Grid-aligned voxel ray marching (3D DDA)
// Returns the first solid block intersected up to maxDist.

import { B } from '../world3d/blocks.js';

/**
 * @param {import('../world3d/world3d.js').World3D} world
 * @param {Float32Array} origin vec3
 * @param {Float32Array} dir normalized vec3
 * @param {number} maxDist
 * @returns {{hit:boolean, bx?:number, by?:number, bz?:number, nx?:number, ny?:number, nz?:number, t?:number}}
 */
export function raycast(world, origin, dir, maxDist=6) {
  // Based on Amanatides & Woo 1987
  let x = Math.floor(origin[0]);
  let y = Math.floor(origin[1]);
  let z = Math.floor(origin[2]);

  const stepX = dir[0] > 0 ? 1 : -1;
  const stepY = dir[1] > 0 ? 1 : -1;
  const stepZ = dir[2] > 0 ? 1 : -1;

  const txDelta = Math.abs(1 / (dir[0] || 1e-9));
  const tyDelta = Math.abs(1 / (dir[1] || 1e-9));
  const tzDelta = Math.abs(1 / (dir[2] || 1e-9));

  let vx = x + (stepX > 0 ? 1 : 0);
  let vy = y + (stepY > 0 ? 1 : 0);
  let vz = z + (stepZ > 0 ? 1 : 0);

  let txMax = (vx - origin[0]) / (dir[0] || 1e-9);
  let tyMax = (vy - origin[1]) / (dir[1] || 1e-9);
  let tzMax = (vz - origin[2]) / (dir[2] || 1e-9);

  let dist = 0;
  let nx=0, ny=0, nz=0; // hit normal

  // Early test: is starting inside solid?
  if (isSolid(world, x, y, z)) {
    return { hit: true, bx: x, by: y, bz: z, nx: 0, ny: 0, nz: 0, t: 0 };
  }

  while (dist <= maxDist) {
    if (txMax < tyMax) {
      if (txMax < tzMax) {
        // step x
        x += stepX; dist = txMax; txMax += txDelta; nx = -stepX; ny = 0; nz = 0;
      } else {
        // step z
        z += stepZ; dist = tzMax; tzMax += tzDelta; nx = 0; ny = 0; nz = -stepZ;
      }
    } else {
      if (tyMax < tzMax) {
        // step y
        y += stepY; dist = tyMax; tyMax += tyDelta; nx = 0; ny = -stepY; nz = 0;
      } else {
        // step z
        z += stepZ; dist = tzMax; tzMax += tzDelta; nx = 0; ny = 0; nz = -stepZ;
      }
    }

    if (isSolid(world, x, y, z)) {
      return { hit: true, bx: x, by: y, bz: z, nx, ny, nz, t: dist };
    }
  }

  return { hit: false };
}

function isSolid(world, x, y, z) {
  const id = world.getBlock(x, y, z);
  return world.blockProps(id).solid;
}
