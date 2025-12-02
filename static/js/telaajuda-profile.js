function generateInitialsSVG(name) {
  if (!name) name = 'Usuário';
  const initials = name.split(' ').map(n => n[0] || '').slice(0,2).join('').toUpperCase();
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'>
    <rect width='100%' height='100%' fill='#00A896' rx='12' />
    <text x='50%' y='50%' dy='.35em' text-anchor='middle' font-family='Poppins, Arial, sans-serif' font-size='30' fill='#fff'>${initials}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function loadProfileMini() {
  let profile = null;
  try {
    const s = sessionStorage.getItem('loggedInUser');
    if (s) profile = JSON.parse(s);
  } catch (e) {}
  if (!profile) {
    try {
      const r = localStorage.getItem('rememberedUser');
      if (r) profile = JSON.parse(r);
    } catch (e) {}
  }

  const imgEl = document.querySelector('.mini-photo');
  const nameEl = document.querySelector('.mini-name');
  const roleEl = document.querySelector('.mini-role');

  if (!imgEl || !nameEl || !roleEl) return;

  if (profile) {
    nameEl.textContent = profile.name || (profile.firstName ? (profile.firstName + (profile.lastName ? ' ' + profile.lastName : '')) : 'Usuário');
    roleEl.textContent = profile.description || 'Membro';
    if (profile.avatarUrl) {
      imgEl.src = profile.avatarUrl;
    } else {
      imgEl.src = generateInitialsSVG(nameEl.textContent);
    }
  } else {
    nameEl.textContent = 'Visitante';
    roleEl.textContent = '';
    imgEl.src = generateInitialsSVG('V');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadProfileMini();
});
