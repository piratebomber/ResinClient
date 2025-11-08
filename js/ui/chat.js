// chat.js — Minimal chat UI and input handling (Enter to open).

export class ChatUI {
  constructor(net) {
    this.net = net;
    this.root = document.createElement('div');
    this.root.id = 'chat';
    this.root.innerHTML = `
      <div id="chat-log"></div>
      <div id="chat-input"><input type="text" placeholder="Type message and hit Enter"/></div>
    `;
    document.getElementById('app')?.appendChild(this.root);
    this.logEl = this.root.querySelector('#chat-log');
    this.inputWrap = this.root.querySelector('#chat-input');
    this.input = this.root.querySelector('input');

    window.addEventListener('keydown', (e)=>{
      if (e.key === 'Enter') {
        if (this.inputWrap.classList.contains('visible')) {
          const msg = this.input.value.trim(); if (msg) this.send(msg);
          this.input.value = '';
          this.inputWrap.classList.remove('visible');
        } else {
          this.inputWrap.classList.add('visible'); this.input.focus();
        }
      }
    });
  }

  send(msg){
    this.append('me', msg);
    if (this.net) this.net.sendChat(msg);
  }

  append(sender, msg){
    const line = document.createElement('div');
    line.textContent = `${sender}: ${msg}`;
    this.logEl.appendChild(line);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }
}
