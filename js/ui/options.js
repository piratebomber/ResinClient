// options.js — Minimal settings UI with persistence.

export class OptionsUI {
  constructor() {
    this.root = document.createElement('div');
    this.root.className = 'overlay visible';
    this.root.innerHTML = `
      <div class="panel" style="position:absolute;top:10px;right:10px;max-width:340px">
        <h2>Options</h2>
        <label>FOV <input id="opt-fov" type="range" min="60" max="110" value="70"></label>
        <label>Mouse sensitivity <input id="opt-sens" type="range" min="1" max="10" value="3"></label>
        <label>Resource pack URL <input id="opt-pack" type="text" placeholder="https://.../pack.json"></label>
        <div style="margin-top:8px;display:flex;gap:8px;justify-content:flex-end">
          <button id="opt-save" class="primary">Save</button>
          <button id="opt-close">Close</button>
        </div>
      </div>`;
  }

  open(initial, onSave) {
    // Load from persistence
    const store = JSON.parse(localStorage.getItem('resin:options')||'{}');
    const opts = { ...initial, ...store };
    document.body.appendChild(this.root);
    const fov = this.root.querySelector('#opt-fov'); fov.value = Math.round((opts.fov||70));
    const sens = this.root.querySelector('#opt-sens'); sens.value = Math.round((opts.sens||2.5)*2);
    const pack = this.root.querySelector('#opt-pack'); pack.value = opts.pack||'';
    this.root.querySelector('#opt-save').addEventListener('click', ()=>{
      const o = { fov: Number(fov.value), sens: Number(sens.value)/2, pack: String(pack.value) };
      localStorage.setItem('resin:options', JSON.stringify(o));
      onSave?.(o);
      this.close();
    });
    this.root.querySelector('#opt-close').addEventListener('click', ()=>this.close());
  }
  close(){ this.root.remove(); }
}
