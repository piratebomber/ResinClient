// meshBuilder.js — Greedy meshing to reduce faces; emits positions, normals, colors, uvs, indices.

import { B } from '../world3d/blocks.js';

/** Greedy mesh adapted from Mikola Lysenko's algorithm for 3 axes. */
export function buildChunkMesh(world, cx, cy, cz, tileForBlock) {
  const chunk = world.getChunk(cx, cy, cz); if (!chunk) return null;
  const dims = [chunk.sx, chunk.sy, chunk.sz];
  const pos=[]; const norm=[]; const col=[]; const uv=[]; const idx=[];
  let iBase = 0;

  // Helper to read block id in local chunk coords (or neighbor via world)
  function idAt(x,y,z){
    if (x>=0 && y>=0 && z>=0 && x<chunk.sx && y<chunk.sy && z<chunk.sz) return chunk.get(x,y,z);
    return world.getBlock(cx*chunk.sx+x, cy*chunk.sy+y, cz*chunk.sz+z);
  }

  for (let d=0; d<3; d++) {
    const u=(d+1)%3, v=(d+2)%3;
    const x=[0,0,0]; const q=[0,0,0]; q[d]=1;
    const mask = new Array(dims[u]*dims[v]);

    for (x[d]=-1; x[d]<dims[d];) {
      let n=0; x[d]++;
      // Build mask
      for (x[v]=0; x[v]<dims[v]; x[v]++) {
        for (x[u]=0; x[u]<dims[u]; x[u]++) {
          const a = getId(x[0],x[1],x[2]);
          const b = getId(x[0]+q[0], x[1]+q[1], x[2]+q[2]);
          // Face exists if exactly one is solid and at least one is opaque
          const face = faceFor(a,b);
          mask[n++] = face;
        }
      }

      // Greedy merge
      n=0;
      for (let j=0; j<dims[v]; j++) {
        for (let i=0; i<dims[u]; ) {
          const f = mask[n];
          if (!f) { i++; n++; continue; }
          // Compute quad width
          let w=1; while (i+w<dims[u] && eqFace(mask[n+w], f)) w++;
          // Compute quad height
          let h=1; outer: for (; j+h<dims[v]; h++) {
            for (let k=0; k<w; k++) { if (!eqFace(mask[n + k + h*dims[u]], f)) { break outer; } }
          }
          // Emit quad
          emitQuad(f, i, j, w, h, d, u, v, x, dims, tileForBlock);
          // Clear mask
          for (let hj=0; hj<h; hj++) for (let wi=0; wi<w; wi++) mask[n + wi + hj*dims[u]] = null;
          i += w; n += w;
        }
      }
    }
  }

  function getId(ix,iy,iz){ return idAt(ix,iy,iz); }
  function isOpaque(id){ return world.blockProps(id).opaque; }
  function isSolid(id){ return world.blockProps(id).solid; }
  function faceFor(a,b){
    const solidA = isSolid(a), solidB = isSolid(b);
    if (solidA===solidB) return null;
    const front = solidA && isOpaque(a) && !isOpaque(b); // face towards +q
    const back  = solidB && isOpaque(b) && !isOpaque(a); // face towards -q
    if (!front && !back) return null;
    return { id: front ? a : b, back: back };
  }
  function eqFace(f1,f2){ return !!f1 && !!f2 && f1.id===f2.id && f1.back===f2.back; }

  function emitQuad(face, i, j, w, h, d, u, v, x, dims, tileForBlock){
    // Compute quad corners in local chunk space
    const du=[0,0,0]; const dv=[0,0,0]; du[u]=w; dv[v]=h;
    const start=[x[0],x[1],x[2]]; start[u]=i; start[v]=j; if (face.back) start[d]++;
    // Convert to world coords
    const wx = cx*chunk.sx, wy=cy*chunk.sy, wz=cz*chunk.sz;

    const corners = [
      [start[0], start[1], start[2]],
      [start[0]+du[0], start[1]+du[1], start[2]+du[2]],
      [start[0]+du[0]+dv[0], start[1]+du[1]+dv[1], start[2]+du[2]+dv[2]],
      [start[0]+dv[0], start[1]+dv[1], start[2]+dv[2]],
    ];

    const nrm = [0,0,0]; nrm[d] = face.back ? -1 : 1;
    const color = world.blockProps(face.id).color;
    const t = tileForBlock(face.id);

    // UVs: map full tile
    const uvs = [ [t.u0,t.v0], [t.u1,t.v0], [t.u1,t.v1], [t.u0,t.v1] ];

    // Push 4 verts
    for (let k=0;k<4;k++){
      pos.push(wx+corners[k][0], wy+corners[k][1], wz+corners[k][2]);
      norm.push(nrm[0],nrm[1],nrm[2]);
      col.push(color[0], color[1], color[2]);
      uv.push(uvs[k][0], uvs[k][1]);
    }

    // Indices (two tris)
    idx.push(iBase, iBase+1, iBase+2, iBase, iBase+2, iBase+3);
    iBase += 4;
  }

  return {
    positions: new Float32Array(pos),
    normals: new Float32Array(norm),
    colors: new Float32Array(col),
    uvs: new Float32Array(uv),
    indices: new Uint32Array(idx),
  };
}
