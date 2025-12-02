document.addEventListener('DOMContentLoaded', () => {
  // Preenche a tela do usuário com dados salvos em sessionStorage.loggedInUser
  try {
  // Prefer sessionStorage but fallback to remembered profile in localStorage
  let userJson = sessionStorage.getItem('loggedInUser');
  if (!userJson) userJson = localStorage.getItem('rememberedUser');
  if (!userJson) return;
  const user = JSON.parse(userJson);

    // Nome e email
    const mainName = document.querySelector('.main-name');
    const titleSub = document.querySelector('.title-sub');
    const coverName = document.querySelector('.cover-name');
    const emailEl = document.querySelector('.email');
    const contactsEl = document.querySelector('.contacts');
    const miniName = document.querySelector('.mini-name');
    const miniRole = document.querySelector('.mini-role');

    if (user.name) {
      if (mainName) mainName.textContent = user.name;
      if (titleSub) titleSub.textContent = user.name;
      if (coverName) coverName.textContent = user.name;
      if (miniName) miniName.textContent = user.name;
    } else if (user.email) {
      if (mainName) mainName.textContent = user.email;
      if (miniName) miniName.textContent = user.email;
    }

    if (user.email && emailEl) emailEl.textContent = user.email;
    if (user.contacts && contactsEl) contactsEl.textContent = user.contacts + ' Contatos';
    if (user.description && miniRole) miniRole.textContent = user.description;

    // Avatares (se tiver avatarUrl no objeto user, usa; senão gerar por iniciais)
    const mini = document.querySelector('.mini-photo');
    const big = document.querySelector('.avatar-big');
    const small = document.querySelector('.avatar-small');
    // montar nome a partir de firstName/lastName se necessário
    let displayName = user.name || ((user.firstName || '') + (user.lastName ? (' ' + user.lastName) : '')).trim();
    if (!displayName && user.email) displayName = user.email.split('@')[0];

    const avatarSrc = (user.avatarUrl && user.avatarUrl.length) ? user.avatarUrl : generateInitialsSVG(displayName || 'U');
    [mini, big, small].forEach(el => { if (el) el.src = avatarSrc; });

    // lembrar email original para buscas ao editar
    let originalEmail = user.email;

    // renderizar equipes dinamicamente
    const teamsContainer = document.querySelector('.teams');
    if (teamsContainer) {
      const teams = user.teams && user.teams.length ? user.teams : ['EQUIPE 1 - Membro', 'EQUIPE 2 - Membro'];
      let teamsHtml = '<h2>Minhas equipes</h2>' + teams.map(t => `<div class="team-card">${t}</div>`).join('');
      teamsContainer.innerHTML = teamsHtml;
    }

    // Adiciona botão de logout ao topbar
    const topbar = document.querySelector('.topbar');
    const topbarRight = document.querySelector('.topbar-right');
    if (topbarRight && !document.querySelector('.logout-btn')) {
      const btn = document.createElement('button');
      btn.className = 'logout-btn';
      btn.textContent = 'Sair';
      btn.style.marginLeft = '16px';
      btn.style.background = 'transparent';
      btn.style.border = '1px solid rgba(255,255,255,0.12)';
      btn.style.color = 'white';
      btn.style.padding = '8px 10px';
      btn.style.borderRadius = '8px';
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', () => {
        sessionStorage.removeItem('loggedInUser');
        // opcional: também limpar rememberedEmail se for logout completo
        window.location.href = 'login2.html';
      });
      topbarRight.appendChild(btn);
    }

    // Editar perfil (nome/email/descrição/avatar)
    const editCircle = document.querySelector('.edit-circle');
    if (editCircle) {
      editCircle.addEventListener('click', () => {
        try {
          const newName = prompt('Nome completo:', user.name || '');
          if (newName === null) return; // cancel
          const nameParts = newName.trim().split(/\s+/).filter(Boolean);
          const newFirst = nameParts.length ? nameParts[0] : '';
          const newLast = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

          const newEmail = prompt('Email:', user.email || '');
          if (newEmail === null) return;
          const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail);
          if (!emailValid) { alert('Email inválido.'); return; }

          const newDesc = prompt('Descrição (resumo/cargo):', user.description || '');
          if (newDesc === null) return;

          const newAvatar = prompt('URL do avatar (deixe vazio para manter):', user.avatarUrl || '');
          if (newAvatar === null) return;

          // atualizar localStorage.users se possível
          try {
            const usersJson = localStorage.getItem('users');
            const users = usersJson ? JSON.parse(usersJson) : [];
            const idx = users.findIndex(u => u.email && u.email.toLowerCase() === (originalEmail || '').toLowerCase());
            // evitar trocar para email já existente
            const exists = users.find(u => u.email && u.email.toLowerCase() === newEmail.toLowerCase() && u.email.toLowerCase() !== (originalEmail||'').toLowerCase());
            if (exists) { alert('Já existe uma conta com este email. Escolha outro.'); return; }

            if (idx >= 0) {
              users[idx].firstName = newFirst;
              users[idx].lastName = newLast;
              users[idx].email = newEmail;
              if (newAvatar) users[idx].avatarUrl = newAvatar;
              // keep password unchanged
              localStorage.setItem('users', JSON.stringify(users));
            }
          } catch(e) { console.warn('Falha ao atualizar users no localStorage', e); }

          // atualizar objeto user na sessão e rememberedUser
          user.firstName = newFirst;
          user.lastName = newLast;
          user.name = (newFirst + (newLast ? (' ' + newLast) : '')).trim();
          user.email = newEmail;
          user.description = newDesc;
          if (newAvatar) user.avatarUrl = newAvatar;

          try { sessionStorage.setItem('loggedInUser', JSON.stringify(user)); } catch(e){}
          try { if (localStorage.getItem('rememberedUser')) localStorage.setItem('rememberedUser', JSON.stringify(user)); } catch(e){}

          // atualizar DOM
          if (mainName) mainName.textContent = user.name;
          if (titleSub) titleSub.textContent = user.name;
          if (miniName) miniName.textContent = user.name;
          if (emailEl) emailEl.textContent = user.email;
          if (miniRole) miniRole.textContent = user.description;
          const descEl = document.querySelector('.desc'); if (descEl) descEl.textContent = user.description || '';
          const avatarSrcUpdated = (user.avatarUrl && user.avatarUrl.length) ? user.avatarUrl : generateInitialsSVG(user.name || 'U');
          [mini, big, small].forEach(el => { if (el) el.src = avatarSrcUpdated; });

          // atualizar originalEmail para futuras edições
          originalEmail = user.email;
          alert('Perfil atualizado com sucesso.');
        } catch(err) { console.error(err); alert('Erro ao editar perfil.'); }
      });
    }
  } catch (err) {
    // falha silenciosa, não bloquear a página
    console.error('Erro ao popular tela do usuário:', err);
  }
});

// Gera uma imagem SVG com iniciais e retorna data URL
function generateInitialsSVG(name) {
  try {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    let initials = 'U';
    if (parts.length === 1) initials = parts[0].slice(0,1).toUpperCase();
    else if (parts.length > 1) initials = (parts[0].slice(0,1) + parts[parts.length-1].slice(0,1)).toUpperCase();

    const bg1 = '#2b94a6';
    const bg2 = '#45C6C4';
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 256 256'>
      <defs>
        <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
          <stop offset='0%' stop-color='${bg1}'/>
          <stop offset='100%' stop-color='${bg2}'/>
        </linearGradient>
      </defs>
      <rect width='256' height='256' rx='20' fill='${bg2}' />
      <circle cx='128' cy='96' r='56' fill='url(%23g)' />
      <text x='128' y='120' font-family='Poppins, Arial, sans-serif' font-size='76' text-anchor='middle' fill='#ffffff' font-weight='600'>${initials}</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  } catch(e) {
    return '../static/imagens/avatar-default.svg';
  }
}
