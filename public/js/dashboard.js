
document.addEventListener("DOMContentLoaded", async () => {
    try {
      // Fetch ticket stats
      const statsRes = await fetch("/api/tickets/stats");
      if (!statsRes.ok) throw new Error("Failed to fetch ticket stats");
      const stats = await statsRes.json();
  
      document.getElementById("open-tickets-count").textContent = stats.open || 0;
      document.getElementById("in-progress-tickets-count").textContent = stats.inProgress || 0;
      document.getElementById("resolved-tickets-count").textContent = stats.resolved || 0;
  
      // Fetch recent tickets
      const recentRes = await fetch("/api/tickets/recent");
      if (!recentRes.ok) throw new Error("Failed to fetch recent tickets");
      const recent = await recentRes.json();
  
      const ticketList = document.getElementById("recent-tickets-list");
      ticketList.innerHTML = "";
  
      if (recent.length === 0) {
        ticketList.innerHTML = "<li>No recent tickets found.</li>";
      } else {
        recent.forEach(ticket => {
          const li = document.createElement("li");
          li.innerHTML = `
            <strong>${ticket.title}</strong> <br>
            <small>Status: ${ticket.status}</small> <br>
            <small>Category: ${ticket.category}</small>
          `;
          ticketList.appendChild(li);
        });
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      const ticketList = document.getElementById("recent-tickets-list");
      ticketList.innerHTML = "<li class='text-danger'>Unable to load dashboard data.</li>";
    }
  });
  