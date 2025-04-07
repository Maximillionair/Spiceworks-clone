const express = require('express');
const { deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authmiddleware');
const { apiLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

// Apply protection to all routes
router.use(protect);
router.use(apiLimiter);

// Use ticketId as the parameter here to match the routes
router.route('/:ticketId/comments/:id').delete(deleteComment);  // Use both ticketId and commentId

module.exports = router;
