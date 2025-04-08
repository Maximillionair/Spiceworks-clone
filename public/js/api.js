// Helper function to make authenticated requests
const apiRequest = async (url, method = 'GET', body = null) => {
  const config = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  };

  if (body) config.body = JSON.stringify(body);

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API error');
    }
    
    return data;
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
};

// Auth related API calls
const register = async (userData) => {
  return await apiRequest('/api/auth/register', 'POST', userData);
};

const login = async (credentials) => {
  return await apiRequest('/api/auth/login', 'POST', credentials);
};

const logout = async () => {
  return await apiRequest('/api/auth/logout', 'GET');
};

const getCurrentUser = async () => {
  return await apiRequest('/api/auth/me');
};

// Ticket related API calls
const createTicket = async (ticketData) => {
  return await apiRequest('/api/tickets', 'POST', ticketData);
};

const getTickets = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return await apiRequest(`/api/tickets?${query}`);
};

const getTicketById = async (ticketId) => {
  return await apiRequest(`/api/tickets/${ticketId}`);
};

const getTicketStats = () => apiRequest('/api/tickets/stats');
const getRecentTickets = () => apiRequest('/api/tickets/recent');

// Export the API object
export const HelpdeskAPI = {
  register,
  login,
  logout,
  getCurrentUser,
  createTicket,
  getTickets,
  getTicketById,
  getTicketStats,
  getRecentTickets
};
  