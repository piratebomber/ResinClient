// hud3d.js — Crosshair and hotbar UI for 3D mode.

import { ITEM, ITEM_NAME, itemToBlock } from '../items/items.js';

export class HUD3D {
  constructor(player, textures=null) {
    this.player = player;
    this.root = document.createElement('div');
    this.root.id = 'hud3d';
    this.root.innerHTML = `
      <div id="crosshair"></div>
      <div id="hotbar"></div>
    `;
    document.getElementById('app')?.appendChild(this.root);

    this.hotbarEl = this.root.querySelector('#hotbar');
    this.slots = [];
    this.textures = textures; // Map<string,HTMLImageElement>
    for (let i=0;i<9;i++){ const slot=document.createElement('div'); slot.className='hotbar-slot'; slot.innerHTML=`<img class="icon" alt=""/><span class="hotbar-count"></span>`; this.hotbarEl.appendChild(slot); this.slots.push(slot); }

    window.addEventListener('keydown', (e)=>{ if (/^[1-9]$/.test(e.key)) this.updateSelection(Number(e.key)); }, true);
    this.renderHotbar();
  }

  updateSelection(slot){
    this.slots.forEach((el, idx)=> el.classList.toggle('selected', (idx+1)===this.player.selected));
  }

  renderHotbar(){
    for (let i=0;i<9;i++){
      const itemId = this.player.hotbar[i]||0;
      const el = this.slots[i];
      el.title = ITEM_NAME[itemId] || '';
      // icon
      const img = el.querySelector('img.icon');
      const key = itemTextureKey(itemId);
      const src = key && this.textures && this.textures.get(key) ? this.textures.get(key).src : '';
      if (src) { img.src = src; img.style.display = 'block'; } else { img.style.display = 'none'; }
      // count
      const count = this.player.getItemCount(itemId);
      el.querySelector('.hotbar-count').textContent = count>0? String(count): '';
    }
    this.updateSelection(this.player.selected);
  }

  onInventoryChange(){ this.renderHotbar(); }
  setTextures(textures){ this.textures = textures; this.renderHotbar(); }
}

function itemTextureKey(itemId){
  // Map item IDs to resource pack keys
  switch(itemId){
    case ITEM.PICK_WOOD: return 'item/wooden_pickaxe.png';
    case ITEM.PICK_STONE: return 'item/stone_pickaxe.png';
    case ITEM.PICK_IRON: return 'item/iron_pickaxe.png';
    case ITEM.SWORD_WOOD: return 'item/wooden_sword.png';
    case ITEM.BLOCK_DIRT: return 'block/dirt.png';
    case ITEM.BLOCK_STONE: return 'block/stone.png';
    case ITEM.BLOCK_PLANKS: return 'block/planks.png';
    case ITEM.BLOCK_LOG: return 'block/log.png';
    case ITEM.BLOCK_LEAVES: return 'block/leaves.png';
    case 200: return 'item/coal.png';
    case 201: return 'item/raw_iron.png';
    case 202: return 'item/raw_gold.png';
    case 203: return 'item/diamond.png';
    default: return null;
  }
}
