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
    // show role in profile area
    const roleDisplay = document.querySelector('.role-display');
    if (roleDisplay) roleDisplay.textContent = user.description || '';

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

    // Editar perfil: abrir modal de edição
    const editCircle = document.querySelector('.edit-circle');
    if (editCircle) {
      editCircle.addEventListener('click', () => {
        openProfileModal(user, originalEmail);
      });
    }
  } catch (err) {
    // falha silenciosa, não bloquear a página
    console.error('Erro ao popular tela do usuário:', err);
  }
  // Pesquisa: filtrar equipes com base no campo de busca no topbar
  try {
    const searchInput = document.querySelector('.search');
    const teamsContainer = document.querySelector('.teams');
    let noResEl = null;
    function updateSearchResults(q) {
      if (!teamsContainer) return;
      const cards = teamsContainer.querySelectorAll('.team-card');
      const term = (q || '').trim().toLowerCase();
      let visible = 0;
      cards.forEach(c => {
        const text = (c.textContent || '').toLowerCase();
        if (!term || text.indexOf(term) !== -1) {
          c.style.display = '';
          visible++;
        } else {
          c.style.display = 'none';
        }
      });
      if (!noResEl) {
        noResEl = document.createElement('div');
        noResEl.className = 'no-results';
        noResEl.style.marginTop = '12px';
        noResEl.style.color = '#6b7280';
        teamsContainer.appendChild(noResEl);
      }
      noResEl.textContent = visible ? '' : 'Nenhum resultado encontrado.';
    }
    if (searchInput) {
      searchInput.addEventListener('input', (e) => { updateSearchResults(e.target.value); });
      searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); updateSearchResults(searchInput.value); } });
    }
  } catch(e) { console.warn('Erro ao habilitar pesquisa:', e); }
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

// helper to convert File -> dataURL (used for avatar upload in profile modal)
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const PROFILE_AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2MB
// ---------------- Profile modal logic ----------------
function openProfileModal(user, originalEmail) {
  const modal = document.getElementById('profile-modal');
  if (!modal) return;
  const nameIn = document.getElementById('profile-name');
  const emailIn = document.getElementById('profile-email');
  const descIn = document.getElementById('profile-desc');
  const avatarFileIn = document.getElementById('profile-avatar-file');
  const bannerFileIn = document.getElementById('profile-banner-file');
  const bannerPreview = document.getElementById('profile-banner-preview');
  const feedback = document.getElementById('profile-email-feedback');
  const previewImg = document.getElementById('profile-avatar-preview');

  nameIn.value = user.name || '';
  emailIn.value = (user.email || '').toLowerCase();
  descIn.value = user.description || '';
  avatarFileIn.value = '';
  if (feedback) feedback.textContent = '';
  // inicializar preview
  try {
    if (previewImg) {
      const src = user.avatarUrl && user.avatarUrl.length ? user.avatarUrl : generateInitialsSVG(nameIn.value || 'U');
      previewImg.src = src;
      previewImg.style.display = 'block';
    }
    // banner preview
    if (bannerPreview) {
      if (user.bannerUrl && user.bannerUrl.length) {
        bannerPreview.style.backgroundImage = `url('${user.bannerUrl}')`;
        bannerPreview.style.display = 'block';
      } else {
        bannerPreview.style.display = 'none';
      }
    }
  } catch(e) {}

  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';

  // wire form submit
  const form = document.getElementById('profile-edit-form');
  if (!form) return;

  // Preview helper for avatar file
  function onFileChange(e) {
    try {
      const f = (e && e.target && e.target.files && e.target.files[0]) ? e.target.files[0] : null;
      if (!previewImg) return;
      if (!f) { updatePreviewFromUrl(); return; }
      if (f.size > PROFILE_AVATAR_MAX_BYTES) {
        if (feedback) feedback.textContent = 'Arquivo muito grande. Máx 2MB.';
        avatarFileIn.value = '';
        return;
      }
      if (feedback) feedback.textContent = '';
      const reader = new FileReader();
      reader.onload = () => { previewImg.src = reader.result; previewImg.style.display = 'block'; };
      reader.readAsDataURL(f);
    } catch(err) { console.warn('preview file error', err); }
  }
  // attach listeners for file inputs and remember them so we can remove later
  if (avatarFileIn) avatarFileIn.addEventListener('change', onFileChange);
  function onBannerFileChange(e) {
    try {
      const f = (e && e.target && e.target.files && e.target.files[0]) ? e.target.files[0] : null;
      if (!bannerPreview) return;
      if (!f) { bannerPreview.style.backgroundImage = ''; bannerPreview.style.display = 'none'; return; }
      if (f.size > PROFILE_AVATAR_MAX_BYTES) {
        if (feedback) feedback.textContent = 'Banner muito grande. Máx 2MB.';
        bannerFileIn.value = '';
        return;
      }
      if (feedback) feedback.textContent = '';
      const reader = new FileReader();
      reader.onload = () => { bannerPreview.style.backgroundImage = `url('${reader.result}')`; bannerPreview.style.display = 'block'; };
      reader.readAsDataURL(f);
    } catch(err) { console.warn('banner preview error', err); }
  }
  if (bannerFileIn) bannerFileIn.addEventListener('change', onBannerFileChange);
  modal._profileAvatarListeners = { onFileChange, onBannerFileChange };

  function onSubmit(e) {
    e.preventDefault();
    handleProfileSave(user, originalEmail);
  }
  form.addEventListener('submit', onSubmit, { once: true });

  // wire cancel
  const cancel = modal.querySelector('.modal-cancel');
  if (cancel) cancel.addEventListener('click', () => { closeProfileModal(); }, { once: true });
}

function closeProfileModal() {
  const modal = document.getElementById('profile-modal');
  if (!modal) return;
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
  // remove preview listeners if attached
  try {
    const avatarFileIn = document.getElementById('profile-avatar-file');
    const l = modal._profileAvatarListeners;
    if (l) {
      if (avatarFileIn && l.onFileChange) avatarFileIn.removeEventListener('change', l.onFileChange);
      // banner listeners
      const bannerFileIn = document.getElementById('profile-banner-file');
      if (bannerFileIn && l.onBannerFileChange) bannerFileIn.removeEventListener('change', l.onBannerFileChange);
      delete modal._profileAvatarListeners;
    }
  } catch(e) {}
}

async function handleProfileSave(user, originalEmail) {
  const nameIn = document.getElementById('profile-name');
  const emailIn = document.getElementById('profile-email');
  const descIn = document.getElementById('profile-desc');
  const avatarFileIn = document.getElementById('profile-avatar-file');
  const feedback = document.getElementById('profile-email-feedback');

  const newName = (nameIn.value || '').trim();
  const newEmailRaw = (emailIn.value || '').trim();
  const newEmail = newEmailRaw.toLowerCase();
  const newDesc = (descIn.value || '').trim();
  // start with existing values and only update when a file is uploaded
  let newAvatar = (user.avatarUrl && user.avatarUrl.length) ? user.avatarUrl : '';
  const bannerFileIn = document.getElementById('profile-banner-file');
  let newBanner = (user.bannerUrl && user.bannerUrl.length) ? user.bannerUrl : '';

  if (!newName || !newEmail) {
    if (feedback) feedback.textContent = 'Nome e email são obrigatórios.';
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    if (feedback) feedback.textContent = 'Email inválido.';
    return;
  }

  // check email uniqueness
  try {
    const usersJson = localStorage.getItem('users');
    const users = usersJson ? JSON.parse(usersJson) : [];
    const exists = users.find(u => u.email && u.email.toLowerCase() === newEmail && u.email.toLowerCase() !== (originalEmail||'').toLowerCase());
    if (exists) {
      if (feedback) feedback.textContent = 'Já existe uma conta com este email.';
      return;
    }
    // if file provided, convert to data URL
    if (avatarFileIn && avatarFileIn.files && avatarFileIn.files[0]) {
      const f = avatarFileIn.files[0];
      if (f.size > PROFILE_AVATAR_MAX_BYTES) {
        if (feedback) feedback.textContent = 'Arquivo muito grande. Máx 2MB.';
        return;
      }
      newAvatar = await readFileAsDataURL(f);
    }
    // banner file
    if (bannerFileIn && bannerFileIn.files && bannerFileIn.files[0]) {
      const bf = bannerFileIn.files[0];
      if (bf.size > PROFILE_AVATAR_MAX_BYTES) {
        if (feedback) feedback.textContent = 'Banner muito grande. Máx 2MB.';
        return;
      }
      newBanner = await readFileAsDataURL(bf);
    }

    // update users list (update existing or add new)
    const idx = users.findIndex(u => u.email && u.email.toLowerCase() === (originalEmail||'').toLowerCase());
    const nameParts = newName.split(/\s+/).filter(Boolean);
    if (idx >= 0) {
      users[idx].firstName = nameParts.length ? nameParts[0] : '';
      users[idx].lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      users[idx].email = newEmail;
      if (newAvatar) users[idx].avatarUrl = newAvatar;
      if (newBanner) users[idx].bannerUrl = newBanner;
      users[idx].description = newDesc;
    } else {
      // not found - add new user entry
      const newU = { firstName: nameParts[0] || '', lastName: nameParts.slice(1).join(' ') || '', email: newEmail, password: '', description: newDesc };
      if (newAvatar) newU.avatarUrl = newAvatar;
      if (newBanner) newU.bannerUrl = newBanner;
      users.push(newU);
    }
    localStorage.setItem('users', JSON.stringify(users));

    // notify other scripts in the same tab (and other tabs via storage event) that users changed
    try { window.dispatchEvent(new CustomEvent('flowpilot:users-updated', { detail: { email: newEmail } })); } catch(e) {}

    // update session object
    user.name = newName;
    // reuse nameParts from above
    user.firstName = nameParts.length ? nameParts[0] : '';
    user.lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    user.email = newEmail;
    user.description = newDesc;
    if (newAvatar) user.avatarUrl = newAvatar;
    if (newBanner) user.bannerUrl = newBanner;
    try { sessionStorage.setItem('loggedInUser', JSON.stringify(user)); } catch(e){}
    try { localStorage.setItem('rememberedUser', JSON.stringify(user)); } catch(e){}
    try { localStorage.setItem('loggedInUser', JSON.stringify(user)); } catch(e){}

    // update DOM
    const mainName = document.querySelector('.main-name');
    const titleSub = document.querySelector('.title-sub');
    const emailEl = document.querySelector('.email');
    const miniName = document.querySelector('.mini-name');
    const miniRole = document.querySelector('.mini-role');
    const descEl = document.querySelector('.desc');
    const mini = document.querySelector('.mini-photo');
    const big = document.querySelector('.avatar-big');
    const small = document.querySelector('.avatar-small');
    if (mainName) mainName.textContent = user.name;
    if (titleSub) titleSub.textContent = user.name;
    if (miniName) miniName.textContent = user.name;
    if (emailEl) emailEl.textContent = user.email;
    if (miniRole) miniRole.textContent = user.description;
    if (descEl) descEl.textContent = user.description || '';
    const avatarSrcUpdated = (user.avatarUrl && user.avatarUrl.length) ? user.avatarUrl : generateInitialsSVG(user.name || 'U');
    [mini, big, small].forEach(el => { if (el) el.src = avatarSrcUpdated; });
    // update banner DOM if present
    try {
      const coverBanner = document.querySelector('.cover-banner');
      if (coverBanner) {
        if (user.bannerUrl && user.bannerUrl.length) {
          coverBanner.style.backgroundImage = `url('${user.bannerUrl}')`;
          coverBanner.style.backgroundSize = 'cover';
          coverBanner.style.backgroundPosition = 'center';
        } else {
          coverBanner.style.backgroundImage = '';
        }
      }
    } catch(e) {}

    closeProfileModal();
    alert('Perfil atualizado com sucesso.');
  } catch (err) {
    console.error('Erro ao salvar perfil:', err);
    if (feedback) feedback.textContent = 'Erro ao salvar perfil.';
  }
}

