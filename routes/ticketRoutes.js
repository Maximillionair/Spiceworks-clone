const express = require('express');
const { 
  createTicket, 
  getTickets, 
  getTicket, 
  updateTicket, 
  getTicketStats 
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/authmiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Routes for tickets
router.route('/')
  .post(createTicket)
  .get(getTickets);

router.route('/stats')
  .get(authorize('admin'), getTicketStats);

router.route('/:id')
  .get(getTicket)
  .put(authorize('admin'), updateTicket);

module.exports = router;