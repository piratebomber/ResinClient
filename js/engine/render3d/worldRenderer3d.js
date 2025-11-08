// worldRenderer3d.js — Upload mesh buffers and render visible chunks.

import { createGL } from './gl.js';
import { createVoxelProgram, createSkyProgram } from './shader.js';
import { buildChunkMesh } from './meshBuilder.js';
import { TextureAtlas } from './atlas.js';

export class WorldRenderer3D {
  /** @param {HTMLCanvasElement} canvas @param {import('../world3d/world3d.js').World3D} world @param {import('./camera.js').FPCamera} camera */
  constructor(canvas, world, camera) {
    this.canvas = canvas;
    this.gl = createGL(canvas);
    this.world = world; this.camera = camera;
    this.voxel = createVoxelProgram(this.gl);
    this.buffers = new Map(); // key -> {vbo,nbo,cbo,uvbo,ibo,count}
    this.sky = createSkyProgram(this.gl);

    // Create atlas (build from resource pack later if present)
    this.atlas = new TextureAtlas(this.gl, 16);
    this.atlas.build(null);

    // Enable 32-bit indices if needed
    this.gl.getExtension('OES_element_index_uint');

    // Entity dynamic buffers
    this.eVBO = this.gl.createBuffer();
    this.eNBO = this.gl.createBuffer();
    this.eCBO = this.gl.createBuffer();
    this.eIBO = this.gl.createBuffer();

    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
    this._onResize();

    this.env = { lightDir: [0.6,0.8,0.5], ambient: 0.15, sky: [0.05,0.05,0.07,1] };
  }

  setEnv(env){ this.env = env; }

  destroy(){ window.removeEventListener('resize', this._onResize); }

  _onResize(){
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio||1));
    const w=Math.floor(this.canvas.clientWidth*dpr), h=Math.floor(this.canvas.clientHeight*dpr);
    if (this.canvas.width!==w || this.canvas.height!==h){ this.canvas.width=w; this.canvas.height=h; this.gl.viewport(0,0,w,h); this.camera.resize(w,h); }
  }

  _rebuildChunk(cx,cy,cz){
    const key=`${cx},${cy},${cz}`; const gl=this.gl;
    const mesh = buildChunkMesh(this.world, cx,cy,cz, (id)=> this.atlas.tile(id)); if (!mesh || mesh.indices.length===0){ this.buffers.delete(key); return; }
    // Create / update buffers
    const rec = this.buffers.get(key) || {};
    rec.vbo = rec.vbo || gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, rec.vbo); gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);
    rec.nbo = rec.nbo || gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, rec.nbo); gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);
    rec.cbo = rec.cbo || gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, rec.cbo); gl.bufferData(gl.ARRAY_BUFFER, mesh.colors, gl.STATIC_DRAW);
    rec.uvbo = rec.uvbo || gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, rec.uvbo); gl.bufferData(gl.ARRAY_BUFFER, mesh.uvs, gl.STATIC_DRAW);
    rec.ibo = rec.ibo || gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rec.ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
    rec.count = mesh.indices.length;
    this.buffers.set(key, rec);
  }

  updateVisible(player){
    // Stream chunks around player
    const cx=Math.floor(player.pos[0]/this.world.sx), cy=Math.floor(player.pos[1]/this.world.sy), cz=Math.floor(player.pos[2]/this.world.sz);
    this.world.updateStreaming(cx,cy,cz);
    // Rebuild dirty chunks
    for (const [key, chunk] of this.world.chunks){ if (chunk.dirty){ this._rebuildChunk(chunk.cx, chunk.cy, chunk.cz); chunk.dirty=false; } }
  }

  render(entities){
    const { gl } = this; const { prog, attribs, uniforms } = this.voxel;
    const e = this.env || { lightDir:[0.6,0.8,0.5], ambient:0.15, sky:[0.05,0.05,0.07,1] };
    this.gl.clearColor(e.sky[0], e.sky[1], e.sky[2], e.sky[3]);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Sun/Moon quads in NDC
    this._drawSunMoon(e);

    gl.useProgram(prog);
    gl.uniformMatrix4fv(uniforms.u_proj, false, this.camera.proj());
    gl.uniformMatrix4fv(uniforms.u_view, false, this.camera.view());
    gl.uniform3fv(uniforms.u_lightDir, new Float32Array(this.env.lightDir));
    gl.uniform1f(uniforms.u_ambient, this.env.ambient);

    // Bind atlas texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.atlas.texture);
    gl.uniform1i(uniforms.u_tex, 0);
    gl.uniform1i(uniforms.u_useTex, 1);

    for (const [key, rec] of this.buffers){ if (!rec.count) continue;
      gl.bindBuffer(gl.ARRAY_BUFFER, rec.vbo); gl.enableVertexAttribArray(attribs.a_pos); gl.vertexAttribPointer(attribs.a_pos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, rec.nbo); gl.enableVertexAttribArray(attribs.a_norm); gl.vertexAttribPointer(attribs.a_norm, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, rec.cbo); gl.enableVertexAttribArray(attribs.a_col); gl.vertexAttribPointer(attribs.a_col, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, rec.uvbo); gl.enableVertexAttribArray(attribs.a_uv); gl.vertexAttribPointer(attribs.a_uv, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rec.ibo);
      gl.drawElements(gl.TRIANGLES, rec.count, gl.UNSIGNED_INT, 0);
    }

    // Draw entities with color (no texture)
    if (entities && entities.length) {
      gl.uniform1i(uniforms.u_useTex, 0);
      const mesh = buildEntitiesMesh(entities);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.eVBO); gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(attribs.a_pos); gl.vertexAttribPointer(attribs.a_pos,3,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.eNBO); gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(attribs.a_norm); gl.vertexAttribPointer(attribs.a_norm,3,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.eCBO); gl.bufferData(gl.ARRAY_BUFFER, mesh.colors, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(attribs.a_col); gl.vertexAttribPointer(attribs.a_col,3,gl.FLOAT,false,0,0);
      gl.disableVertexAttribArray(attribs.a_uv);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.eIBO); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.DYNAMIC_DRAW);
      gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_INT, 0);
      // Restore texture usage for next frame
      gl.uniform1i(uniforms.u_useTex, 1);
    }
  }

  _drawSunMoon(env){
    const gl=this.gl; const { prog, attribs, uniforms } = this.sky;
    gl.useProgram(prog);
    gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    // Position based on lightDir; map [-1,1] to NDC [-0.8,0.8]
    const lx=env.lightDir[0], ly=env.lightDir[1], lz=env.lightDir[2];
    const sun = { cx: lx*0.8, cy: ly*0.8, color:[1.0,0.95,0.7] };
    const moon = { cx: -lx*0.8, cy: -ly*0.8, color:[0.8,0.9,1.0] };
    const quad = new Float32Array([-0.05,-0.05, 0.05,-0.05, 0.05,0.05, -0.05,0.05]);
    const vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(attribs.a_pos); gl.vertexAttribPointer(attribs.a_pos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1f(uniforms.u_scale, 1.0);

    gl.uniform2f(uniforms.u_center, sun.cx, sun.cy); gl.uniform3f(uniforms.u_color, sun.color[0],sun.color[1],sun.color[2]); gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    gl.uniform2f(uniforms.u_center, moon.cx, moon.cy); gl.uniform3f(uniforms.u_color, moon.color[0],moon.color[1],moon.color[2]); gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    gl.deleteBuffer(vbo);
    gl.disable(gl.BLEND); gl.enable(gl.DEPTH_TEST);
  }

  }
}

function buildEntitiesMesh(entities){
  const pos=[]; const norm=[]; const col=[]; const idx=[]; let base=0;
  for (const e of entities){
    const x=e.pos[0], y=e.pos[1], z=e.pos[2];
    const w=e.size||0.8, h=(e.size?e.size*1.0:1.6), d=e.size||0.8; // size override for drops
    // 6 faces
    const faces = [
      { n:[0,1,0],  c:[[0,h,0],[w,h,0],[w,h,d],[0,h,d]] },
      { n:[0,-1,0], c:[[0,0,0],[0,0,d],[w,0,d],[w,0,0]] },
      { n:[0,0,1],  c:[[0,0,d],[w,0,d],[w,h,d],[0,h,d]] },
      { n:[0,0,-1], c:[[0,0,0],[0,h,0],[w,h,0],[w,0,0]] },
      { n:[1,0,0],  c:[[w,0,0],[w,0,d],[w,h,d],[w,h,0]] },
      { n:[-1,0,0], c:[[0,0,0],[0,h,0],[0,h,d],[0,0,d]] },
    ];
    for (const f of faces){
      for (let k=0;k<4;k++){
        const c=f.c[k]; pos.push(x+c[0]-w/2, y+c[1], z+c[2]-d/2);
        norm.push(f.n[0],f.n[1],f.n[2]);
        col.push(e.color[0], e.color[1], e.color[2]);
      }
      idx.push(base,base+1,base+2, base,base+2,base+3); base+=4;
    }
  }
  return { positions:new Float32Array(pos), normals:new Float32Array(norm), colors:new Float32Array(col), indices:new Uint32Array(idx) };
}
