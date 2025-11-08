// resourcePack.js — Load resource packs (textures/defs). Fallback to color.
// This is a minimal loader; full Minecraft packs are out of scope.

export class ResourcePack {
  constructor() { this.textures = new Map(); this.defs = {}; }

  /** @param {string} url base URL of a pack.json describing assets */
  async load(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('pack fetch failed');
      const pack = await res.json();
      this.defs = pack;
      // Optionally load textures listed in pack.textures
      if (Array.isArray(pack.textures)) {
        await Promise.all(pack.textures.map(async (t) => {
          const img = new Image(); img.crossOrigin = 'anonymous'; img.decoding = 'async';
          const p = new Promise((ok,err)=>{ img.onload=()=>ok(true); img.onerror=err; });
          img.src = new URL(t.url, url).toString();
          await p; this.textures.set(t.name, img);
        }));
      }
      return true;
    } catch {
      return false;
    }
  }
}
