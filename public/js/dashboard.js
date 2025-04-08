import { HelpdeskAPI } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Fetch and display recent tickets
  const fetchRecentTickets = async () => {
    try {
      const tickets = await HelpdeskAPI.getRecentTickets();
      
      // Update ticket counts
      const counts = {
        'Åpen': 0,
        'Under arbeid': 0,
        'Løst': 0
      };
      
      tickets.forEach(ticket => {
        counts[ticket.status] = (counts[ticket.status] || 0) + 1;
      });
      
      // Update the count displays
      document.getElementById('open-tickets-count').textContent = counts['Åpen'] || 0;
      document.getElementById('in-progress-tickets-count').textContent = counts['Under arbeid'] || 0;
      document.getElementById('resolved-tickets-count').textContent = counts['Løst'] || 0;
      
      // Display recent tickets
      const ticketList = document.getElementById('recent-tickets-list');
      if (!ticketList) {
        console.error('Recent tickets list element not found');
        return;
      }
      
      if (tickets.length === 0) {
        ticketList.innerHTML = '<li class="text-muted">No tickets found</li>';
      } else {
        ticketList.innerHTML = tickets.map(ticket => `
          <li class="mb-3">
            <div class="d-flex justify-content-between align-items-center">
              <strong>${ticket.title}</strong>
              <span class="badge badge-${getStatusClass(ticket.status)}">${ticket.status}</span>
            </div>
            <small class="text-muted">${new Date(ticket.createdAt).toLocaleDateString()}</small>
          </li>
        `).join('');
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      const ticketList = document.getElementById('recent-tickets-list');
      if (ticketList) {
        ticketList.innerHTML = '<li class="text-danger">Failed to load tickets. Please try again later.</li>';
      }
      showAlert('Failed to load tickets. Please try again later.', 'danger');
    }
  };

  // Handle ticket form submission
  const ticketForm = document.getElementById('ticket-form');
  if (ticketForm) {
    ticketForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = ticketForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...';
      }
      
      const formData = new FormData(ticketForm);
      const ticketData = {
        title: formData.get('title'),
        description: formData.get('description'),
        category: formData.get('category')
      };
      
      try {
        const response = await HelpdeskAPI.createTicket(ticketData);
        
        // Reset form and refresh ticket list
        ticketForm.reset();
        await fetchRecentTickets();
        showAlert('Ticket created successfully!', 'success');
      } catch (error) {
        console.error('Error creating ticket:', error);
        showAlert(error.message || 'Failed to create ticket. Please try again.', 'danger');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Ticket';
        }
      }
    });
  }

  // Helper function to get status class
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
  
  // Show alert function
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

  // Initial fetch
  await fetchRecentTickets();
});