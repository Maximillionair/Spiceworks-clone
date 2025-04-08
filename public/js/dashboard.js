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
  
  document.addEventListener('DOMContentLoaded', () => {
    // Update ticket stats
    const updateStats = (tickets) => {
      const open = tickets.filter(t => t.status === 'Open').length;
      const inProgress = tickets.filter(t => t.status === 'In Progress').length;
      const resolved = tickets.filter(t => t.status === 'Resolved').length;
  
      document.getElementById('open-tickets-count').textContent = open;
      document.getElementById('in-progress-tickets-count').textContent = inProgress;
      document.getElementById('resolved-tickets-count').textContent = resolved;
    };
  
    // Load recent tickets
    const loadRecentTickets = async () => {
      try {
        const tickets = await HelpdeskAPI.getTickets();
        updateStats(tickets);
  
        const list = document.getElementById('recent-tickets-list');
        list.innerHTML = '';
  
        if (tickets.length === 0) {
          list.innerHTML = '<li>No tickets found.</li>';
          return;
        }
  
        tickets.slice(0, 5).forEach(ticket => {
          const li = document.createElement('li');
          li.innerHTML = `
            <strong>${ticket.title}</strong> - ${ticket.category} 
            <span class="badge">${ticket.status}</span>
          `;
          list.appendChild(li);
        });
      } catch (err) {
        console.error('Failed to load tickets:', err);
      }
    };
  
    // Handle ticket form submission
    const ticketForm = document.querySelector('form[action="/api/tickets"]');
    if (ticketForm) {
      ticketForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const ticketData = {
          title: ticketForm.title.value,
          category: ticketForm.category.value,
          description: ticketForm.description.value
        };
  
        try {
          await HelpdeskAPI.createTicket(ticketData);
          alert('Ticket submitted successfully');
          ticketForm.reset();
          loadRecentTickets(); // Refresh stats & list
        } catch (err) {
          alert(`Failed to create ticket: ${err.message}`);
        }
      });
    }
  
    // Init dashboard
    loadRecentTickets();
  });
  