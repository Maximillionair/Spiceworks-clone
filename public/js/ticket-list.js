// ticket-list.js
import { HelpdeskAPI } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.querySelector('#ticket-detail-modal');
    const modalContent = document.querySelector('#ticket-detail-content');
    const closeBtn = modal?.querySelector('.close');
  
    window.openTicketDetail = async (ticketId) => {
      try {
        const ticket = await HelpdeskAPI.getTicketById(ticketId);
        if (ticket) {
          renderTicketDetail(ticket);
          modal?.classList.add('show');
        } else {
          showAlert('Could not load ticket details.', 'danger');
        }
      } catch (error) {
        console.error('Error loading ticket details:', error);
        showAlert('Failed to load ticket details. Please try again.', 'danger');
      }
    };
  
    function renderTicketDetail(ticket) {
      if (!modalContent) return;
      
      modalContent.innerHTML = `
        <div class="modal-header">
          <h3>${ticket.title}</h3>
          <span class="badge badge-${getStatusClass(ticket.status)}">${ticket.status}</span>
        </div>
        <div class="modal-body">
          <p><strong>Category:</strong> ${ticket.category}</p>
          <p><strong>Description:</strong></p>
          <div class="ticket-description">${ticket.description}</div>
          <p><strong>Created:</strong> ${new Date(ticket.createdAt).toLocaleString()}</p>
          <p><strong>Last Updated:</strong> ${new Date(ticket.updatedAt).toLocaleString()}</p>
        </div>
        <div class="modal-footer">
          <a href="/ticket/${ticket._id}" class="btn btn-primary">View Full Details</a>
        </div>
      `;
    }
  
    function getStatusClass(status) {
      switch (status) {
        case 'Åpen':
          return 'danger';
        case 'Under arbeid':
          return 'warning';
        case 'Løst':
          return 'success';
        default:
          return 'secondary';
      }
    }
  
    closeBtn?.addEventListener('click', () => {
      modal?.classList.remove('show');
    });
  
    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
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
  