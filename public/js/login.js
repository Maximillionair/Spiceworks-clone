document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('#login-form');
    if (!loginForm) return;
  
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.email.value;
      const password = loginForm.password.value;
  
      try {
        await apiRequest('/api/auth/login', 'POST', { email, password });
        window.location.href = '/dashboard';
      } catch (err) {
        alert('Login failed: ' + err.message);
      }
    });
  });
  