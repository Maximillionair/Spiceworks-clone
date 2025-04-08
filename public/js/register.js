import { HelpdeskAPI } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  const errorAlert = document.getElementById('error-alert');
  const submitButton = form.querySelector('button[type="submit"]');
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    // Reset validation state
    form.classList.remove('was-validated');

    // Get form data
    const formData = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      password: form.password.value,
      confirmPassword: form.confirmPassword.value,
      role: form.role.value
    };

    // Validate form
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      form.confirmPassword.setCustomValidity('Passwords do not match');
      form.classList.add('was-validated');
      return;
    }

    try {
      setLoading(true);
      const response = await HelpdeskAPI.register(formData);
      
      if (response.success) {
        // Redirect to login page with success message
        window.location.href = '/login?alert=' + encodeURIComponent(response.message);
      } else {
        showError(response.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      showError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  });

  // Clear custom validity on password confirm input
  form.confirmPassword.addEventListener('input', () => {
    form.confirmPassword.setCustomValidity('');
  });
});