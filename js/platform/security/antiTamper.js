// antiTamper.js — Best-effort UX guard. Not bulletproof.
//
// Goals:
// - Disable context menu and drag behaviors.
// - Block common DevTools shortcuts.
// - Detect DevTools via viewport deltas and react (pause game + overlay message).
//
// Important: On the web, preventing DevTools is not truly possible. This module
// only deters casual inspection and accidental interruption.

import { logger } from '../../core/logger.js';

let installed = false;

export function installAntiTamper() {
  if (installed) return; installed = true;
  logger.info('Installing anti-tamper guards');

  // 1) Disable context menu globally
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
  }, { capture: true });

  // 2) Block common shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S)
  window.addEventListener('keydown', (e) => {
    const key = e.key?.toLowerCase();
    const ctrl = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;

    if (
      key === 'f12' ||
      (ctrl && shift && (key === 'i' || key === 'j' || key === 'c')) ||
      (ctrl && (key === 'u' || key === 's'))
    ) {
      e.preventDefault(); e.stopPropagation();
      return false;
    }
  }, { capture: true });

  // 3) Basic DevTools detection via size heuristics
  let devtoolsOpen = false;
  const check = () => {
    const threshold = 160; // px, typical docked devtools min dimension
    const widthDiff = Math.abs(window.outerWidth - window.innerWidth);
    const heightDiff = Math.abs(window.outerHeight - window.innerHeight);
    const open = widthDiff > threshold || heightDiff > threshold;
    if (open !== devtoolsOpen) {
      devtoolsOpen = open;
      onDevToolsToggle(open);
    }
  };
  const interval = setInterval(check, 1000);
  window.addEventListener('beforeunload', () => clearInterval(interval));
}

function onDevToolsToggle(open) {
  logger.warn('DevTools state changed', { open });
  const hud = document.getElementById('hud-overlay');
  if (!hud) return;
  let bar = document.getElementById('hud-devtools');
  if (open) {
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'hud-devtools';
      bar.className = 'bar';
      bar.style.background = 'rgba(255,0,0,0.25)';
      bar.textContent = 'Developer tools detected. Gameplay paused.';
      const top = document.createElement('div');
      top.id = 'hud-top';
      top.appendChild(bar);
      hud.prepend(top);
    }
    document.dispatchEvent(new CustomEvent('resin:pause', { detail: { reason: 'devtools' } }));
  } else if (bar && bar.parentElement) {
    bar.parentElement.remove();
    document.dispatchEvent(new CustomEvent('resin:resume', { detail: { reason: 'devtools' } }));
  }
}
