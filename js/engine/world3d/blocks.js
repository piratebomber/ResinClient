// blocks.js — 3D block registry with basic properties.

export const B = /** @type {const} */ ({
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  SAND: 4,
  WATER: 5,
  LOG: 6,
  LEAVES: 7,
  PLANKS: 8,
  COAL_ORE: 9,
  IRON_ORE: 10,
  GOLD_ORE: 11,
  DIAMOND_ORE: 12,
});

export const BLOCK_PROPS = {
  [B.AIR]:    { name: 'Air',    opaque: false, solid: false, color: [0,0,0],   hardness: 0 },
  [B.GRASS]:  { name: 'Grass',  opaque: true,  solid: true,  color: [0.3, 0.8, 0.3], hardness: 0.6 },
  [B.DIRT]:   { name: 'Dirt',   opaque: true,  solid: true,  color: [0.42, 0.32, 0.26], hardness: 0.5 },
  [B.STONE]:  { name: 'Stone',  opaque: true,  solid: true,  color: [0.6, 0.6, 0.6], hardness: 1.5 },
  [B.SAND]:   { name: 'Sand',   opaque: true,  solid: true,  color: [0.95, 0.90, 0.65], hardness: 0.5 },
  [B.WATER]:  { name: 'Water',  opaque: false, solid: false, color: [0.2, 0.4, 0.9], hardness: 1000 },
  [B.LOG]:    { name: 'Log',    opaque: true,  solid: true,  color: [0.45, 0.35, 0.24], hardness: 2.0 },
  [B.LEAVES]: { name: 'Leaves', opaque: false, solid: true,  color: [0.25, 0.7, 0.25], hardness: 0.2 },
  [B.PLANKS]: { name: 'Planks', opaque: true,  solid: true,  color: [0.7, 0.56, 0.4], hardness: 1.5 },
  [B.COAL_ORE]:    { name: 'Coal Ore',    opaque: true, solid: true, color: [0.2,0.2,0.2], hardness: 3.0 },
  [B.IRON_ORE]:    { name: 'Iron Ore',    opaque: true, solid: true, color: [0.7,0.55,0.4], hardness: 3.0 },
  [B.GOLD_ORE]:    { name: 'Gold Ore',    opaque: true, solid: true, color: [0.9,0.8,0.3], hardness: 3.0 },
  [B.DIAMOND_ORE]: { name: 'Diamond Ore', opaque: true, solid: true, color: [0.3,0.9,0.9], hardness: 3.0 },
};
