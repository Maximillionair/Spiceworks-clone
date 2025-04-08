const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  // Check if token exists in cookies (httpOnly)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // Also check if token is in the authorization header (for API clients)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    // Check if this is an API request or a view request
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    } else {
      // For view requests, redirect to login
      return res.redirect('/login?error=' + encodeURIComponent('Please log in to access this page'));
    }
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user to request object
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      // Check if this is an API request or a view request
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      } else {
        // For view requests, redirect to login
        return res.redirect('/login?error=' + encodeURIComponent('User not found. Please log in again.'));
      }
    }
    
    next();
  } catch (error) {
    // Check if this is an API request or a view request
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    } else {
      // For view requests, redirect to login
      return res.redirect('/login?error=' + encodeURIComponent('Session expired. Please log in again.'));
    }
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      // Check if this is an API request or a view request
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(403).json({
          success: false,
          message: `User role ${req.user ? req.user.role : 'unknown'} is not authorized to access this route`
        });
      } else {
        // For view requests, redirect to dashboard with error
        return res.redirect('/dashboard?error=' + encodeURIComponent('You are not authorized to access this page'));
      }
    }
    next();
  };
};