const express = require('express');
const { addComment, getTicketComments, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authmiddleware');
const { apiLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

// Apply protection to all routes
router.use(protect);
router.use(apiLimiter);

// Routes for comments
router.route('/tickets/:ticketId/comments')
  .post(addComment)
  .get(getTicketComments);

// Comment deletion route
router.route('/:id').delete(deleteComment);

module.exports = router;
