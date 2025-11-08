// atlas.js — Build a texture atlas from resource pack or block colors.

import { BLOCK_PROPS } from '../world3d/blocks.js';

export class TextureAtlas {
  constructor(gl, tileSize=16) {
    this.gl = gl; this.tileSize = tileSize; this.map = new Map(); // blockId -> {u0,v0,u1,v1}
    this.texture = null;
  }

  /** @param {Map<string,HTMLImageElement>} textures */
  build(textures) {
    const ids = Object.keys(BLOCK_PROPS).map(k=>Number(k)).filter(n=>!Number.isNaN(n));
    const N = ids.length; const dim = Math.ceil(Math.sqrt(N));
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = dim * this.tileSize;
    const ctx = canvas.getContext('2d');

    ids.forEach((id, i)=>{
      const x = (i % dim) * this.tileSize; const y = Math.floor(i/dim)*this.tileSize;
      const props = BLOCK_PROPS[id];
      const key = `block/${props.name.toLowerCase().replace(/\s+/g,'_')}.png`;
      const img = textures?.get(key);
      if (img) {
        ctx.drawImage(img, x, y, this.tileSize, this.tileSize);
      } else {
        ctx.fillStyle = `rgb(${Math.floor(props.color[0]*255)},${Math.floor(props.color[1]*255)},${Math.floor(props.color[2]*255)})`;
        ctx.fillRect(x, y, this.tileSize, this.tileSize);
      }
      const u0 = x/canvas.width, v0 = y/canvas.height, u1=(x+this.tileSize)/canvas.width, v1=(y+this.tileSize)/canvas.height;
      this.map.set(id, { u0, v0, u1, v1 });
    });

    // Upload to GL
    const gl = this.gl; const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    this.texture = tex;
  }

  tile(id) { return this.map.get(id) || { u0:0, v0:0, u1:1, v1:1 }; }
}
