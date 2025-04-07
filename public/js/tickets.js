// tickets.js
document.addEventListener('DOMContentLoaded', () => {
    const statusFilter = document.querySelector('#status-filter');
    const ticketList = document.querySelector('#all-tickets-list');
  
    if (!ticketList) return;
  
    statusFilter?.addEventListener('change', async () => {
      const status = statusFilter.value;
      fetchAndRenderTickets({ status });
    });
  
    async function fetchAndRenderTickets(filters = {}) {
      try {
        const query = new URLSearchParams(filters).toString();
        const res = await fetch(`/api/tickets?${query}`);
        const data = await res.json();
        if (res.ok) {
          renderTickets(data.data);
        } else {
          ticketList.innerHTML = `<li>${data.message || 'Could not fetch tickets'}</li>`;
        }
      } catch {
        ticketList.innerHTML = `<li>Server error loading tickets</li>`;
      }
    }
  
    function renderTickets(tickets) {
      ticketList.innerHTML = '';
      if (tickets.length === 0) {
        ticketList.innerHTML = `<li>No tickets found.</li>`;
        return;
      }
  
      tickets.forEach(ticket => {
        const li = document.createElement('li');
        li.className = 'ticket-item';
        li.dataset.ticketId = ticket._id;
        li.innerHTML = `
          <strong>${ticket.title}</strong> - 
          <span class="badge badge-${ticket.status.toLowerCase().replace(' ', '-')}">
            ${ticket.status}
          </span>
          <br>
          <small>${new Date(ticket.createdAt).toLocaleString()}</small>
        `;
        li.addEventListener('click', () => openTicketDetail(ticket._id));
        ticketList.appendChild(li);
      });
    }
  
    fetchAndRenderTickets(); // Initial load
  });
  