document.addEventListener('DOMContentLoaded', async () => {
    try {
      // Fetch and display ticket stats
      const statsRes = await fetch('/api/tickets/stats');
      const stats = await statsRes.json();
  
      document.getElementById('open-tickets-count').textContent = stats.open || 0;
      document.getElementById('in-progress-tickets-count').textContent = stats.inProgress || 0;
      document.getElementById('resolved-tickets-count').textContent = stats.resolved || 0;
  
      // Fetch and render recent tickets
      const recentRes = await fetch('/api/tickets/recent');
      const recentTickets = await recentRes.json();
  
      const list = document.getElementById('recent-tickets-list');
      list.innerHTML = ''; // Clear loading state
  
      if (recentTickets.length === 0) {
        list.innerHTML = '<li>No recent tickets.</li>';
      } else {
        recentTickets.forEach(ticket => {
          const li = document.createElement('li');
          li.innerHTML = `<strong>${ticket.title}</strong> - ${ticket.category} (${ticket.status})`;
          list.appendChild(li);
        });
      }
  
      // Optional: handle form submission with JS instead of traditional POST
      const ticketForm = document.querySelector('form[action="/api/tickets"]');
      if (ticketForm) {
        ticketForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = new FormData(ticketForm);
          const ticketData = Object.fromEntries(formData.entries());
  
          try {
            await HelpdeskAPI.createTicket(ticketData);
            alert('Ticket submitted successfully!');
            ticketForm.reset();
          } catch (err) {
            alert('Error submitting ticket: ' + err.message);
          }
        });
      }
  
    } catch (err) {
      console.error('Error loading dashboard:', err);
    }
  });
  