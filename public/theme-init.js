// public/theme-init.js
(function() {
  try {
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', savedTheme);
      document.documentElement.classList.add(savedTheme + '-theme');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark-theme');
    }
  } catch (e) {
    console.error('Erreur initialisation thème:', e);
  }
})();