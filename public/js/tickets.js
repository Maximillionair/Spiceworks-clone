import { HelpdeskAPI } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  const statusFilter = document.getElementById('status-filter');
  const ticketsTableBody = document.getElementById('tickets-table-body');
  const ticketDetailModal = document.getElementById('ticket-detail-modal');
  const ticketDetailContent = document.getElementById('ticket-detail-content');

  // Handle status filter changes
  statusFilter.addEventListener('change', async () => {
    const status = statusFilter.value;
    try {
      const tickets = await HelpdeskAPI.getTickets(status);
      updateTicketsTable(tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      alert('Failed to fetch tickets. Please try again.');
    }
  });

  // Handle view ticket button clicks
  document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('view-ticket')) {
      const ticketId = e.target.dataset.ticketId;
      try {
        const ticket = await HelpdeskAPI.getTicket(ticketId);
        showTicketDetails(ticket);
        $(ticketDetailModal).modal('show');
      } catch (error) {
        console.error('Error fetching ticket details:', error);
        alert('Failed to fetch ticket details. Please try again.');
      }
    }
  });

  // Update tickets table with new data
  function updateTicketsTable(tickets) {
    if (!tickets || tickets.length === 0) {
      ticketsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">No tickets found</td>
        </tr>
      `;
      return;
    }

    ticketsTableBody.innerHTML = tickets.map(ticket => `
      <tr>
        <td>${ticket.title}</td>
        <td>${ticket.category}</td>
        <td>
          <span class="badge badge-${ticket.status.toLowerCase().replace(' ', '-')}">
            ${ticket.status}
          </span>
        </td>
        <td>${new Date(ticket.createdAt).toLocaleDateString()}</td>
        <td>${new Date(ticket.updatedAt).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-sm btn-info view-ticket" data-ticket-id="${ticket._id}">
            View
          </button>
        </td>
      </tr>
    `).join('');
  }

  // Show ticket details in modal
  function showTicketDetails(ticket) {
    ticketDetailContent.innerHTML = `
      <div class="ticket-details">
        <h4>${ticket.title}</h4>
        <div class="ticket-meta mb-3">
          <span class="badge badge-${ticket.status.toLowerCase().replace(' ', '-')} mr-2">
            ${ticket.status}
          </span>
          <span class="badge badge-secondary mr-2">${ticket.category}</span>
          <small class="text-muted">
            Created: ${new Date(ticket.createdAt).toLocaleString()}
          </small>
        </div>
        <div class="ticket-description mb-3">
          <h5>Description</h5>
          <p>${ticket.description}</p>
        </div>
        ${ticket.comments && ticket.comments.length > 0 ? `
          <div class="ticket-comments">
            <h5>Comments</h5>
            ${ticket.comments.map(comment => `
              <div class="comment mb-2">
                <small class="text-muted">
                  ${new Date(comment.createdAt).toLocaleString()}
                </small>
                <p class="mb-0">${comment.content}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }
});