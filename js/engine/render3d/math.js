// math.js — Minimal vec3/mat4 helpers for camera and transforms.

export const EPS = 1e-6;

export function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

export function vec3(x=0,y=0,z=0){return new Float32Array([x,y,z]);}
export function add3(a,b){return new Float32Array([a[0]+b[0],a[1]+b[1],a[2]+b[2]]);} 
export function sub3(a,b){return new Float32Array([a[0]-b[0],a[1]-b[1],a[2]-b[2]]);} 
export function scale3(a,s){return new Float32Array([a[0]*s,a[1]*s,a[2]*s]);}
export function dot3(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
export function len3(a){return Math.hypot(a[0],a[1],a[2]);}
export function norm3(a){const l=len3(a)||1;return new Float32Array([a[0]/l,a[1]/l,a[2]/l]);}

export function mat4(){const m=new Float32Array(16);m[0]=m[5]=m[10]=m[15]=1;return m;}
export function mul4(a,b){const o=new Float32Array(16);for(let i=0;i<4;i++){for(let j=0;j<4;j++){o[i*4+j]=a[i*4+0]*b[0*4+j]+a[i*4+1]*b[1*4+j]+a[i*4+2]*b[2*4+j]+a[i*4+3]*b[3*4+j];}}return o;}
export function perspective(fovy,aspect,near,far){const f=1/Math.tan(fovy/2);const m=new Float32Array(16);m[0]=f/aspect;m[5]=f;m[10]=(far+near)/(near-far);m[11]=-1;m[14]=(2*far*near)/(near-far);return m;}
export function translate(m,v){const o=m.slice(0);o[12]+=v[0];o[13]+=v[1];o[14]+=v[2];return o;}
export function rotY(m,a){const c=Math.cos(a),s=Math.sin(a);const r=new Float32Array([c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]);return mul4(m,r);} 
export function rotX(m,a){const c=Math.cos(a),s=Math.sin(a);const r=new Float32Array([1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]);return mul4(m,r);} 

export function lookFrom(pos,yaw,pitch){
  // Build view matrix from yaw/pitch and position
  let m=mat4();
  m=rotY(m,yaw); m=rotX(m,pitch);
  m=translate(m, new Float32Array([-pos[0],-pos[1],-pos[2]]));
  return m;
}
