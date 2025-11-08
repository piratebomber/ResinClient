// world.js — 2D tile world with simple flat generator.
// The API mirrors a small subset of a voxel world interface.

import { Chunk2D } from './chunk.js';
import { BLOCK } from './block.js';

export class World2D {
  /**
   * @param {number} chunkSize tiles per chunk (e.g., 16)
   * @param {number} chunksX number of chunks horizontally
   * @param {number} chunksY number of chunks vertically
   */
  constructor(chunkSize = 16, chunksX = 32, chunksY = 16) {
    this.chunkSize = chunkSize;
    this.chunksX = chunksX; this.chunksY = chunksY;
    this.width = chunkSize * chunksX; // total tiles
    this.height = chunkSize * chunksY;
    this.chunks = new Map(); // key: `${cx},${cy}` -> Chunk2D

    // Camera state (tile-space origin and zoom)
    this.camX = Math.floor(this.width / 2) - 8;
    this.camY = Math.floor(this.height / 2) - 8;
    this.zoom = 1; // 1.0 == 16px tiles (see renderer)

    this._initWorld();
  }

  _key(cx, cy) { return `${cx},${cy}`; }

  _getOrCreateChunk(cx, cy) {
    const k = this._key(cx, cy);
    let c = this.chunks.get(k);
    if (!c) { c = new Chunk2D(cx, cy, this.chunkSize); this.chunks.set(k, c); }
    return c;
  }

  /** Populate with a simple flat terrain: stone base, dirt middle, grass top */
  _initWorld() {
    const groundLevel = Math.floor(this.height * 0.6);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const id = y > groundLevel + 3 ? BLOCK.STONE
          : y > groundLevel ? BLOCK.DIRT
          : y === groundLevel ? BLOCK.GRASS
          : BLOCK.AIR;
        this.setBlock(x, y, id);
      }
    }
  }

  /** @param {number} x @param {number} y @returns {number} */
  getBlock(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return BLOCK.AIR;
    const cx = Math.floor(x / this.chunkSize);
    const cy = Math.floor(y / this.chunkSize);
    const c = this._getOrCreateChunk(cx, cy);
    const lx = x % this.chunkSize; const ly = y % this.chunkSize;
    return c.get(lx, ly);
  }

  /** @param {number} x @param {number} y @param {number} id */
  setBlock(x, y, id) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const cx = Math.floor(x / this.chunkSize);
    const cy = Math.floor(y / this.chunkSize);
    const c = this._getOrCreateChunk(cx, cy);
    const lx = x % this.chunkSize; const ly = y % this.chunkSize;
    c.set(lx, ly, id);
  }
}
