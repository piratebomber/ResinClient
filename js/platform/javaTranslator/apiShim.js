// apiShim.js — Convenience layer exposing Minecraft-like classes to the window.
// This allows scripts (or console examples) to call e.g. Java.net.minecraft.client.Minecraft.startGame()
// and have it routed into the translator mappings.

import { translator } from './translator.js';

const Java = {
  net: {
    minecraft: {
      client: {
        Minecraft: {
          startGame() { return translator.invoke('net.minecraft.client.Minecraft', 'startGame'); },
          pause() { return translator.invoke('net.minecraft.client.Minecraft', 'pause'); },
          resume() { return translator.invoke('net.minecraft.client.Minecraft', 'resume'); },
        },
      },
    },
  },
};

// Expose as a non-configurable global (still discoverable in DevTools)
Object.defineProperty(window, 'Java', { value: Java, writable: false, configurable: false });

export { Java };
