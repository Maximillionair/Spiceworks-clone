// ticket-list.js
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.querySelector('#ticket-detail-modal');
    const modalContent = document.querySelector('#ticket-detail-content');
    const closeBtn = modal?.querySelector('.close');
  
    window.openTicketDetail = async (ticketId) => {
      try {
        const res = await fetch(`/api/tickets/${ticketId}`);
        const data = await res.json();
        if (res.ok) {
          renderTicketDetail(data.data);
          modal?.classList.add('show');
        } else {
          alert(data.message || 'Could not load ticket detail.');
        }
      } catch {
        alert('Server error loading ticket detail.');
      }
    };
  
    function renderTicketDetail(ticket) {
      modalContent.innerHTML = `
        <h3>${ticket.title}</h3>
        <p><strong>Status:</strong> ${ticket.status}</p>
        <p><strong>Priority:</strong> ${ticket.priority}</p>
        <p><strong>Description:</strong><br>${ticket.description}</p>
        <p><strong>Created:</strong> ${new Date(ticket.createdAt).toLocaleString()}</p>
      `;
    }
  
    closeBtn?.addEventListener('click', () => {
      modal?.classList.remove('show');
    });
  
    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  });
  