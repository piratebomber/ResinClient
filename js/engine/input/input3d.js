// input3d.js — Pointer lock mouse look and WASD keys for 3D.

export class Input3D {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.locked = false;

    this._onKey = this._onKey.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onPointerLockChange = this._onPointerLockChange.bind(this);

    window.addEventListener('keydown', this._onKey, true);
    window.addEventListener('keyup', this._onKey, true);
    document.addEventListener('pointerlockchange', this._onPointerLockChange);
    canvas.addEventListener('click', () => this.requestLock());

    // Mouse buttons
    this._onMouseDown = (e)=>{ if(!this.locked) return; document.dispatchEvent(new CustomEvent('resin:mouseDown',{detail:{button:e.button, shift:e.shiftKey}})); };
    this._onMouseUp   = (e)=>{ if(!this.locked) return; document.dispatchEvent(new CustomEvent('resin:mouseUp',{detail:{button:e.button, shift:e.shiftKey}})); };
    window.addEventListener('mousedown', this._onMouseDown, true);
    window.addEventListener('mouseup', this._onMouseUp, true);
  }

  destroy(){
    window.removeEventListener('keydown', this._onKey, true);
    window.removeEventListener('keyup', this._onKey, true);
    document.removeEventListener('pointerlockchange', this._onPointerLockChange);
    window.removeEventListener('mousedown', this._onMouseDown, true);
    window.removeEventListener('mouseup', this._onMouseUp, true);
  }

  requestLock(){ if (!this.locked) this.canvas.requestPointerLock?.(); }
  exitLock(){ if (this.locked) document.exitPointerLock?.(); }

  _onPointerLockChange(){ this.locked = document.pointerLockElement === this.canvas; }

  _onKey(e){
    const k=e.key.toLowerCase();
    if(e.type==='keydown') this.keys.add(k); else this.keys.delete(k);
    // Hotbar 1..9 selection
    if (e.type==='keydown' && /^[1-9]$/.test(e.key)) {
      document.dispatchEvent(new CustomEvent('resin:hotbar',{detail:{slot:Number(e.key)}}));
    }
  }

  _onMouseMove(e){ if (!this.locked) return; const dx=e.movementX, dy=e.movementY; document.dispatchEvent(new CustomEvent('resin:look',{detail:{dx,dy}})); }

  hookMouse(){
    this.canvas.addEventListener('mousemove', this._onMouseMove);
  }
}
