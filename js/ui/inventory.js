// inventory.js — Simple inventory UI and keybind (I) to toggle.

import { ITEM_NAME } from '../items/items.js';

export class InventoryUI {
  constructor(player) {
    this.player = player;
    this.root = document.createElement('div');
    this.root.id = 'inventory-panel';
    this.root.innerHTML = `
      <div class="panel">
        <h3>Inventory</h3>
        <div id="inventory-grid"></div>
      </div>`;
    document.getElementById('app')?.appendChild(this.root);
    this.grid = this.root.querySelector('#inventory-grid');

    window.addEventListener('keydown', (e)=>{
      if (e.key.toLowerCase()==='i') this.toggle();
    });

    this.render();
  }

  toggle(){ this.root.classList.toggle('visible'); }

  render(){
    this.grid.innerHTML = '';
    const entries = Array.from(this.player.inventory.entries());
    for (const [id, count] of entries) {
      if (!count) continue;
      const slot = document.createElement('div');
      slot.className = 'inv-slot';
      slot.textContent = ITEM_NAME[id] || String(id);
      const cnt = document.createElement('div'); cnt.className = 'inv-count'; cnt.textContent = String(count); slot.appendChild(cnt);
      this.grid.appendChild(slot);
    }
  }

  onInventoryChange(){ this.render(); }
}
