const express = require('express');
const { register, login, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authmiddleware');
const { loginLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

// API routes
router.post('/register', register);
router.post('/login', loginLimiter, login);
router.get('/logout', logout);
router.get('/me', protect, getMe);

module.exports = router;