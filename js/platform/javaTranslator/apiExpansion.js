// apiExpansion.js — Expand Java translator mappings for world/player/camera.
import { translator } from './translator.js';

export function installJavaAPI({ world, player }) {
  translator.register('net.minecraft.client.player.Player', 'getYaw', ()=>player.yaw);
  translator.register('net.minecraft.client.player.Player', 'getPitch', ()=>player.pitch);
  translator.register('net.minecraft.client.player.Player', 'setSpeed', (s)=>{ player.cam.speed = s; });

  translator.register('net.minecraft.client.Camera', 'setFOV', (f)=>{ player.cam.fov = f*Math.PI/180; });

  translator.register('net.minecraft.world.World', 'getBlock', (x,y,z)=>world.getBlock(x,y,z));
  translator.register('net.minecraft.world.World', 'setBlock', (x,y,z,id)=>world.setBlock(x,y,z,id));
}
