// gl.js — WebGL context creation and capability setup.

export function createGL(canvas) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
  if (!gl) throw new Error('WebGL not supported');
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  gl.clearColor(0.05, 0.05, 0.07, 1);
  return gl;
}
