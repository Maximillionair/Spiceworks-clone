const express = require('express');
const { register, login, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.get('/logout', logout);
router.get('/me', protect, getMe);

module.exports = router;