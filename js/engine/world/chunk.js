// chunk.js — 2D chunk to spatially partition the tile world.
// This mirrors typical 16x16 chunking to enable culling and future streaming.

export class Chunk2D {
  /**
   * @param {number} cx chunk x index
   * @param {number} cy chunk y index
   * @param {number} size chunk side length in tiles (e.g., 16)
   */
  constructor(cx, cy, size) {
    this.cx = cx; this.cy = cy; this.size = size;
    this.tiles = new Uint16Array(size * size); // small block id space
    this.dirty = true;
  }

  /** @param {number} x local [0,size) @param {number} y local [0,size) */
  get(x, y) { return this.tiles[y * this.size + x]; }
  /** @param {number} x @param {number} y @param {number} id */
  set(x, y, id) { this.tiles[y * this.size + x] = id; this.dirty = true; }
}
