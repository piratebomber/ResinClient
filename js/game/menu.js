// menu.js — Builds and manages the main menu UI overlay.

import { STATE } from './stateManager.js';

export class MenuUI {
  /** @param {import('./stateManager.js').StateManager} state */
  constructor(state) {
    this.state = state;
    this.el = document.getElementById('menu-overlay');
    this.btnPlay = document.getElementById('btn-play');
    this.btnPlay3D = document.getElementById('btn-play-3d');
    this.btnOptions = document.getElementById('btn-options');
    this.btnPlay?.addEventListener('click', () => this.start('2d'));
    this.btnPlay3D?.addEventListener('click', () => this.start('3d'));
    this.btnOptions?.addEventListener('click', () => this.openOptions());
  }

  show() { this.el?.classList.add('visible'); }
  hide() { this.el?.classList.remove('visible'); }

  openOptions(){
    import('../ui/options.js').then(({ OptionsUI }) => {
      const ui = new OptionsUI();
      const initial = {};
      ui.open(initial, (o)=>{
        // Broadcast settings change; 3D bootstrap listens and applies to camera
        document.dispatchEvent(new CustomEvent('resin:options', { detail: o }));
      });
    });
  }

  start(mode='2d') {
    const canvas = document.getElementById('resin-canvas');
    if (mode === '3d') {
      import('./bootstrap3d.js').then(m=>m.start3D());
    }
    this.state.enter(STATE.PLAY);
    this.hide();
    canvas?.focus();
  }
}
