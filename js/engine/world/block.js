// block.js — Block definitions for the 2D prototype.
// In a full 3D client, each block would include mesh/texture data, occlusion, etc.

export const BLOCK = /** @type {const} */ ({
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
});

export const BLOCK_NAMES = {
  [BLOCK.AIR]: 'Air',
  [BLOCK.GRASS]: 'Grass',
  [BLOCK.DIRT]: 'Dirt',
  [BLOCK.STONE]: 'Stone',
};

// Simple color map for 2D tiles
export const BLOCK_COLORS = {
  [BLOCK.AIR]: 'rgba(0,0,0,0)',
  [BLOCK.GRASS]: '#4caf50',
  [BLOCK.DIRT]: '#6d4c41',
  [BLOCK.STONE]: '#9e9e9e',
};
