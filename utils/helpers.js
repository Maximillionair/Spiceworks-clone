const jwt = require('jsonwebtoken');

/**
 * Get the appropriate Bootstrap status class for a ticket status
 * @param {string} status - The ticket status
 * @returns {string} - The Bootstrap status class
 */
const getStatusClass = (status) => {
  switch (status) {
    case 'Open':
      return 'danger';
    case 'In Progress':
      return 'warning';
    case 'Resolved':
      return 'success';
    default:
      return 'secondary';
  }
};

/**
 * Set JWT token cookie for authentication
 * @param {Object} user - The user object
 * @param {Object} res - The response object
 */
const setTokenCookie = (user, res) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );

  res.cookie('token', token, {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
};

/**
 * Clear JWT token cookie for logout
 * @param {Object} res - The response object
 */
const clearTokenCookie = (res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
};

module.exports = {
  getStatusClass,
  setTokenCookie,
  clearTokenCookie
}; 