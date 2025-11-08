// hud.js — HUD overlay for debug info and block palette.

import { BLOCK, BLOCK_COLORS, BLOCK_NAMES } from '../engine/world/block.js';

export class HUD {
  constructor() {
    this.el = document.getElementById('hud-overlay');
    this.selected = BLOCK.GRASS;
    this._build();
  }

  _build() {
    if (!this.el) return;
    const top = document.createElement('div'); top.id = 'hud-top'; top.className = 'bar';
    this.debug = document.createElement('div'); this.debug.id = 'hud-debug';
    top.appendChild(this.debug);

    const bottom = document.createElement('div'); bottom.id = 'hud-bottom'; bottom.className = 'bar';
    const palette = document.createElement('div'); palette.className = 'block-palette';
    const blocks = [BLOCK.GRASS, BLOCK.DIRT, BLOCK.STONE];
    this.paletteItems = new Map();
    for (const id of blocks) {
      const sw = document.createElement('div');
      sw.className = 'block'; sw.title = `${BLOCK_NAMES[id]} (key ${blocks.indexOf(id)+1})`;
      sw.style.background = BLOCK_COLORS[id];
      if (id === this.selected) sw.classList.add('selected');
      sw.addEventListener('click', () => this.select(id));
      this.paletteItems.set(id, sw);
      palette.appendChild(sw);
    }
    bottom.appendChild(palette);

    this.el.append(top, bottom);
  }

  /** @param {number} id */
  select(id) {
    const prev = this.paletteItems.get(this.selected); prev?.classList.remove('selected');
    this.selected = id;
    const next = this.paletteItems.get(this.selected); next?.classList.add('selected');
  }

  updateDebug(info) {
    if (!this.debug) return;
    this.debug.textContent = `Cam: ${info.camX.toFixed(1)}, ${info.camY.toFixed(1)} | Zoom: ${info.zoom.toFixed(2)} | Tile: ${info.tileX},${info.tileY} | Block: ${BLOCK_NAMES[info.block]}`;
  }
}
