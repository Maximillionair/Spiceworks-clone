const rateLimit = require('express-rate-limit');

// Create rate limiting middleware
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute window
  max: 5, // Limit each IP to 5 requests per windowMs for login attempts
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: true // Only count failed requests
});

// Create a more generous limiter for general API routes
const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minute window
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again after 10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginLimiter,
  apiLimiter
};