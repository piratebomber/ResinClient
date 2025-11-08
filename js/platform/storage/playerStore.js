// playerStore.js — Persist player inventory in IndexedDB under 'resin' DB, store 'player'.

const DB = 'resin';
const STORE = 'player';

export class PlayerStore {
  constructor(){ this.dbp = this._open(); }
  async _open(){
    return new Promise((resolve, reject)=>{
      const req = indexedDB.open(DB, 2);
      req.onupgradeneeded = ()=>{
        const db=req.result; if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
        if (!db.objectStoreNames.contains('chunks')) db.createObjectStore('chunks');
      };
      req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
    });
  }
  async getInventory(){ const db=await this.dbp; return new Promise((ok,err)=>{ const tx=db.transaction(STORE,'readonly'); const st=tx.objectStore(STORE); const r=st.get('inventory'); r.onsuccess=()=>ok(r.result||null); r.onerror=()=>err(r.error); }); }
  async saveInventory(inv){ const db=await this.dbp; return new Promise((ok,err)=>{ const tx=db.transaction(STORE,'readwrite'); const st=tx.objectStore(STORE); const r=st.put(inv,'inventory'); r.onsuccess=()=>ok(true); r.onerror=()=>err(r.error); }); }
}
