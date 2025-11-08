# Resin — Web Minecraft Client (Prototype)

This repository contains a static, modular HTML/CSS/JS prototype for a browser-based voxel sandbox called “Resin.” It includes:

- Menu overlay and a minimal playable 2D tile world (flat terrain)
- Input (WASD camera, Q/E zoom, 1–3 block selection, click place, Shift+Click remove)
- HUD with block palette and live debug bar
- Anti-tamper: disables right-click, blocks common DevTools shortcuts, detects docked DevTools and pauses
- A minimal Java-to-JS call translator shim to map Minecraft-like qualified calls to JS functions
- Optional telemetry: batch + backoff to a remote endpoint (tree-shakeable, opt-in via query params or window config)
- 3D prototype: WebGL voxel renderer, first-person camera, basic physics, chunk streaming

Scope and limitations
- This is a 2D prototype implementing a subset of functionality to demonstrate architecture, module structure, and gameplay loop.
- A full Minecraft Java client in the browser is out of scope here. Running Java bytecode/classfiles requires a transpilation toolchain (e.g., TeaVM, J2CL) and deep protocol/engine work that can’t be delivered as a small static site.
- “Disable inspect element” cannot be fully guaranteed on the web. The included anti-tamper is best-effort to deter casual use.

How to run
- Serve the folder over HTTP (ES modules require a server).
  - python -m http.server 8000
  - Then open http://localhost:8000/
- Or use any lightweight static server.

3D mode
- Click Play 3D in the menu. Click the canvas to lock the mouse. WASD to move, Space to jump.

Project layout
- index.html — canvas, overlays, module entry
- css/resin.css — base styles, menu, HUD
- js/main.js — entry point; installs anti-tamper and bootstraps
- js/core/* — logger, event bus
- js/platform/security/antiTamper.js — right-click/shortcut guards, devtools detection
- js/platform/javaTranslator/* — translator, global Java shim, API expansion
- js/telemetry/* — config discovery and telemetry client (batching + backoff)
- js/engine/renderer/surface2d.js — DPR-aware 2D surface
- js/engine/renderer/worldRenderer.js — 2D tile renderer
- js/engine/world/* — 2D blocks, chunk, world
- js/engine/input/inputManager.js — 2D keyboard/mouse handling
- js/engine/render3d/* — WebGL support, camera, shaders, mesh builder, 3D renderer
- js/engine/world3d/* — 3D blocks, chunk, world, generator
- js/engine/physics/physics.js — AABB collisions + gravity
- js/entities/* — entity base and player
- js/game/* — bootstrap (2D and 3D), state manager, menu, game loop
- js/platform/net/client.js — protocol client adapter skeleton (offline)
- js/ui/{hud.js,options.js} — HUD, options

Java call translation (shim)
The translator exposes a mapping table from qualified names to JS functions. Example:

- translator.register('net.minecraft.client.Minecraft', 'startGame', () => state.enter(STATE.PLAY))
- Java.net.minecraft.client.Minecraft.startGame() → invokes the mapping
- In 3D mode, additional mappings exist for Player/Camera/World (see platform/javaTranslator/apiExpansion.js)

Controls
- 2D: Play 2D → WASD pan, Q/E or Wheel zoom, 1/2/3 select Grass/Dirt/Stone, Click place, Shift+Click remove
- 3D: Play 3D → Click canvas to lock mouse, look with mouse, WASD move, Space jump

Telemetry
- Opt-in via query params: add ?telemetry=https://your-endpoint/ingest&key={{TELEMETRY_KEY}}
- Or set window.RESIN_TELEMETRY = { endpoint: 'https://...', apiKey: '...' } before loading main.js

Limitations
- This is still a prototype. A complete Minecraft Java client, all blocks, tools, armor, mobs, redstone, full protocol, etc., are not implemented here.
- Disabling developer tools is not fully possible on the web (best-effort guards included).
- Resource pack support is minimal (JSON manifest + optional images), not full MC packs.
