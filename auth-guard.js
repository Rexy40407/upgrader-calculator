'use strict';

(() => {
  const SESSION_KEY = 'nexo-session';
  const LOGIN_PATH = '/nexo-login/';

  function readSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      const session = JSON.parse(raw);
      if (session?.expiresAt > Date.now() && typeof session.username === 'string') return session;
    } catch {
      // Sessões malformadas são eliminadas abaixo.
    }
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }

  function loginUrl() {
    const login = new URL(LOGIN_PATH, location.origin);
    login.searchParams.set('return', `${location.pathname}${location.search}${location.hash}`);
    return login.href;
  }

  if (!readSession()) {
    location.replace(loginUrl());
    return;
  }

  document.documentElement.classList.remove('auth-pending');

  addEventListener('DOMContentLoaded', () => {
    document.querySelector('#logout')?.addEventListener('click', () => {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      location.replace(loginUrl());
    });
  });
})();
