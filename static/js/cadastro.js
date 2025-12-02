document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#registration-form');
  const firstName = document.querySelector('#firstName');
  const lastName = document.querySelector('#lastName');
  const emailInput = document.querySelector('#reg-email');
  const passwordInput = document.querySelector('#reg-password');
  const togglePassword = document.querySelector('#toggle-password-reg');
  const terms = document.querySelector('#terms');
  const messageBox = document.querySelector('#reg-message');
  const roleInput = document.querySelector('#role');

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  if (togglePassword) {
    togglePassword.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
    });
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    messageBox.textContent = '';

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const fname = firstName.value.trim();
    const lname = lastName.value.trim();
    const role = roleInput ? roleInput.value.trim() : '';
    const avatarUrlField = (document.querySelector('#avatar-url') || { value: '' }).value.trim();
    const avatarFileInput = document.querySelector('#avatar-file');
    let avatarUrl = avatarUrlField;

    // If file uploaded, convert to data URL
    if (avatarFileInput && avatarFileInput.files && avatarFileInput.files[0]) {
      try {
        avatarUrl = await readFileAsDataURL(avatarFileInput.files[0]);
      } catch (err) {
        console.warn('Falha ao ler arquivo de avatar:', err);
      }
    }

    if (!fname || !lname || !email || !password) {
      messageBox.style.color = '#c00';
      messageBox.textContent = 'Preencha todos os campos.';
      return;
    }

    if (!validateEmail(email)) {
      messageBox.style.color = '#c00';
      messageBox.textContent = 'Email inválido.';
      return;
    }

    if (password.length < 4) {
      messageBox.style.color = '#c00';
      messageBox.textContent = 'Senha muito curta (mínimo 4 caracteres).';
      return;
    }

    if (!terms.checked) {
      messageBox.style.color = '#c00';
      messageBox.textContent = 'Você deve aceitar os termos de uso.';
      return;
    }

    // carregar usuários existentes
    const usersJson = localStorage.getItem('users');
    const users = usersJson ? JSON.parse(usersJson) : [];

    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      messageBox.style.color = '#c00';
      messageBox.textContent = 'Já existe uma conta com esse email.';
      return;
    }

    // adicionar novo usuário
    const newUser = {
      firstName: fname,
      lastName: lname,
      email: email,
      password: password
    };
    if (avatarUrl) newUser.avatarUrl = avatarUrl;
    if (role) newUser.description = role;
    users.push(newUser);

    localStorage.setItem('users', JSON.stringify(users));

    // preparar sessão do usuário recém-criado e redirecionar para o perfil
    const logged = {
      email: newUser.email,
      name: (newUser.firstName || '') + (newUser.lastName ? (' ' + newUser.lastName) : ''),
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      avatarUrl: newUser.avatarUrl || '',
      description: newUser.description || '',
      contacts: 21,
      teams: ['EQUIPE 1 - Membro', 'EQUIPE 2 - Membro']
    };
    try { sessionStorage.setItem('loggedInUser', JSON.stringify(logged)); } catch(e){}

    messageBox.style.color = 'green';
    messageBox.textContent = 'Conta criada com sucesso! Entrando no perfil...';

    setTimeout(() => {
      window.location.href = 'telausuario.html';
    }, 900);
  });
});
