// playerList.js — Shows connected players when networked.

export class PlayerListUI {
  constructor() {
    this.root = document.createElement('div');
    this.root.id = 'player-list';
    this.list = document.createElement('div');
    this.root.appendChild(this.list);
    document.getElementById('app')?.appendChild(this.root);
  }

  setPlayers(players){
    this.list.innerHTML = '';
    for (const p of players) {
      const row = document.createElement('div'); row.textContent = p.name || p.id || 'player'; this.list.appendChild(row);
    }
  }
}
