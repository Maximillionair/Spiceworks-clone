// login.js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#login-form');
    if (!form) return;
  
    form.addEventListener('submit', (e) => {
      const email = form.email.value.trim();
      const password = form.password.value.trim();
  
      if (!email || !password) {
        e.preventDefault();
        alert('Please fill in all fields.');
      }
    });
  });
  