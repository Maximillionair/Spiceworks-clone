const express = require('express');
const { 
  createTicket, 
  getTickets, 
  getTicket, 
  updateTicket, 
  getTicketStats, 
  getRecentTickets
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/authmiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// API routes for tickets
router.route('/')
  .post(createTicket)
  .get(getTickets);

// Route for recent tickets
router.get('/recent', getRecentTickets);

// Route for ticket statistics
router.get('/stats', authorize('admin'), getTicketStats);

// Routes for individual tickets
router.route('/:id')
  .get(getTicket)
  .put(authorize('admin'), updateTicket);

module.exports = router;