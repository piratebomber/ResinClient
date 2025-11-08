// world3d.js — Chunked 3D world with simple flat terrain and ring streaming.

import { Chunk3D } from './chunk3d.js';
import { B, BLOCK_PROPS } from './blocks.js';

export class World3D {
  constructor({ sx=16, sy=16, sz=64, viewRadius=2, seed=1337 } = {}) {
    this.sx=sx; this.sy=sy; this.sz=sz; // chunk dims
    this.viewRadius = viewRadius; // in chunks
    this.seed = seed;
    this.chunks = new Map(); // key: cx,cy,cz
    this.store = null;
  }

  key(cx,cy,cz){ return `${cx},${cy},${cz}`; }
  getChunk(cx,cy,cz){ return this.chunks.get(this.key(cx,cy,cz)); }
  blockProps(id){ return BLOCK_PROPS[id] || BLOCK_PROPS[B.STONE]; }

  getBlock(x,y,z){
    const cx = Math.floor(x/this.sx), cy=Math.floor(y/this.sy), cz=Math.floor(z/this.sz);
    const chunk = this.ensureChunk(cx,cy,cz);
    const lx = ((x%this.sx)+this.sx)%this.sx;
    const ly = ((y%this.sy)+this.sy)%this.sy;
    const lz = ((z%this.sz)+this.sz)%this.sz;
    return chunk.get(lx,ly,lz);
  }

  setBlock(x,y,z,id){
    const cx = Math.floor(x/this.sx), cy=Math.floor(y/this.sy), cz=Math.floor(z/this.sz);
    const chunk = this.ensureChunk(cx,cy,cz);
    const lx = ((x%this.sx)+this.sx)%this.sx;
    const ly = ((y%this.sy)+this.sy)%this.sy;
    const lz = ((z%this.sz)+this.sz)%this.sz;
    chunk.set(lx,ly,lz,id);
    // Persist
    if (this.store) {
      const k=this.key(cx,cy,cz);
      this.store.put(k, chunk.data.buffer.slice(0));
    }
  }

  setStore(store){ this.store = store; }

  ensureChunk(cx,cy,cz) {
    const k=this.key(cx,cy,cz); let c=this.chunks.get(k);
    if (!c) {
      c=new Chunk3D(cx,cy,cz,{sx:this.sx,sy:this.sy,sz:this.sz});
      this.generate(c);
      this.chunks.set(k,c);
      // Async load persisted chunk and replace data
      if (this.store) {
        this.store.get(k).then(buf=>{
          if (buf && buf.byteLength === c.data.byteLength) {
            c.data.set(new Uint16Array(buf)); c.dirty=true;
          }
        }).catch(()=>{});
      }
    }
    return c;
  }

  /** Flat world generator with surface grass, dirt, stone; simple trees. */
  generate(chunk){
    // Terrain: mountains with ridges via fractal noise
    const sea = 28;
    for (let z=0; z<chunk.sz; z++) for (let x=0; x<chunk.sx; x++) {
      const wx = chunk.cx*chunk.sx + x; const wz = chunk.cz*chunk.sz + z;
      const hBase = mountainHeight(wx, wz, this.seed); // 0..1
      const height = Math.floor(sea + hBase * 40); // up to ~68
      for (let y=0; y<chunk.sy; y++) {
        const wy = chunk.cy*chunk.sy + y;
        let id = B.AIR;
        if (wy <= height-6) id = B.STONE;
        else if (wy <= height-1) id = B.DIRT;
        else if (wy === height) id = B.GRASS;
        if (id!==B.AIR) chunk.set(x,y,z,id);

        // Ore generation within stone bands
        if (id === B.STONE) {
          const r = hash3(wx, wy, wz, this.seed);
          if (wy < 16 && (r%197)===0) chunk.set(x,y,z,B.DIAMOND_ORE);
          else if (wy < 32 && (r%101)===0) chunk.set(x,y,z,B.GOLD_ORE);
          else if (wy < 48 && (r%67)===0) chunk.set(x,y,z,B.IRON_ORE);
          else if (wy < 64 && (r%37)===0) chunk.set(x,y,z,B.COAL_ORE);
        }
      }
      // Trees on gentle slopes near surface
      if ((hash2(wx+13,wz-7,this.seed)%57)===0) {
        const ty = Math.floor(sea + mountainHeight(wx,wz,this.seed)*40) + 1 - chunk.cy*chunk.sy;
        if (ty>0 && ty<chunk.sy-6) {
          // trunk
          const heightLog = 4 + (hash2(wx,wz,this.seed)%3);
          for (let i=0;i<heightLog;i++) if (chunk.inb(x,ty+i,z)) chunk.set(x,ty+i,z,B.LOG);
          // canopy
          for (let dz=-3;dz<=3;dz++) for (let dx=-3;dx<=3;dx++) for (let dy=2;dy<=5;dy++) {
            if (Math.abs(dx)+Math.abs(dz)+Math.abs(dy-3) <= 5) {
              const lx=x+dx, ly=ty+dy, lz=z+dz; if (chunk.inb(lx,ly,lz) && chunk.get(lx,ly,lz)===B.AIR) chunk.set(lx,ly,lz,B.LEAVES);
            }
          }
        }
      }
    }
  }

function lerp(a,b,t){return a+(b-a)*t;}
function smooth(t){return t*t*(3-2*t);} // smoothstep
function white2(x,z,seed){ return (hash2(x,z,seed)%1000)/1000; }
function valueNoise2(x,z,seed){
  const ix=Math.floor(x), iz=Math.floor(z); const fx=x-ix, fz=z-iz;
  const v00=white2(ix,iz,seed), v10=white2(ix+1,iz,seed), v01=white2(ix,iz+1,seed), v11=white2(ix+1,iz+1,seed);
  const vx0=lerp(v00,v10,smooth(fx)); const vx1=lerp(v01,v11,smooth(fx));
  return lerp(vx0,vx1,smooth(fz));
}
function fractalNoise2(x,z,seed){
  let f=0, amp=1, sum=0, freq=0.01;
  for (let i=0;i<4;i++){ sum += valueNoise2(x*freq,z*freq,seed+i*7)*amp; amp*=0.5; freq*=2; }
  return sum/(1-0.5**4);
}
function ridge(n){ return 1.0 - Math.abs(2.0*n-1.0); }
function mountainHeight(x,z,seed){
  const base = fractalNoise2(x,z,seed);
  const rid = ridge(fractalNoise2(x+1000,z+1000,seed+999));
  return Math.min(1, base*0.5 + rid*0.7);
}

  /** Load chunks around a chunk position radius; evict far chunks. */
  updateStreaming(centerCX, centerCY, centerCZ) {
    const keep = new Set();
    for (let dz=-this.viewRadius; dz<=this.viewRadius; dz++)
      for (let dy=-this.viewRadius; dy<=this.viewRadius; dy++)
        for (let dx=-this.viewRadius; dx<=this.viewRadius; dx++) {
          const cx=centerCX+dx, cy=centerCY+dy, cz=centerCZ+dz; keep.add(this.key(cx,cy,cz)); this.ensureChunk(cx,cy,cz);
        }
    for (const k of this.chunks.keys()) if (!keep.has(k)) this.chunks.delete(k);
  }

  applyChunk(cx,cy,cz, dataU16) {
    const c = this.ensureChunk(cx,cy,cz);
    if (dataU16 && dataU16.length === c.data.length) {
      c.data.set(dataU16); c.dirty = true;
      if (this.store) this.store.put(this.key(cx,cy,cz), c.data.buffer.slice(0));
    }
  }
}

function hash2(x,z,seed){
  let h=seed|0; h^=x*374761393; h=(h<<13)|(h>>>19); h=h*1274126177; h^=z*668265263; h^=h>>>16; return (h>>>0)%1000;
}
function hash3(x,y,z,seed){
  let h=seed|0; h^=x*374761393; h=(h<<13)|(h>>>19); h=h*1274126177; h^=y*1442695040888963407; h=(h<<7)|(h>>>25); h^=z*668265263; h^=h>>>16; return (h>>>0);
}
