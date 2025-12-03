// Central profile widget: preenche avatares/nome/cargo em várias telas
(function(){
  function generateInitialsSVG(name) {
    try {
      if (!name) name = 'Usuário';
      const parts = (name||'').trim().split(/\s+/).filter(Boolean);
      let initials = 'U';
      if (parts.length === 1) initials = (parts[0][0]||'').toUpperCase();
      else if (parts.length > 1) initials = ((parts[0][0]||'') + (parts[parts.length-1][0]||'')).toUpperCase();
      const bg1 = '#2b94a6';
      const bg2 = '#45C6C4';
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>
        <rect width='128' height='128' rx='16' fill='${bg2}' />
        <circle cx='64' cy='48' r='36' fill='url(%23g)' />
        <text x='64' y='84' font-family='Poppins, Arial, sans-serif' font-size='44' text-anchor='middle' fill='#ffffff' font-weight='600'>${initials}</text>
      </svg>`;
      return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    } catch(e) { return '../static/imagens/avatar-default.svg'; }
  }

  function loadProfile() {
    let profile = null;
    try { const s = sessionStorage.getItem('loggedInUser'); if (s) profile = JSON.parse(s); } catch(e){}
    if (!profile) {
      try { const r = localStorage.getItem('rememberedUser'); if (r) profile = JSON.parse(r); } catch(e){}
    }

    // Small footprint: update common selectors if present
    const miniImg = document.querySelector('.mini-photo');
    const miniName = document.querySelector('.mini-name');
    const miniRole = document.querySelector('.mini-role');
    const avatarSmall = document.querySelector('.avatar-small');
    const avatarBig = document.querySelector('.avatar-big');
    const mainName = document.querySelector('.main-name');
    const titleSub = document.querySelector('.title-sub');
    const roleDisplay = document.querySelector('.role-display');
    const emailEl = document.querySelector('.email');
    const descEl = document.querySelector('.desc');

    if (!profile) {
      // fallback: set defaults where present
      if (miniImg) miniImg.src = generateInitialsSVG('V');
      if (miniName) miniName.textContent = 'Visitante';
      if (miniRole) miniRole.textContent = '';
      return;
    }

    const fullname = profile.name || ((profile.firstName||'') + (profile.lastName ? ' ' + profile.lastName : '')).trim() || profile.email || 'Usuário';

    if (miniName) miniName.textContent = fullname;
    if (miniRole) miniRole.textContent = profile.description || '';
    if (roleDisplay) roleDisplay.textContent = profile.description || '';
    if (mainName) mainName.textContent = fullname;
    if (titleSub) titleSub.textContent = fullname;
    if (emailEl && profile.email) emailEl.textContent = profile.email;
    if (descEl && profile.description) descEl.textContent = profile.description;

    const avatarSrc = profile.avatarUrl && profile.avatarUrl.length ? profile.avatarUrl : generateInitialsSVG(fullname);
    if (miniImg) miniImg.src = avatarSrc;
    if (avatarSmall) avatarSmall.src = avatarSrc;
    if (avatarBig) avatarBig.src = avatarSrc;
    // banner
    try {
      const coverBanner = document.querySelector('.cover-banner');
      if (coverBanner) {
        if (profile.bannerUrl && profile.bannerUrl.length) {
          coverBanner.style.backgroundImage = `url('${profile.bannerUrl}')`;
          coverBanner.style.backgroundSize = 'cover';
          coverBanner.style.backgroundPosition = 'center';
        } else {
          coverBanner.style.backgroundImage = '';
        }
      }
    } catch(e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadProfile);
  else loadProfile();
})();
