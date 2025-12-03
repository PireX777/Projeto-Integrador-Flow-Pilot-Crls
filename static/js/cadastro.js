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
      togglePassword.textContent = type === 'password' ? 'visibility_off' : 'visibility';
    });
  }

  // Forçar lowercase no campo de email enquanto digita
  if (emailInput) {
    emailInput.addEventListener('input', () => {
      const pos = emailInput.selectionStart;
      emailInput.value = emailInput.value.toLowerCase();
      try { emailInput.setSelectionRange(pos, pos); } catch(e) {}
    });
  }

  // criar elemento de feedback inline (após o campo de email)
  let emailFeedback = document.querySelector('#reg-email-feedback');
  if (!emailFeedback && emailInput) {
    emailFeedback = document.createElement('div');
    emailFeedback.id = 'reg-email-feedback';
    emailFeedback.style.marginTop = '6px';
    emailFeedback.style.fontSize = '13px';
    emailFeedback.style.color = '#c00';
    emailInput.parentNode.insertBefore(emailFeedback, emailInput.nextSibling);
  }

  const createBtn = document.querySelector('#create-account-btn');

  function isEmailTaken(value) {
    try {
      const usersJson = localStorage.getItem('users');
      const users = usersJson ? JSON.parse(usersJson) : [];
      return users.some(u => (u.email || '').toLowerCase() === (value || '').toLowerCase());
    } catch (e) { return false; }
  }

  function updateEmailFeedback() {
    const v = (emailInput.value || '').trim();
    if (!v) {
      emailFeedback.textContent = '';
      if (createBtn) createBtn.disabled = false;
      return;
    }
    if (!validateEmail(v)) {
      emailFeedback.style.color = '#c00';
      emailFeedback.textContent = 'Email inválido.';
      if (createBtn) createBtn.disabled = true;
      return;
    }
    if (isEmailTaken(v)) {
      emailFeedback.style.color = '#c00';
      emailFeedback.textContent = 'Este email já está sendo utilizado.';
      if (createBtn) createBtn.disabled = true;
      return;
    }
    emailFeedback.style.color = '#0a7';
    emailFeedback.textContent = '';
    if (createBtn) createBtn.disabled = false;
  }

  // trim on blur and update feedback
  if (emailInput) {
    emailInput.addEventListener('blur', () => {
      emailInput.value = emailInput.value.trim();
      updateEmailFeedback();
    });
    emailInput.addEventListener('input', () => {
      updateEmailFeedback();
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

    // adicionar novo usuário (armazenar email em lowercase para consistência)
    const newUser = {
      firstName: fname,
      lastName: lname,
      email: email.toLowerCase(),
      password: password
    };
    if (avatarUrl) newUser.avatarUrl = avatarUrl;
    if (role) newUser.description = role;
    users.push(newUser);

    localStorage.setItem('users', JSON.stringify(users));

    // Após cadastro, redirecionar para a tela de login (não efetuar auto-login)
    messageBox.style.color = 'green';
    messageBox.textContent = 'Conta criada com sucesso! Redirecionando para login...';
    setTimeout(() => {
      const target = `login2.html?registered=1&email=${encodeURIComponent(email.toLowerCase())}`;
      window.location.href = target;
    }, 700);
  });
});
