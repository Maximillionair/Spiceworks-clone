document.addEventListener('DOMContentLoaded', async () => {
    try {
      // Fetch and display recent tickets
      const recentRes = await fetch('/api/tickets/recent');
      
      if (!recentRes.ok) {
        throw new Error('Failed to fetch recent tickets');
      }
      
      const recentTickets = await recentRes.json();
      const list = document.getElementById('recent-tickets-list');
      list.innerHTML = ''; // Clear loading state
  
      if (recentTickets.length === 0) {
        list.innerHTML = '<li>No recent tickets.</li>';
      } else {
        // Update counts
        const open = recentTickets.filter(t => t.status === 'Open').length;
        const inProgress = recentTickets.filter(t => t.status === 'In Progress').length;
        const resolved = recentTickets.filter(t => t.status === 'Resolved').length;
        
        document.getElementById('open-tickets-count').textContent = open;
        document.getElementById('in-progress-tickets-count').textContent = inProgress;
        document.getElementById('resolved-tickets-count').textContent = resolved;
        
        // List tickets
        recentTickets.forEach(ticket => {
          const li = document.createElement('li');
          li.className = 'ticket-item';
          li.innerHTML = `
            <strong>${ticket.title}</strong> - 
            <span class="badge badge-${ticket.status?.toLowerCase().replace(' ', '-')}">
              ${ticket.status || 'Open'}
            </span>
            <br>
            <small>${new Date(ticket.createdAt).toLocaleString()}</small>
          `;
          list.appendChild(li);
        });
      }
  
      // Handle form submission
      const ticketForm = document.querySelector('form[action="/api/tickets"]');
      if (ticketForm) {
        ticketForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const formData = new FormData(ticketForm);
          const ticketData = Object.fromEntries(formData.entries());
          
          try {
            const response = await fetch('/api/tickets', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(ticketData)
            });
            
            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to create ticket');
            }
            
            alert('Ticket submitted successfully!');
            ticketForm.reset();
            
            // Refresh the ticket list
            window.location.reload();
          } catch (err) {
            alert('Error submitting ticket: ' + err.message);
          }
        });
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      document.getElementById('recent-tickets-list').innerHTML = 
        '<li>Failed to load tickets. Please refresh the page.</li>';
    }
  });