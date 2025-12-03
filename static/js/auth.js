// auth.js - simple front-end route protection
(function(){
  function ensureLoggedIn(redirectTo) {
    try {
      const logged = sessionStorage.getItem('loggedInUser') || localStorage.getItem('rememberedUser');
      if (!logged) {
        // redirect to login with return url
        const returnUrl = window.location.pathname.split('/').pop();
        const target = `login2.html?return=${encodeURIComponent(returnUrl)}`;
        window.location.href = target;
        return false;
      }
      return true;
    } catch (e) {
      window.location.href = 'login2.html';
      return false;
    }
  }

  // expose helper globally
  window.__auth = { ensureLoggedIn };
})();
