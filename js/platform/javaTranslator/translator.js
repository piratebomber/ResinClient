// translator.js — Minimal Java-to-JS call translator (shim/prototype).
// This does not execute Java; it provides a routing table so that code written
// with Minecraft-like qualified names can be mapped to JS functions.
//
// Example:
//   translator.register('net.minecraft.client.Minecraft', 'startGame', () => start())
//   translator.invoke('net.minecraft.client.Minecraft', 'startGame')

import { logger } from '../../core/logger.js';

export class JavaTranslator {
  constructor() { this.map = new Map(); }

  /** @param {string} qName like 'net.minecraft.client.Minecraft' @param {string} method @param {Function} fn */
  register(qName, method, fn) {
    const key = `${qName}#${method}`;
    this.map.set(key, fn);
    logger.debug('Translator registered', { key });
  }

  /** @param {string} qName @param {string} method @param {any[]} [args] */
  invoke(qName, method, args = []) {
    const key = `${qName}#${method}`;
    const fn = this.map.get(key);
    if (!fn) throw new Error(`Translator: unmapped call ${key}`);
    return fn(...args);
  }
}

export const translator = new JavaTranslator();
