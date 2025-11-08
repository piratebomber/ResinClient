// bootstrap3d.js — Initialize 3D mode: world, player, renderer, inputs.

import { World3D } from '../engine/world3d/world3d.js';
import { WorldRenderer3D } from '../engine/render3d/worldRenderer3d.js';
import { Input3D } from '../engine/input/input3d.js';
import { Physics } from '../engine/physics/physics.js';
import { Player } from '../entities/player.js';
import { Mob } from '../entities/mob.js';
import { MobHostile } from '../entities/mobHostile.js';
import { Drop } from '../entities/drop.js';
import { translator } from '../platform/javaTranslator/translator.js';
import { installJavaAPI } from '../platform/javaTranslator/apiExpansion.js';
import { raycast } from '../engine/render3d/raycast.js';
import { ChunkStore } from '../platform/storage/chunkStore.js';
import { ITEM, MINE_SPEED, itemToBlock, blockToItem } from '../items/items.js';
import { ResourcePack } from '../engine/resources/resourcePack.js';
import { NetClient } from '../platform/net/client.js';
import { HUD3D } from '../ui/hud3d.js';
import { InventoryUI } from '../ui/inventory.js';
import { ChatUI } from '../ui/chat.js';
import { PlayerListUI } from '../ui/playerList.js';
import { PlayerStore } from '../platform/storage/playerStore.js';

let world, renderer, input, physics, player, entities=[]; let drops=[];

export function start3D() {
  const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('resin-canvas'));
  world = new World3D({ viewRadius: 2 });
  world.setStore(new ChunkStore());
  physics = new Physics(world);
  player = new Player(physics);
  renderer = new WorldRenderer3D(canvas, world, player.cam);
  input = new Input3D(canvas); input.hookMouse();

  // Spawn a few mobs near player
  for (let i=0;i<3;i++){
    const m = new Mob(physics); m.pos[0]=player.pos[0]+(Math.random()*10-5); m.pos[1]=player.pos[1]; m.pos[2]=player.pos[2]+(Math.random()*10-5);
    entities.push(m);
  }
  for (let i=0;i<2;i++){
    const h = new MobHostile(physics, world, player); h.pos[0]=player.pos[0]+(Math.random()*12-6); h.pos[1]=player.pos[1]; h.pos[2]=player.pos[2]+(Math.random()*12-6);
    entities.push(h);
  }

  // HUD & UI
  const hud = new HUD3D(player);
  const invUI = new InventoryUI(player);
  let chatUI = null; let plistUI = null;
  const pstore = new PlayerStore();
  // Load inventory if saved
  pstore.getInventory().then(data=>{
    if (data && typeof data==='object'){
      player.inventory = new Map(Object.entries(data).map(([k,v])=>[Number(k), Number(v)]));
      hud.onInventoryChange(); invUI.onInventoryChange();
    }
  });

  // Optional network client via ?ws=...&token=...
  const sp = new URLSearchParams(location.search);
  let net = null;
  if (sp.get('ws')) {
    net = new NetClient({ adapter:'ws', url: sp.get('ws'), token: sp.get('token')||undefined });
    net.connect().catch(()=>{});
    // Handle incoming chunk data: supports raw base64 or RLE
    net.on('CHUNK_DATA', (msg)=>{
      const { cx,cy,cz, data, rle } = msg;
      const arr = rle ? decodeRLEU16(data) : base64ToU16(data);
      world.applyChunk(cx,cy,cz, arr);
    });
    net.on('CHUNK_DELTA', (msg)=>{
      const { cx,cy,cz, changes } = msg; const basecx=cx*world.sx, basecy=cy*world.sy, basecz=cz*world.sz;
      for (const c of changes){ world.setBlock(basecx+c.x, basecy+c.y, basecz+c.z, c.id); }
    });
    // Chat & players
    chatUI = new ChatUI(net);
    plistUI = new PlayerListUI();
    net.on('CHAT', (m)=> chatUI.append(m.from||'srv', m.msg));
    net.on('PLAYERS', (m)=> plistUI.setPlayers(m.players||[]));
    net.on('PLAYER_JOIN', (m)=> chatUI.append('srv', `${m.name||'player'} joined`));
    net.on('PLAYER_LEAVE', (m)=> chatUI.append('srv', `${m.name||'player'} left`));
  }

  // Apply persisted options if present
  const store = JSON.parse(localStorage.getItem('resin:options')||'{}');
  if (store.fov) player.cam.fov = store.fov*Math.PI/180;
  if (store.sens) player.cam.sens = store.sens*0.001 + 0.002; // simple mapping
  if (store.pack) {
    const pack = new ResourcePack();
    pack.load(store.pack).then(()=>{ renderer.atlas.build(pack.textures); hud.setTextures(pack.textures); });
  }

  // Listen for options changes
  document.addEventListener('resin:options', (e)=>{
    const o = /** @type {{fov?:number,sens?:number,pack?:string}} */ (e.detail);
    if (o.fov) player.cam.fov = o.fov*Math.PI/180;
    if (o.sens) player.cam.sens = o.sens*0.001 + 0.002;
    if (o.pack) {
      const pack = new ResourcePack();
      pack.load(o.pack).then(()=>{ renderer.atlas.build(pack.textures); hud.setTextures(pack.textures); });
    }
  });

  // Java translator mappings for 3D
  translator.register('net.minecraft.client.Minecraft', 'setFOV', (f)=>{ player.cam.fov = (f*Math.PI/180); });
  translator.register('net.minecraft.client.player.Player', 'getPosition', ()=>({ x: player.pos[0], y: player.pos[1], z: player.pos[2] }));
  installJavaAPI({ world, player });

  // Input bindings
  document.addEventListener('resin:look', (e)=>{
    const { dx, dy } = /** @type {{dx:number,dy:number}} */ (e.detail);
    player.look(dx, dy);
  });
  document.addEventListener('resin:hotbar', (e)=>{ const { slot }=/** @type {{slot:number}} */(e.detail); player.selected = slot; });

  // Mining state
  let mining = { active:false, bx:0, by:0, bz:0, time:0, targetTime:0 };
  window.addEventListener('mousedown', (e)=>{
    if (e.button!==0) return; // left only
    const dir = viewDir(player.cam);
    const origin = player.cam.pos;
    const hit = raycast(world, origin, dir, 6);

    // Shift+LMB places block (if block item selected)
    if (e.shiftKey && hit.hit) {
      const placeId = selectedBlockId(player);
      if (placeId!=null) {
        const px = hit.bx + (hit.nx||0);
        const py = hit.by + (hit.ny||0);
        const pz = hit.bz + (hit.nz||0);
        if (world.getBlock(px,py,pz)===0) {
          world.setBlock(px, py, pz, placeId);
          hud.onInventoryChange();
          invUI.onInventoryChange();
          // persist
          pstore.saveInventory(Object.fromEntries(player.inventory));
        } else {
          // refund if blocked
          player.addItem(player.hotbar[(player.selected-1)|0], 1);
          pstore.saveInventory(Object.fromEntries(player.inventory));
        }
      }
      return;
    }

    // Attack entity in front if no close block target
    const entHit = raycastEntity(entities, origin, dir, 3);
    if ((!hit.hit || hit.t>3) && entHit) {
      const dead = entHit.damage(5);
      if (dead) entities.splice(entities.indexOf(entHit),1);
      return;
    }

    if (!hit.hit) return;
    // Otherwise start mining
    const id = world.getBlock(hit.bx, hit.by, hit.bz);
    const hard = world.blockProps(id).hardness || 1.0;
    const tool = currentTool(player);
    const { canMine } = awaitImportItemsRules();
    if (!canMine(id, tool)) return; // tool insufficient
    const speed = MINE_SPEED[tool] || 1.0;
    mining = { active:true, bx:hit.bx, by:hit.by, bz:hit.bz, time:0, targetTime: Math.max(0.05, hard / speed) };
  }, true);
  window.addEventListener('mouseup', (e)=>{ if (e.button===0) mining.active=false; }, true);

  let last = performance.now();
  let bobPhase = 0; let swing = 0;
  let posSendAcc = 0; const requested = new Set();
  let timeOfDay = 0; // 0..1
  function loop(now){
    const dt = Math.min(0.05, (now-last)/1000); last=now;
    // Movement
    player.moveInput(input.keys, dt);

    // Camera bob based on horizontal speed
    const speedH = Math.hypot(player.vel[0], player.vel[2]);
    if (speedH > 0.05) bobPhase += dt * 8 * Math.min(1, speedH/6); else bobPhase *= Math.max(0, 1 - dt*5);
    player.cam.posOff[1] = Math.sin(bobPhase) * 0.08;
    player.cam.yawOff = Math.sin(bobPhase*0.5) * 0.01;

    // Mining update
    if (mining.active) {
      // If target changed (due to camera move), recompute? For now, stick to initial block
      mining.time += dt;
      // Mining swing animation
      swing += dt * 12;
      player.cam.pitchOff = Math.sin(swing) * 0.06;
      if (mining.time >= mining.targetTime) {
        // Drop item for mined block
        const bid = world.getBlock(mining.bx, mining.by, mining.bz);
        if (bid!==0){
          const dropId = blockToItem(bid);
          if (dropId!=null){ const d=new Drop(physics, dropId, 1); d.pos[0]=mining.bx+0.5; d.pos[1]=mining.by+0.5; d.pos[2]=mining.bz+0.5; entities.push(d); }
        }
        world.setBlock(mining.bx, mining.by, mining.bz, 0);
        mining.active = false;
      }
    } else {
      // Decay swing
      player.cam.pitchOff *= Math.max(0, 1 - dt*8);
    }

    // Update entities
    for (const m of entities) m.update(dt);

    // Pickup drops near player
    for (let i=entities.length-1;i>=0;i--){ const e=entities[i]; if (e.itemId!=null){ const dx=e.pos[0]-player.pos[0], dy=e.pos[1]-player.pos[1], dz=e.pos[2]-player.pos[2]; if (dx*dx+dy*dy+dz*dz < 1.0){ player.addItem(e.itemId, e.count); entities.splice(i,1); hud.onInventoryChange(); invUI.onInventoryChange(); pstore.saveInventory(Object.fromEntries(player.inventory)); } } }

    // Day/night lighting
    timeOfDay = (timeOfDay + dt*0.02) % 1; // 50s cycle
    const angle = timeOfDay*2*Math.PI; const lightDir=[Math.sin(angle)*0.6, Math.cos(angle), Math.cos(angle)*0.6];
    const ambient = 0.05 + 0.25*Math.max(0, lightDir[1]);
    const sky = [0.02+0.18*Math.max(0,lightDir[1]), 0.02+0.2*Math.max(0,lightDir[1]), 0.08+0.25*Math.max(0,lightDir[1]), 1];
    renderer.setEnv({ lightDir, ambient, sky });

    // Streaming + mesh rebuild
    renderer.updateVisible(player);

    // Networking: send player pos and request nearby chunks
    if (net) {
      posSendAcc += dt; if (posSendAcc > 0.1) { posSendAcc=0; net.sendPlayerPos(player.pos[0],player.pos[1],player.pos[2],player.yaw,player.pitch); }
      const ccx=Math.floor(player.pos[0]/world.sx), ccy=Math.floor(player.pos[1]/world.sy), ccz=Math.floor(player.pos[2]/world.sz);
      for (let dz=-world.viewRadius; dz<=world.viewRadius; dz++)
        for (let dy=-world.viewRadius; dy<=world.viewRadius; dy++)
          for (let dx=-world.viewRadius; dx<=world.viewRadius; dx++) {
            const cx=ccx+dx, cy=ccy+dy, cz=ccz+dz; const key=`${cx},${cy},${cz}`; if (!requested.has(key)) { requested.add(key); net.requestChunk(cx,cy,cz); }
          }
    }

    // Render
    renderer.render(entities);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

function awaitImportItemsRules(){
  return { canMine: (blockId, tool)=> {
    // inline mirror of items.canMine
    // coal: wood+, iron: stone+, gold: iron+, diamond: iron+
    const PICK_WOOD=1,PICK_STONE=2,PICK_IRON=3; const COAL=9, IRON=10, GOLD=11, DIAMOND=12;
    if (blockId===COAL) return tool===PICK_WOOD||tool===PICK_STONE||tool===PICK_IRON;
    if (blockId===IRON) return tool===PICK_STONE||tool===PICK_IRON;
    if (blockId===GOLD) return tool===PICK_IRON;
    if (blockId===DIAMOND) return tool===PICK_IRON;
    return true;
  }}
}

function decodeRLEU16(b64){
  const bin = atob(b64); const view = new DataView(new ArrayBuffer(bin.length)); const bytes = new Uint8Array(view.buffer);
  for (let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
  // 4-byte tuples: [value:uint16, run:uint16]
  const out=[]; for (let i=0;i<view.byteLength; i+=4){ const val=view.getUint16(i,true); const run=view.getUint16(i+2,true); for(let r=0;r<run;r++) out.push(val); }
  return new Uint16Array(out);
}

function base64ToU16(b64){
  try{
    const bin = atob(b64); const len = bin.length; const buf = new ArrayBuffer(len); const view = new Uint8Array(buf);
    for (let i=0;i<len;i++) view[i] = bin.charCodeAt(i);
    return new Uint16Array(buf);
  }catch{ return null; }
}

function raycastEntity(entities, origin, dir, maxDist){
  let best=null, bestT=Infinity; const r2=0.6*0.6;
  for (const e of entities){
    const cx=e.pos[0], cy=e.pos[1]+0.8, cz=e.pos[2];
    const vx=cx-origin[0], vy=cy-origin[1], vz=cz-origin[2];
    const t = vx*dir[0]+vy*dir[1]+vz*dir[2];
    if (t<0 || t>maxDist) continue;
    const px=origin[0]+dir[0]*t, py=origin[1]+dir[1]*t, pz=origin[2]+dir[2]*t;
    const dx=cx-px, dy=cy-py, dz=cz-pz; const d2=dx*dx+dy*dy+dz*dz;
    if (d2<r2 && t<bestT){ best=e; bestT=t; }
  }
  return best;
}

function viewDir(cam){
  const dir=[Math.sin(cam.yaw)*Math.cos(cam.pitch), -Math.sin(cam.pitch), Math.cos(cam.yaw)*Math.cos(cam.pitch)];
  // normalize
  const l = Math.hypot(dir[0],dir[1],dir[2])||1; return new Float32Array([dir[0]/l,dir[1]/l,dir[2]/l]);
}

function currentTool(player){
  const item = player.hotbar[(player.selected-1)|0] || 0;
  if (item===ITEM.PICK_WOOD || item===ITEM.PICK_STONE || item===ITEM.PICK_IRON) return item;
  return ITEM.HAND;
}

function selectedBlockId(player){
  const item = player.hotbar[(player.selected-1)|0] || 0;
  const bid = itemToBlock(item);
  if (bid==null) return null;
  // require inventory
  if (player.getItemCount(item) <= 0) return null;
  // consume one on place
  player.removeItem(item, 1);
  return bid;
}
