// worldRenderer.js — Renders 2D tile world to the Surface2D.
// Handles camera, culling, and tile drawing.

import { BLOCK, BLOCK_COLORS } from '../world/block.js';

export class WorldRenderer2D {
  /** @param {import('./surface2d.js').Surface2D} surface @param {import('../world/world.js').World2D} world */
  constructor(surface, world) {
    this.surface = surface; this.world = world;
    this.tileSize = 16; // base pixels per tile at zoom=1
  }

  /** Draw visible tiles based on camera and zoom */
  render() {
    const { surface: s, world: w } = this;
    s.clear('#0b0b0e');
    const { ctx, canvas } = s;

    const scale = Math.max(0.25, Math.min(4, w.zoom));
    const ts = Math.floor(this.tileSize * scale);

    // Compute visible bounds in world tile coords
    const tilesX = Math.ceil(canvas.width / ts) + 2;
    const tilesY = Math.ceil(canvas.height / ts) + 2;
    const startX = Math.max(0, Math.floor(w.camX));
    const startY = Math.max(0, Math.floor(w.camY));
    const endX = Math.min(w.width, startX + tilesX);
    const endY = Math.min(w.height, startY + tilesY);

    const offsetX = -((w.camX % 1) * ts);
    const offsetY = -((w.camY % 1) * ts);

    ctx.save();
    ctx.translate(offsetX, offsetY);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const id = w.getBlock(x, y);
        if (id === BLOCK.AIR) continue;
        ctx.fillStyle = BLOCK_COLORS[id] || '#ff00ff';
        ctx.fillRect((x - startX) * ts, (y - startY) * ts, ts, ts);
      }
    }

    ctx.restore();
  }
}
