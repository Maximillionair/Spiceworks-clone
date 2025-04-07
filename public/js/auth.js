document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('#loginForm');
    const registerForm = document.querySelector('#registerForm');
    const logoutBtn = document.querySelector('#logoutBtn');
  
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.email.value.trim();
        const password = loginForm.password.value.trim();
  
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
  
          const data = await res.json();
          if (data.success) {
            window.location.href = '/dashboard';
          } else {
            alert(data.message || 'Login failed');
          }
        } catch (err) {
          console.error(err);
          alert('An error occurred during login');
        }
      });
    }
  
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = registerForm.name.value.trim();
        const email = registerForm.email.value.trim();
        const password = registerForm.password.value.trim();
        const role = registerForm.role?.value || 'user';
  
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
          });
  
          const data = await res.json();
          if (data.success) {
            window.location.href = '/dashboard';
          } else {
            alert(data.message || 'Registration failed');
          }
        } catch (err) {
          console.error(err);
          alert('An error occurred during registration');
        }
      });
    }
  
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await fetch('/api/auth/logout');
          window.location.href = '/';
        } catch (err) {
          console.error(err);
          alert('Error logging out');
        }
      });
    }
  });
  