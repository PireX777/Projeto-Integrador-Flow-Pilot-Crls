document.addEventListener('DOMContentLoaded', () => {
  const textarea = document.querySelector('.message-box textarea');
  const sendBtn = document.querySelector('.message-box .send');

  function getProfile() {
    try { const s = sessionStorage.getItem('loggedInUser'); if (s) return JSON.parse(s); } catch(e){}
    try { const r = localStorage.getItem('rememberedUser'); if (r) return JSON.parse(r); } catch(e){}
    return null;
  }

  function threadId(a, b) {
    const xs = [a||'', b||''].map(x => (x||'').toLowerCase()).sort();
    return xs.join('||');
  }

  function loadThread(id) {
    try { const all = JSON.parse(localStorage.getItem('chats') || '{}'); return all[id] || []; } catch(e){ return []; }
  }

  function saveThread(id, msgs) {
    try { const all = JSON.parse(localStorage.getItem('chats') || '{}'); all[id] = msgs; localStorage.setItem('chats', JSON.stringify(all)); } catch(e) { console.warn(e); }
  }

  function renderMessages(msgs, container) {
    container.innerHTML = '';
    msgs.forEach(m => {
      const isBot = m.from === 'help-bot@flowpilot.local';
      const el = document.createElement('div');
      el.className = 'help-msg ' + (isBot ? 'bot' : 'user');
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      bubble.textContent = m.text;
      // timestamp
      if (m.ts) {
        const ts = new Date(m.ts);
        const tsEl = document.createElement('div');
        tsEl.className = 'msg-ts';
        tsEl.textContent = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        el.appendChild(bubble);
        el.appendChild(tsEl);
      } else {
        el.appendChild(bubble);
      }
      container.appendChild(el);
    });
    container.scrollTop = container.scrollHeight;
  }

  // create UI area under message-box to show chat history
  const center = document.querySelector('.center-box');
  if (!center) return;
  const chatWrap = document.createElement('div');
  chatWrap.className = 'help-chat-wrap';
  chatWrap.innerHTML = `
    <div class="help-messages" style="height:320px; overflow:auto; padding:12px; background:#fff; border-radius:10px; box-shadow:0 6px 18px rgba(2,14,33,0.06); margin-bottom:12px"></div>
  `;
  const messagesContainer = chatWrap.querySelector('.help-messages');
  center.insertBefore(chatWrap, center.querySelector('.help-title').nextSibling);

  const profile = getProfile();
  const botEmail = 'help-bot@flowpilot.local';
  const myEmail = profile && profile.email ? profile.email : 'anon@local';
  const tid = threadId(myEmail, botEmail);

  // load existing
  const msgs = loadThread(tid);
  renderMessages(msgs, messagesContainer);

  async function sendMessage(text) {
    const msg = { from: myEmail, text: text, ts: Date.now() };
    const list = loadThread(tid);
    list.push(msg);
    saveThread(tid, list);
    renderMessages(list, messagesContainer);

    // simulate bot typing and reply using centralized FlowBot if available
    // show typing indicator
    const typingEl = document.createElement('div');
    typingEl.className = 'help-typing';
    typingEl.style.padding = '8px';
    typingEl.style.display = 'flex';
    typingEl.style.justifyContent = 'flex-start';
    typingEl.innerHTML = `<div class="bubble" style="background:#fff;color:#0b132b">...</div>`;
    messagesContainer.appendChild(typingEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    setTimeout(() => {
      try {
        if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
        let replyText = '';
        try { if (window.FlowBot && typeof FlowBot.replyText === 'function') replyText = FlowBot.replyText(text); } catch(e) {}
        if (!replyText) replyText = 'Olá! Como posso ajudar?';
        const reply = { from: botEmail, text: replyText, ts: Date.now() };
        const now = loadThread(tid);
        now.push(reply);
        saveThread(tid, now);
        renderMessages(now, messagesContainer);
      } catch(e) { console.warn('bot reply fail', e); }
    }, 700 + Math.random()*600);
  }

  // wire UI
  if (textarea) {
    textarea.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendBtn.click(); } });
  }

  if (sendBtn) sendBtn.addEventListener('click', () => {
    const v = textarea.value.trim();
    if (!v) return;
    textarea.value = '';
    sendMessage(v);
  });
});
