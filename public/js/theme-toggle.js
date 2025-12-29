function initTheme() {
  const theme = document.documentElement.getAttribute('data-theme');
  const toggleButton = document.getElementById('theme-toggle');
  toggleButton.textContent = theme === 'light' ? 'DARK' : 'LIGHT';

  toggleButton.addEventListener('click', () => {
    // Add transition class only when toggling
    document.documentElement.classList.add('theme-transition');

    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    toggleButton.textContent = newTheme === 'light' ? 'DARK' : 'LIGHT';

    // Remove transition class after animation completes
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 300);
  });
}

// Run on page load
document.addEventListener('DOMContentLoaded', initTheme); 