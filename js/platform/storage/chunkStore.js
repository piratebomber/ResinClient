// chunkStore.js — Persist chunk data in IndexedDB under 'resin' DB.

const DB_NAME = 'resin';
const STORE = 'chunks';

export class ChunkStore {
  constructor(){ this.dbp = this._open(); }

  async _open(){
    return new Promise((resolve, reject)=>{
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => { const db=req.result; if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE); };
      req.onsuccess = ()=> resolve(req.result);
      req.onerror = ()=> reject(req.error);
    });
  }

  async get(key){ const db=await this.dbp; return new Promise((ok,err)=>{ const tx=db.transaction(STORE,'readonly'); const st=tx.objectStore(STORE); const r=st.get(key); r.onsuccess=()=>ok(r.result||null); r.onerror=()=>err(r.error); }); }
  async put(key, value){ const db=await this.dbp; return new Promise((ok,err)=>{ const tx=db.transaction(STORE,'readwrite'); const st=tx.objectStore(STORE); const r=st.put(value, key); r.onsuccess=()=>ok(true); r.onerror=()=>err(r.error); }); }
}
