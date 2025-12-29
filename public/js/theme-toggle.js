function initTheme() {
  const theme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  
  const toggleButton = document.getElementById('theme-toggle');
  toggleButton.textContent = theme === 'light' ? 'DARK' : 'LIGHT';
  
  toggleButton.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    toggleButton.textContent = newTheme === 'light' ? 'DARK' : 'LIGHT';
  });
}

// Run on page load
document.addEventListener('DOMContentLoaded', initTheme); 