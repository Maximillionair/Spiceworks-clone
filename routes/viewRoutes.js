const express = require('express');
const { protect } = require('../middleware/authmiddleware');
const router = express.Router();

// Public routes
router.get('/', (req, res) => {
  res.render('index');
});

router.get('/login', (req, res) => {
  res.render('login');
});

router.get('/register', (req, res) => {
  res.render('register');
});

// Protected routes - require authentication
router.get('/dashboard', protect, (req, res) => {
  res.render('dashboard');
});

router.get('/tickets', protect, (req, res) => {
  res.render('ticketpage');
});

router.get('/ticket/:id', protect, (req, res) => {
  // You can pass the ticket ID to the template
  res.render('ticketdetail', { ticketId: req.params.ticketId });
});

module.exports = router;