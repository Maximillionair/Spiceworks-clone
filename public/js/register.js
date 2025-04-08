document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    if (!registerForm) return;
  
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const userData = {
        name: registerForm.name.value,
        email: registerForm.email.value,
        password: registerForm.password.value,
        role: registerForm.role?.value || 'user'  // if you have roles
      };
  
      try {
        await HelpdeskAPI.register(userData);
        alert('Registration successful. You can now log in.');
        window.location.href = '/login';
      } catch (err) {
        alert(`Registration failed: ${err.message}`);
      }
    });
  });