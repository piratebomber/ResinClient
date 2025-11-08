// items.js — Simple items and tools with mining efficiencies and block mapping.

import { B } from '../engine/world3d/blocks.js';

export const ITEM = /** @type {const} */ ({
  HAND: 0,
  PICK_WOOD: 1,
  PICK_STONE: 2,
  PICK_IRON: 3,
  SWORD_WOOD: 4,
  BLOCK_DIRT: 100,
  BLOCK_STONE: 101,
  BLOCK_PLANKS: 102,
  BLOCK_LOG: 103,
  BLOCK_LEAVES: 104,
  ORE_COAL: 200,
  ORE_IRON: 201,
  ORE_GOLD: 202,
  GEM_DIAMOND: 203,
});

export const ITEM_NAME = {
  [ITEM.HAND]: 'Hand',
  [ITEM.PICK_WOOD]: 'Wooden Pickaxe',
  [ITEM.PICK_STONE]: 'Stone Pickaxe',
  [ITEM.PICK_IRON]: 'Iron Pickaxe',
  [ITEM.SWORD_WOOD]: 'Wooden Sword',
  [ITEM.BLOCK_DIRT]: 'Dirt',
  [ITEM.BLOCK_STONE]: 'Stone',
  [ITEM.BLOCK_PLANKS]: 'Planks',
  [ITEM.BLOCK_LOG]: 'Log',
  [ITEM.BLOCK_LEAVES]: 'Leaves',
  [ITEM.ORE_COAL]: 'Coal',
  [ITEM.ORE_IRON]: 'Raw Iron',
  [ITEM.ORE_GOLD]: 'Raw Gold',
  [ITEM.GEM_DIAMOND]: 'Diamond',
};

// Mining speed multiplier per item
export const MINE_SPEED = {
  [ITEM.HAND]: 1.0,
  [ITEM.PICK_WOOD]: 2.0,
  [ITEM.PICK_STONE]: 4.0,
  [ITEM.PICK_IRON]: 6.0,
  [ITEM.SWORD_WOOD]: 0.5,
};

export function canMine(blockId, tool){
  // Tool gating for ores; other blocks always allowed
  switch(blockId){
    case B.COAL_ORE: return tool===ITEM.PICK_WOOD || tool===ITEM.PICK_STONE || tool===ITEM.PICK_IRON;
    case B.IRON_ORE: return tool===ITEM.PICK_STONE || tool===ITEM.PICK_IRON;
    case B.GOLD_ORE: return tool===ITEM.PICK_IRON;
    case B.DIAMOND_ORE: return tool===ITEM.PICK_IRON;
    default: return true;
  }
}

export function itemToBlock(item){
  switch(item){
    case ITEM.BLOCK_DIRT: return B.DIRT;
    case ITEM.BLOCK_STONE: return B.STONE;
    case ITEM.BLOCK_PLANKS: return B.PLANKS;
    case ITEM.BLOCK_LOG: return B.LOG;
    case ITEM.BLOCK_LEAVES: return B.LEAVES;
    default: return null;
  }
}

export function blockToItem(blockId){
  switch(blockId){
    case B.DIRT: return ITEM.BLOCK_DIRT;
    case B.STONE: return ITEM.BLOCK_STONE;
    case B.PLANKS: return ITEM.BLOCK_PLANKS;
    case B.LOG: return ITEM.BLOCK_LOG;
    case B.LEAVES: return ITEM.BLOCK_LEAVES;
    case B.COAL_ORE: return ITEM.ORE_COAL;
    case B.IRON_ORE: return ITEM.ORE_IRON;
    case B.GOLD_ORE: return ITEM.ORE_GOLD;
    case B.DIAMOND_ORE: return ITEM.GEM_DIAMOND;
    default: return null;
  }
}
