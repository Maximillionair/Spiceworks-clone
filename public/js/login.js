import { HelpdeskAPI } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const errorAlert = document.getElementById('error-alert');
  const submitButton = loginForm.querySelector('button[type="submit"]');
  const spinner = submitButton.querySelector('.spinner-border');

  function showError(message) {
    errorAlert.textContent = message;
    errorAlert.classList.remove('d-none');
  }

  function hideError() {
    errorAlert.classList.add('d-none');
  }

  function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    spinner.classList.toggle('d-none', !isLoading);
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const formData = {
      email: loginForm.email.value.trim(),
      password: loginForm.password.value
    };

    try {
      setLoading(true);
      const response = await HelpdeskAPI.login(formData);
      
      if (response.success) {
        window.location.href = '/dashboard';
      } else {
        showError(response.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      showError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  });
});
  