// shader.js — compile/link helpers and simple voxel program.

export function compile(gl, type, src) {
  const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
  return s;
}

export function program(gl, vs, fs) {
  const p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'program');
  return p;
}

export function createVoxelProgram(gl) {
  const vs = compile(gl, gl.VERTEX_SHADER, `
    attribute vec3 a_pos; // world position in blocks
    attribute vec3 a_norm; // face normal
    attribute vec3 a_col; // color 0..1
    attribute vec2 a_uv;  // texture coords

    uniform mat4 u_proj;
    uniform mat4 u_view;

    varying vec3 v_norm;
    varying vec3 v_col;
    varying vec2 v_uv;

    void main(){
      v_norm = a_norm; v_col = a_col; v_uv = a_uv;
      gl_Position = u_proj * u_view * vec4(a_pos, 1.0);
    }
  `);
  const fs = compile(gl, gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec3 v_norm;
    varying vec3 v_col;
    varying vec2 v_uv;
    uniform sampler2D u_tex;
    uniform bool u_useTex;
    uniform vec3 u_lightDir;
    uniform float u_ambient;

    void main(){
      vec3 N = normalize(v_norm);
      float ndl = max(u_ambient, dot(N, normalize(u_lightDir)));
      vec3 base = u_useTex ? texture2D(u_tex, v_uv).rgb : v_col;
      gl_FragColor = vec4(base * ndl, 1.0);
    }
  `);
  const prog = program(gl, vs, fs);
  return {
    prog,
    attribs: {
      a_pos: gl.getAttribLocation(prog, 'a_pos'),
      a_norm: gl.getAttribLocation(prog, 'a_norm'),
      a_col: gl.getAttribLocation(prog, 'a_col'),
      a_uv: gl.getAttribLocation(prog, 'a_uv'),
    },
    uniforms: {
      u_proj: gl.getUniformLocation(prog, 'u_proj'),
      u_view: gl.getUniformLocation(prog, 'u_view'),
      u_tex: gl.getUniformLocation(prog, 'u_tex'),
      u_useTex: gl.getUniformLocation(prog, 'u_useTex'),
      u_lightDir: gl.getUniformLocation(prog, 'u_lightDir'),
      u_ambient: gl.getUniformLocation(prog, 'u_ambient'),
    }
  };
}

export function createSkyProgram(gl){
  const vs = compile(gl, gl.VERTEX_SHADER, `
    attribute vec2 a_pos;
    uniform vec2 u_center;
    uniform float u_scale;
    void main(){
      vec2 p = a_pos*u_scale + u_center;
      gl_Position = vec4(p, 0.0, 1.0);
    }
  `);
  const fs = compile(gl, gl.FRAGMENT_SHADER, `
    precision mediump float;
    uniform vec3 u_color;
    void main(){ gl_FragColor = vec4(u_color, 1.0); }
  `);
  const prog = program(gl, vs, fs);
  return {
    prog,
    attribs: { a_pos: gl.getAttribLocation(prog, 'a_pos') },
    uniforms: { u_center: gl.getUniformLocation(prog,'u_center'), u_scale: gl.getUniformLocation(prog,'u_scale'), u_color: gl.getUniformLocation(prog,'u_color') }
  };
}
