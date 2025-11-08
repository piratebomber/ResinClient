// chunk3d.js — 3D chunk storage using typed arrays.

export class Chunk3D {
  /** @param {number} cx @param {number} cy @param {number} cz @param {{sx:number, sy:number, sz:number}} size */
  constructor(cx, cy, cz, { sx, sy, sz }) {
    this.cx=cx; this.cy=cy; this.cz=cz;
    this.sx=sx; this.sy=sy; this.sz=sz;
    this.data = new Uint16Array(sx*sy*sz);
    this.dirty = true;
  }
  idx(x,y,z){ return x + this.sx*(y + this.sy*z); }
  inb(x,y,z){ return x>=0&&y>=0&&z>=0&&x<this.sx&&y<this.sy&&z<this.sz; }
  get(x,y,z){ if(!this.inb(x,y,z)) return 0; return this.data[this.idx(x,y,z)]; }
  set(x,y,z,v){ if(!this.inb(x,y,z)) return; this.data[this.idx(x,y,z)]=v; this.dirty=true; }
}
