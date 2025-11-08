// bootstrap.js — Wires up Resin subsystems, menu, HUD, loop.
// This is the orchestrator for the 2D prototype.

import { logger } from '../core/logger.js';
import { Surface2D } from '../engine/renderer/surface2d.js';
import { World2D } from '../engine/world/world.js';
import { WorldRenderer2D } from '../engine/renderer/worldRenderer.js';
import { InputManager } from '../engine/input/inputManager.js';
import { HUD } from '../ui/hud.js';
import { StateManager, STATE } from './stateManager.js';
import { GameLoop } from './gameLoop.js';
import { translator } from '../platform/javaTranslator/translator.js';
import '../platform/javaTranslator/apiShim.js';
import { MenuUI } from './menu.js';

/** Global singletons for the prototype */
let surface, world, renderer, input, hud, state, loop;

export function bootstrap() {
  const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('resin-canvas'));
  if (!canvas) throw new Error('Canvas not found');

  logger.info('Bootstrapping Resin');

  // Systems
  surface = new Surface2D(canvas);
  world = new World2D();
  renderer = new WorldRenderer2D(surface, world);
  input = new InputManager(canvas);
  hud = new HUD();
  state = new StateManager();

  // Hook translator routes (Java -> JS)
  translator.register('net.minecraft.client.Minecraft', 'startGame', () => state.enter(STATE.PLAY));
  translator.register('net.minecraft.client.Minecraft', 'pause',     () => document.dispatchEvent(new CustomEvent('resin:pause')));
  translator.register('net.minecraft.client.Minecraft', 'resume',    () => document.dispatchEvent(new CustomEvent('resin:resume')));

  // Menu
  const menu = new MenuUI(state);
  menu.show();

  // Game runner
  loop = new GameLoop({
    update: (dt) => update(dt),
    render: () => render(),
  });

  // Pause/resume wiring
  state.onChange(s => { if (s === STATE.PLAY) loop.start(); });
  document.addEventListener('resin:pause', () => {});
  document.addEventListener('resin:resume', () => {});

  // Input routing
  setupInputHandlers(canvas);
}

function setupInputHandlers(canvas) {
  // Mouse position -> tile coordinate mapping
  document.addEventListener('resin:mousemove', (e) => {
    const detail = /** @type {{x:number,y:number,shift:boolean}} */ (e.detail);
    const scale = Math.max(0.25, Math.min(4, world.zoom));
    const ts = Math.floor(16 * scale);

    // Camera origin is in tile space; convert pixels to tile offsets
    const tileX = Math.floor(world.camX + detail.x / ts);
    const tileY = Math.floor(world.camY + detail.y / ts);

    const block = world.getBlock(tileX, tileY);
    hud.updateDebug({ camX: world.camX, camY: world.camY, zoom: world.zoom, tileX, tileY, block });
  });

  // Place / remove tiles
  document.addEventListener('resin:mousedown', (e) => {
    const { button, shift, x, y } = /** @type {{button:number, shift:boolean, x:number, y:number}} */ (e.detail);
    if (button !== 0) return; // right click is disabled by antiTamper

    const scale = Math.max(0.25, Math.min(4, world.zoom));
    const ts = Math.floor(16 * scale);
    const tileX = Math.floor(world.camX + x / ts);
    const tileY = Math.floor(world.camY + y / ts);

    world.setBlock(tileX, tileY, shift ? 0 : hud.selected);
  });

  // Zoom via wheel, Q/E keys via keyboard polling in update
  document.addEventListener('resin:wheel', (e) => {
    const { deltaY } = /** @type {{deltaY:number}} */ (e.detail);
    const z = world.zoom + (deltaY > 0 ? -0.1 : 0.1);
    world.zoom = Math.max(0.25, Math.min(4, z));
  });

  // Numeric keys 1..9 to select block
  window.addEventListener('keydown', (e) => {
    const k = e.key;
    if (/^[1-9]$/.test(k)) {
      const n = Number(k);
      const map = [null, 1, 2, 3];
      const id = map[n];
      if (id != null) hud.select(id);
    }
  }, true);
}

function update(dt) {
  // Camera movement
  const { dx, dy } = input.pollMove(dt);
  world.camX = Math.max(0, Math.min(world.width - 1, world.camX + dx));
  world.camY = Math.max(0, Math.min(world.height - 1, world.camY + dy));

  // Optional keyboard zoom: Q/E
  if (input.keys.has('q')) world.zoom = Math.max(0.25, world.zoom - 0.5 * dt);
  if (input.keys.has('e')) world.zoom = Math.min(4, world.zoom + 0.5 * dt);
}

function render() {
  renderer.render();
}
