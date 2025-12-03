document.addEventListener('DOMContentLoaded', () => {
  // simple chat overlay that opens when a member row is clicked
  const members = Array.from(document.querySelectorAll('.member-row'));
  if (!members.length) return;

  // populate member avatars/banners from localStorage users if available
  function populateMembersFromUsers() {
    try {
      const usersJson = localStorage.getItem('users');
      const users = usersJson ? JSON.parse(usersJson) : [];
      members.forEach(m => {
        const emailEl = m.querySelector('.member-email');
        const avatarEl = m.querySelector('.member-avatar');
        if (!emailEl) return;
        const email = (emailEl.textContent || '').trim();
        const found = users.find(u => u.email && u.email.toLowerCase() === (email||'').toLowerCase());
        if (found) {
          if (found.avatarUrl && avatarEl) avatarEl.src = found.avatarUrl;
          // store banner info as data attribute for quicker access
          if (found.bannerUrl) m.setAttribute('data-banner-url', found.bannerUrl);
        }
      });
    } catch(e) { console.warn('populate members failed', e); }
  }
  // initial population
  populateMembersFromUsers();

  function getProfile() {
    try { const s = sessionStorage.getItem('loggedInUser'); if (s) return JSON.parse(s); } catch(e){}
    try { const r = localStorage.getItem('rememberedUser'); if (r) return JSON.parse(r); } catch(e){}
    return null;
  }

  function threadId(a, b) {
    // deterministic id for two emails
    const xs = [a||'', b||''].map(x => (x||'').toLowerCase()).sort();
    return xs.join('||');
  }

  function getUserByEmail(email) {
    if (!email) return null;
    try {
      const usersJson = localStorage.getItem('users');
      const users = usersJson ? JSON.parse(usersJson) : [];
      return users.find(u => u.email && u.email.toLowerCase() === (email||'').toLowerCase()) || null;
    } catch(e) { return null; }
  }

  function generateInitialsDataUrl(name) {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    let initials = 'U';
    if (parts.length === 1) initials = parts[0].slice(0,1).toUpperCase();
    else if (parts.length > 1) initials = (parts[0].slice(0,1) + parts[parts.length-1].slice(0,1)).toUpperCase();
    const bg1 = '#2b94a6';
    const bg2 = '#45C6C4';
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 256 256'><rect width='256' height='256' rx='20' fill='${bg2}' /><circle cx='128' cy='96' r='56' fill='${bg1}' /><text x='128' y='140' font-family='Poppins, Arial, sans-serif' font-size='76' text-anchor='middle' fill='#ffffff' font-weight='600'>${initials}</text></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  function loadThread(id) {
    try { const all = JSON.parse(localStorage.getItem('chats') || '{}'); return all[id] || []; } catch(e){ return []; }
  }

  function saveThread(id, msgs) {
    try { const all = JSON.parse(localStorage.getItem('chats') || '{}'); all[id] = msgs; localStorage.setItem('chats', JSON.stringify(all)); } catch(e) { console.warn(e); }
  }

  // build overlay
  const overlay = document.createElement('div');
  overlay.id = 'chat-overlay';
  Object.assign(overlay.style, { position:'fixed', right:'20px', bottom:'20px', width:'420px', height:'72vh', background:'#fff', boxShadow:'0 20px 40px rgba(2,14,33,0.18)', borderRadius:'12px', overflow:'hidden', display:'none', zIndex:2000, flexDirection:'column' });
  overlay.className = 'chat-overlay';

  overlay.innerHTML = `
    <div class="chat-header" style="height:110px; background:#0b6b75; color:#fff; padding:12px; display:flex; align-items:flex-end; gap:12px; position:relative;">
      <div style="display:flex;align-items:center;gap:12px;">
        <img id="chat-header-avatar" src="../static/imagens/avatar-default.svg" style="width:56px;height:56px;border-radius:10px;object-fit:cover;border:3px solid rgba(255,255,255,0.2)" />
        <div>
          <div id="chat-header-name" style="font-weight:700;font-size:16px"></div>
          <div id="chat-header-email" style="font-size:13px;opacity:0.9"></div>
        </div>
      </div>
      <button id="chat-close" style="position:absolute;right:12px;top:8px;background:transparent;border:none;color:#fff;font-size:20px;cursor:pointer">×</button>
    </div>
    <div id="chat-messages" style="flex:1; padding:12px 16px; overflow:auto; background:#f7fafb;"></div>
    <div style="padding:12px; border-top:1px solid #eee; display:flex; gap:8px; background:#fff;">
      <input id="chat-input" placeholder="Escreva uma mensagem..." style="flex:1;padding:10px 12px;border-radius:8px;border:1px solid #e6eef0;" />
      <button id="chat-send" style="background:#0b6b75;color:#fff;border:none;padding:10px 12px;border-radius:8px;cursor:pointer">Enviar</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const headerAvatar = overlay.querySelector('#chat-header-avatar');
  const headerName = overlay.querySelector('#chat-header-name');
  const headerEmail = overlay.querySelector('#chat-header-email');
  const chatMessages = overlay.querySelector('#chat-messages');
  const chatInput = overlay.querySelector('#chat-input');
  const chatSend = overlay.querySelector('#chat-send');
  const chatClose = overlay.querySelector('#chat-close');

  let activeThread = null;
  let activeMember = null;

  function renderMessages(msgs, myEmail) {
    chatMessages.innerHTML = '';
    msgs.forEach(m => {
      const isMine = m.from === myEmail;
      const el = document.createElement('div');
      el.style.display = 'flex';
      el.style.marginBottom = '10px';
      el.style.justifyContent = isMine ? 'flex-end' : 'flex-start';
      el.style.alignItems = 'flex-end';

      // avatar
      const avatarImg = document.createElement('img');
      avatarImg.style.width = '36px';
      avatarImg.style.height = '36px';
      avatarImg.style.borderRadius = '8px';
      avatarImg.style.objectFit = 'cover';
      avatarImg.style.margin = isMine ? '0 0 0 8px' : '0 8px 0 0';

      // determine avatar source: message may carry avatarUrl, otherwise lookup profile
      let avatarSrc = '';
      if (m.avatarUrl) avatarSrc = m.avatarUrl;
      else {
        const prof = (m.from === myEmail) ? getProfile() : getUserByEmail(m.from);
        if (prof && prof.avatarUrl) avatarSrc = prof.avatarUrl;
        else avatarSrc = generateInitialsDataUrl((prof && (prof.name || prof.firstName + ' ' + (prof.lastName||''))) || m.from || 'U');
      }
      avatarImg.src = avatarSrc;

      const bubbleWrap = document.createElement('div');
      bubbleWrap.style.display = 'flex';
      bubbleWrap.style.flexDirection = isMine ? 'row-reverse' : 'row';
      bubbleWrap.style.alignItems = 'center';

      const bubble = document.createElement('div');
      bubble.textContent = m.text;
      bubble.style.maxWidth = '72%';
      bubble.style.padding = '10px 12px';
      bubble.style.borderRadius = '10px';
      bubble.style.background = isMine ? '#0b6b75' : '#fff';
      bubble.style.color = isMine ? '#fff' : '#0b132b';
      bubble.style.boxShadow = isMine ? '0 8px 18px rgba(11,107,117,0.12)' : '0 2px 8px rgba(2,14,33,0.04)';

      // timestamp
      const ts = m.ts ? new Date(m.ts) : null;
      if (ts) {
        const timeSpan = document.createElement('div');
        timeSpan.textContent = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        timeSpan.style.fontSize = '11px';
        timeSpan.style.color = isMine ? 'rgba(255,255,255,0.8)' : '#6b7280';
        timeSpan.style.marginTop = '6px';
        timeSpan.style.textAlign = isMine ? 'right' : 'left';
        timeSpan.className = 'msg-ts';
        // wrap bubble and timestamp
        const bubbleWithTs = document.createElement('div');
        bubbleWithTs.style.display = 'flex';
        bubbleWithTs.style.flexDirection = 'column';
        bubbleWithTs.appendChild(bubble);
        bubbleWithTs.appendChild(timeSpan);
        // replace bubble variable usage below
        // we'll append bubbleWithTs instead of bubble
        // assign for later use
        bubble._withTs = bubbleWithTs;
      }

      if (bubble._withTs) {
        if (isMine) {
          bubbleWrap.appendChild(bubble._withTs);
          bubbleWrap.appendChild(avatarImg);
        } else {
          bubbleWrap.appendChild(avatarImg);
          bubbleWrap.appendChild(bubble._withTs);
        }
      } else {
        if (isMine) {
          bubbleWrap.appendChild(bubble);
          bubbleWrap.appendChild(avatarImg);
        } else {
          bubbleWrap.appendChild(avatarImg);
          bubbleWrap.appendChild(bubble);
        }
      }

      el.appendChild(bubbleWrap);
      chatMessages.appendChild(el);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function openChatForMember(memberEl) {
    const name = memberEl.querySelector('.member-name') ? memberEl.querySelector('.member-name').textContent : 'Contato';
    const email = memberEl.querySelector('.member-email') ? memberEl.querySelector('.member-email').textContent : '';
    const avatar = memberEl.querySelector('.member-avatar') ? memberEl.querySelector('.member-avatar').src : '../static/imagens/avatar-default.svg';

    // re-fetch latest profile for the clicked member from storage
    const latestMember = getUserByEmail(email);
    const memberProfile = latestMember || { name, email, avatarUrl: avatar };

    const me = getProfile();
    activeMember = memberProfile;
    headerName.textContent = memberProfile.name || name;
    headerEmail.textContent = memberProfile.email || email;

    // decide avatar: if chatting with self, show my avatar; otherwise show member avatar
    const myEmail = me && me.email ? (me.email||'').toLowerCase() : '';
    const otherEmail = (memberProfile && memberProfile.email) ? (memberProfile.email||'').toLowerCase() : (email||'').toLowerCase();
    const isSelf = myEmail && otherEmail && myEmail === otherEmail;
    if (isSelf) {
      headerAvatar.src = (me && me.avatarUrl) ? me.avatarUrl : (memberProfile.avatarUrl || avatar);
    } else {
      headerAvatar.src = memberProfile.avatarUrl || avatar || (me && me.avatarUrl) || '../static/imagens/avatar-default.svg';
    }

    // choose banner: prefer recipient's banner when available; fallbacks: element data attr, my banner
    const elBanner = memberEl && memberEl.getAttribute ? memberEl.getAttribute('data-banner-url') : null;
    let headerBanner = '';
    if (!isSelf) {
      if (memberProfile.bannerUrl) headerBanner = memberProfile.bannerUrl;
      else if (elBanner) headerBanner = elBanner;
      else if (me && me.bannerUrl) headerBanner = me.bannerUrl;
    } else {
      // chatting with self: show my banner if present, otherwise any element banner
      if (me && me.bannerUrl) headerBanner = me.bannerUrl;
      else if (elBanner) headerBanner = elBanner;
      else if (memberProfile.bannerUrl) headerBanner = memberProfile.bannerUrl || '';
    }
    if (headerBanner) {
      overlay.querySelector('.chat-header').style.backgroundImage = `url('${headerBanner}')`;
      overlay.querySelector('.chat-header').style.backgroundSize = 'cover';
      overlay.querySelector('.chat-header').style.backgroundPosition = 'center';
    } else {
      overlay.querySelector('.chat-header').style.backgroundImage = '';
    }

    activeThread = threadId(meProf && meProf.email, memberProfile && memberProfile.email);
    const msgs = loadThread(activeThread);
    renderMessages(msgs, meProf && meProf.email);
    overlay.style.display = 'flex';
    chatInput.focus();
  }

  members.forEach(m => {
    m.addEventListener('click', () => openChatForMember(m));
  });

  chatSend.addEventListener('click', () => {
    const text = (chatInput.value || '').trim();
    if (!text || !activeThread) return;
    const me = getProfile();
    const msgs = loadThread(activeThread);
    const myEmail = me && me.email || 'me';
    const msg = { from: myEmail, text, ts: Date.now(), avatarUrl: me && me.avatarUrl || '' , bannerUrl: me && me.bannerUrl || '' };
    msgs.push(msg);
    saveThread(activeThread, msgs);
    renderMessages(msgs, myEmail);
    chatInput.value = '';

    // schedule auto-reply from recipient with typing indicator and timestamp
    (async () => {
      try {
        const recipient = activeMember && activeMember.email ? getUserByEmail(activeMember.email) : activeMember;
        const replyFrom = (recipient && recipient.email) || activeMember && activeMember.email || 'responder@local';

        // show typing indicator
        const typingEl = document.createElement('div');
        typingEl.className = 'chat-typing';
        typingEl.style.display = 'flex';
        typingEl.style.justifyContent = 'flex-start';
        typingEl.style.marginBottom = '8px';
        typingEl.innerHTML = `<div style="display:flex;align-items:center;gap:8px"><img src='${recipient && (recipient.avatarUrl || recipient.avatar) || "../static/imagens/avatar-default.svg"}' style='width:36px;height:36px;border-radius:8px;object-fit:cover' /><div style='background:#fff;padding:8px 12px;border-radius:10px;box-shadow:0 2px 8px rgba(2,14,33,0.04);color:#0b132b'>...</div></div>`;
        chatMessages.appendChild(typingEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const delay = 900 + Math.floor(Math.random()*900);
        setTimeout(() => {
          try {
            // remove typing indicator
            if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
            // determine reply text using centralized bot if available
            let replyText = '';
            try { if (window.FlowBot && typeof FlowBot.replyText === 'function') replyText = FlowBot.replyText(text); } catch(e) {}
            if (!replyText) replyText = (replyFrom && (replyFrom.indexOf('help-bot') !== -1 || (window.FlowBot && FlowBot.isBotEmail && FlowBot.isBotEmail(replyFrom)))) ? (window.FlowBot ? window.FlowBot.replyText(text) : ('Olá! Em que posso ajudar?')) : ('Olá ' + (me && me.firstName ? me.firstName : '') + ', obrigado pela mensagem.');

            const msgs2 = loadThread(activeThread);
            const replyMsg = { from: replyFrom, text: replyText, ts: Date.now(), avatarUrl: recipient && (recipient.avatarUrl || recipient.avatar) || '', bannerUrl: recipient && recipient.bannerUrl || '' };
            msgs2.push(replyMsg);
            saveThread(activeThread, msgs2);
            renderMessages(msgs2, myEmail);
          } catch(err) { console.warn('reply err', err); }
        }, delay);
      } catch(e) { console.warn('reply failed', e); }
    })();
  });

  chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); chatSend.click(); } });

  chatClose.addEventListener('click', () => { overlay.style.display = 'none'; overlay.querySelector('.chat-header').style.backgroundImage = ''; activeThread = null; activeMember = null; });

  // Storage event: update members list and refresh open overlay when users/loggedInUser change in other tabs
  window.addEventListener('storage', (ev) => {
    try {
      if (!ev.key) return; // ignore clear
      if (ev.key === 'users' || ev.key === 'rememberedUser' || ev.key === 'loggedInUser') {
        // repopulate member avatars/banners
        populateMembersFromUsers();
        // if overlay is open and we have an active member, refresh header/banner/avatar
        if (overlay && overlay.style && overlay.style.display === 'flex' && activeMember && activeMember.email) {
          // re-fetch latest profile for active member and update header
          const latest = getUserByEmail(activeMember.email) || activeMember;
          activeMember = latest;
          const me = getProfile();
          const myEmail = me && me.email ? (me.email||'').toLowerCase() : '';
          const otherEmail = (latest && latest.email) ? (latest.email||'').toLowerCase() : '';
          const isSelf = myEmail && otherEmail && myEmail === otherEmail;
          // avatar
          if (isSelf) headerAvatar.src = (me && me.avatarUrl) ? me.avatarUrl : (latest.avatarUrl || headerAvatar.src);
          else headerAvatar.src = latest.avatarUrl || headerAvatar.src;
          // banner: prefer recipient's banner, fallback to element attr, then my banner
          const el = Array.from(members).find(m => {
            const e = m.querySelector('.member-email'); return e && ((e.textContent||'').trim().toLowerCase() === (otherEmail||''));
          });
          const elBanner = el && el.getAttribute ? el.getAttribute('data-banner-url') : null;
          let headerBanner = '';
          if (!isSelf) {
            headerBanner = latest.bannerUrl || elBanner || (me && me.bannerUrl) || '';
          } else {
            headerBanner = (me && me.bannerUrl) || elBanner || (latest.bannerUrl || '');
          }
          if (headerBanner) {
            overlay.querySelector('.chat-header').style.backgroundImage = `url('${headerBanner}')`;
            overlay.querySelector('.chat-header').style.backgroundSize = 'cover';
            overlay.querySelector('.chat-header').style.backgroundPosition = 'center';
          } else {
            overlay.querySelector('.chat-header').style.backgroundImage = '';
          }
        }
      }
    } catch(err) { console.warn('storage update handling failed', err); }
  });

  // Custom event for same-tab updates (fired by perfil save)
  window.addEventListener('flowpilot:users-updated', (ev) => {
    try {
      populateMembersFromUsers();
      // if overlay is open and activeMember matches, refresh header/banner/avatar similar to storage handler
      if (overlay && overlay.style && overlay.style.display === 'flex' && activeMember && activeMember.email) {
        const latest = getUserByEmail(activeMember.email) || activeMember;
        activeMember = latest;
        const me = getProfile();
        const myEmail = me && me.email ? (me.email||'').toLowerCase() : '';
        const otherEmail = (latest && latest.email) ? (latest.email||'').toLowerCase() : '';
        const isSelf = myEmail && otherEmail && myEmail === otherEmail;
        if (isSelf) headerAvatar.src = (me && me.avatarUrl) ? me.avatarUrl : (latest.avatarUrl || headerAvatar.src);
        else headerAvatar.src = latest.avatarUrl || headerAvatar.src;
        const el = Array.from(members).find(m => {
          const e = m.querySelector('.member-email'); return e && ((e.textContent||'').trim().toLowerCase() === (otherEmail||''));
        });
        const elBanner = el && el.getAttribute ? el.getAttribute('data-banner-url') : null;
        let headerBanner = '';
        if (!isSelf) headerBanner = latest.bannerUrl || elBanner || (me && me.bannerUrl) || '';
        else headerBanner = (me && me.bannerUrl) || elBanner || (latest.bannerUrl || '');
        if (headerBanner) {
          overlay.querySelector('.chat-header').style.backgroundImage = `url('${headerBanner}')`;
          overlay.querySelector('.chat-header').style.backgroundSize = 'cover';
          overlay.querySelector('.chat-header').style.backgroundPosition = 'center';
        } else {
          overlay.querySelector('.chat-header').style.backgroundImage = '';
        }
      }
    } catch(err) { console.warn('flowpilot:users-updated handler failed', err); }
  });

});
