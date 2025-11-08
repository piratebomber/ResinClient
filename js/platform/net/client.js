// client.js — Network protocol client adapter interface and offline stub.

export class NetClient {
  /** @param {{adapter: 'offline'|'ws', url?:string, token?:string}} cfg */
  constructor(cfg){ this.cfg=cfg; this.adapter = cfg.adapter; this.ws=null; this.handlers={}; }
  async connect(){
    if (this.adapter==='offline') return true;
    if (this.adapter==='ws' && this.cfg.url){
      await new Promise((ok,err)=>{
        const ws = new WebSocket(this.cfg.url);
        this.ws = ws;
        ws.onopen = ()=>{ this._send({ t:'HELLO', v:'resin-0.1' }); if (this.cfg.token) this._send({ t:'AUTH', token:this.cfg.token }); ok(true); };
        ws.onerror = (e)=> err(e);
        ws.onmessage = (ev)=> this._onMessage(ev);
        ws.onclose = ()=>{};
      });
      return true;
    }
    throw new Error('invalid adapter');
  }
  async disconnect(){ if(this.ws){ this.ws.close(); this.ws=null; } return true; }

  on(type, fn){ (this.handlers[type]=this.handlers[type]||[]).push(fn); }
  _emit(type, data){ (this.handlers[type]||[]).forEach(fn=>{ try{ fn(data); }catch{} }); }

  _send(obj){ if (this.ws && this.ws.readyState===1) this.ws.send(JSON.stringify(obj)); }
  _onMessage(ev){ try { const msg=JSON.parse(ev.data); this._emit(msg.t, msg); } catch{} }

  // Protocol methods
  sendChat(msg){ if (this.adapter==='ws') this._send({ t:'CHAT', msg }); }
  requestChunk(cx,cy,cz){ if (this.adapter==='ws') this._send({ t:'CHUNK_REQUEST', cx,cy,cz }); }
  sendPlayerPos(x,y,z,yaw,pitch){ if (this.adapter==='ws') this._send({ t:'POS', x,y,z,yaw,pitch }); }
}
