// register.js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#register-form');
    if (!form) return;
  
    form.addEventListener('submit', (e) => {
      const password = form.password.value;
      const confirm = form['password-confirm'].value;
  
      if (password !== confirm) {
        e.preventDefault();
        alert('Passwords do not match.');
        return false;
      }
    });
  });
  