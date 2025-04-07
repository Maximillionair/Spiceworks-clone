const express = require('express');
const {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  getTicketStats
} = require('../controllers/ticketController');

const { getTicketComments, addComment } = require('../controllers/commentController');

const { protect, authorize } = require('../middleware/authmiddleware');
const { apiLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

// Apply protection to all routes
router.use(protect);
router.use(apiLimiter);

// Ticket routes
router.route('/')
  .get(getTickets)
  .post(createTicket);

router.route('/stats')
  .get(authorize('admin'), getTicketStats);

router.route('/:ticketId')  // Ensure ':ticketId' matches the parameter used in your controllers
  .get(getTicket)
  .put(authorize('admin'), updateTicket);

// Comment routes
router.route('/:ticketId/comments')  // Ensure ':ticketId' matches the parameter used in your controllers
  .get(getTicketComments)
  .post(addComment);

module.exports = router;
