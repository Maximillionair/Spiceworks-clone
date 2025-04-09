const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authmiddleware');
const { validateTicket, validateComment } = require('../middleware/validators');
const {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  addComment,
  assignTicket,
  submitFeedback,
  searchTickets
} = require('../controllers/ticketController');

// Apply protection to all routes
router.use(protect);

// Search route
router.get('/search', searchTickets);

// Routes for tickets
router.route('/')
  .get(getTickets)
  .post(validateTicket, createTicket);

// routes/ticketRoutes.js
router.route('/:id')
  .get(getTicket)
  .put(validateTicket, updateTicket)
  .delete(protect, authorize('admin'), deleteTicket);

// Route for adding comments to a ticket
router.post('/:id/comments', validateComment, addComment);

// Route for assigning tickets
router.put('/:id/assign', authorize('admin'), assignTicket);

// Route for submitting feedback
router.post('/:id/feedback', submitFeedback);

module.exports = router;