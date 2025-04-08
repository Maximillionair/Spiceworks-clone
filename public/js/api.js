// Helper function to make authenticated requests
const apiRequest = async (url, method = 'GET', body = null) => {
    const config = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    };
  
    if (body) config.body = JSON.stringify(body);
  
    const response = await fetch(url, config);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'API error');
    return data;
  };
  
  const register = async (userData) => {
    return await apiRequest('/api/users', 'POST', userData);
  };
  

  // Fetch current user
  const getCurrentUser = async () => {
    return await apiRequest('/api/auth/me');
  };
  
  // Create a new ticket
  const createTicket = async (ticketData) => {
    return await apiRequest('/api/tickets', 'POST', ticketData);
  };
  
  // Get all tickets (admin) or user tickets
  const getTickets = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await apiRequest(`/api/tickets?${query}`);
  };
  
  // Get a single ticket by ID
  const getTicketById = async (ticketId) => {
    return await apiRequest(`/api/tickets/${ticketId}`);
  };

  const getTicketStats = () => apiRequest('/api/tickets/stats');
const getRecentTickets = () => apiRequest('/api/tickets/recent');

  
  // Export if needed
  window.HelpdeskAPI = {
    getCurrentUser,
    createTicket,
    getTickets,
    getTicketById,
    getTicketStats,
    getRecentTickets
  };
  