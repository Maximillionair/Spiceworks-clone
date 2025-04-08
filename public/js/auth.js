import { HelpdeskAPI } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('#loginForm');
    const registerForm = document.querySelector('#registerForm');
    const logoutLink = document.querySelector('#logout-link');
  
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
            window.location.href = data.redirect || '/tickets';
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
            window.location.href = data.redirect || '/login';
          } else {
            alert(data.message || 'Registration failed');
          }
        } catch (err) {
          console.error(err);
          alert('An error occurred during registration');
        }
      });
    }
  
    if (logoutLink) {
      logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        
        try {
          const response = await HelpdeskAPI.logout();
          
          if (response.success) {
            window.location.href = '/';
          } else {
            showAlert(response.message || 'Logout failed. Please try again.', 'danger');
          }
        } catch (error) {
          console.error('Logout error:', error);
          showAlert(error.message || 'An error occurred during logout. Please try again.', 'danger');
        }
      });
    }
  
    // Check if user is logged in
    const checkAuthStatus = async () => {
      try {
        const user = await HelpdeskAPI.getCurrentUser();
        return user;
      } catch (error) {
        console.error('Auth check error:', error);
        return null;
      }
    };
  
    // Initialize auth status
    checkAuthStatus().then(user => {
      if (user) {
        // User is logged in, update UI accordingly
        const authLinks = document.querySelectorAll('.auth-required');
        authLinks.forEach(link => {
          link.classList.remove('d-none');
        });
        
        const guestLinks = document.querySelectorAll('.guest-only');
        guestLinks.forEach(link => {
          link.classList.add('d-none');
        });
      } else {
        // User is not logged in, update UI accordingly
        const authLinks = document.querySelectorAll('.auth-required');
        authLinks.forEach(link => {
          link.classList.add('d-none');
        });
        
        const guestLinks = document.querySelectorAll('.guest-only');
        guestLinks.forEach(link => {
          link.classList.remove('d-none');
        });
      }
    });
  
    function showAlert(message, type) {
      const alertContainer = document.querySelector('.alert-container') || createAlertContainer();
      const alert = document.createElement('div');
      alert.className = `alert alert-${type} alert-dismissible fade show`;
      alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      alertContainer.appendChild(alert);
    }
  
    function createAlertContainer() {
      const container = document.createElement('div');
      container.className = 'alert-container position-fixed top-0 start-50 translate-middle-x p-3';
      container.style.zIndex = '1050';
      document.body.appendChild(container);
      return container;
    }
  });
  