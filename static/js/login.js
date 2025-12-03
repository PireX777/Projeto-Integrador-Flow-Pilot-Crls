document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#login-form");
  const emailInput = document.querySelector("#email");
  const passwordInput = document.querySelector("#password");
  const togglePassword = document.querySelector("#toggle-password");
  const rememberCheckbox = document.querySelector("#remember");
  const errorBox = document.querySelector("#error-message");

  // Mostrar/ocultar senha
  togglePassword.addEventListener("click", () => {
    const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
    const icon = togglePassword.querySelector("i");
    if (icon) {
      icon.className = type === "password" ? "fa-regular fa-eye" : "fa-regular fa-eye-slash";
    }
  });

  // Forçar lowercase no campo de email enquanto digita
  if (emailInput) {
    emailInput.addEventListener('input', () => {
      const pos = emailInput.selectionStart;
      emailInput.value = emailInput.value.toLowerCase();
      try { emailInput.setSelectionRange(pos, pos); } catch(e) {}
    });
  }

  // Validação e simulação de login
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    errorBox.textContent = "";

    if (!email || !password) {
      errorBox.textContent = "Preencha todos os campos.";
      return;
    }

    if (!validateEmail(email)) {
      errorBox.textContent = "Email inválido.";
      return;
    }

    // Simulação de login: verificar usuários salvos em localStorage
    const usersJson = localStorage.getItem("users");
    const users = usersJson ? JSON.parse(usersJson) : [];

    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    // Se não existe usuário cadastrado com esse email, mostrar mensagem e link para cadastro
    if (!found) {
      errorBox.style.color = '#c00';
      const target = `cadastro.html?email=${encodeURIComponent(email)}`;
      errorBox.innerHTML = `Usuário não encontrado. Redirecionando para cadastro... <a href="${target}">Criar conta</a>`;
      // redirecionar automaticamente após 2.5s
      setTimeout(() => { window.location.href = target; }, 2500);
      return;
    }

    if (found && found.password === password) {
      // marcar sessão simples com mais dados (nome completo e avatar)
      const name = (found.firstName || '') + (found.lastName ? (' ' + found.lastName) : '');
      const logged = {
        email: found.email,
        name: name.trim() || found.email,
        firstName: found.firstName || '',
        lastName: found.lastName || '',
        avatarUrl: found.avatarUrl || '' ,
        description: found.description || '',
        contacts: found.contacts || 21
      };
      sessionStorage.setItem("loggedInUser", JSON.stringify(logged));
        if (rememberCheckbox.checked) {
          try { localStorage.setItem('rememberedUser', JSON.stringify(logged)); } catch(e) { /* ignore */ }
        } else {
          // remove profile remembered but keep rememberedEmail behavior for backwards compat
          try { localStorage.removeItem('rememberedUser'); } catch(e) {}
          localStorage.removeItem('rememberedEmail');
        }
    alert("Login bem-sucedido!");
    // Redirecionar para a página de origem (se veio com return), caso contrário para o perfil
    try {
      const params = new URLSearchParams(window.location.search);
      const ret = params.get('return');
      if (ret) {
        // basic safety: only redirect to a local template name (no protocol)
        const safe = ret.replace(/[^a-zA-Z0-9_\-\.]/g, '');
        window.location.href = safe;
        return;
      }
    } catch(e) { /* ignore */ }
    window.location.href = "telausuario.html";
      return;
    }

    // fallback: credencial hard-coded antiga (compatibilidade)
    if (email === "helena.moura.flow@gmail.com" && password === "123456") {
      const fallback = { email: email, name: 'Helena Moura', firstName: 'Helena', lastName: 'Moura', avatarUrl: '../static/imagens/avatar-default.svg', description: 'Coordenadora de Eficiência Operacional', contacts: 21 };
      sessionStorage.setItem("loggedInUser", JSON.stringify(fallback));
      if (rememberCheckbox.checked) {
        try { localStorage.setItem('rememberedUser', JSON.stringify(fallback)); } catch(e){}
      } else {
        localStorage.removeItem('rememberedUser');
        localStorage.removeItem('rememberedEmail');
      }
  alert("Login bem-sucedido!");
  window.location.href = "telausuario.html";
      return;
    }

    errorBox.textContent = "Email ou senha incorretos.";
  });

  // verificar parâmetros de URL para mensagens e prefills
  (function handleUrlParams() {
    try {
      const params = new URLSearchParams(window.location.search);
      const prefillEmail = params.get('email');
      const registered = params.get('registered');
      if (prefillEmail) emailInput.value = prefillEmail;
      if (registered === '1') {
        errorBox.style.color = 'green';
        errorBox.textContent = 'Conta criada com sucesso. Faça login.';
        setTimeout(() => { errorBox.textContent = ''; errorBox.style.color = '#c00'; }, 4000);
      }
    } catch (e) { /* ignore */ }
  })();

  // Carregar dados salvos (email e perfil) se o usuário marcou "lembrar"
  try {
    const rememberedUserJson = localStorage.getItem('rememberedUser');
    if (rememberedUserJson) {
      const remembered = JSON.parse(rememberedUserJson);
      if (remembered.email) emailInput.value = remembered.email;
      rememberCheckbox.checked = true;
    } else {
      const savedEmail = localStorage.getItem("rememberedEmail");
      if (savedEmail) {
        emailInput.value = savedEmail;
        rememberCheckbox.checked = true;
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar usuário lembrado:', err);
  }

  // Função de validação de email
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
});
