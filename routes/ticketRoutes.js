const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authmiddleware');
const { validateTicketInput, validateCommentInput } = require('../middleware/validatorMiddleware');
const {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  addComment
} = require('../controllers/ticketController');

// Apply protection to all routes
router.use(protect);

// Routes for tickets
router.route('/')
  .get(getTickets)
  .post(validateTicketInput, createTicket);

router.route('/:id')
  .get(getTicket)
  .put(validateTicketInput, updateTicket)
  .delete(deleteTicket);

// Route for adding comments to a ticket
router.post('/:id/comments', validateCommentInput, addComment);

module.exports = router;