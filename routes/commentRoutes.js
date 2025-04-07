const express = require('express');
const { deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authmiddleware');
const { apiLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

// Apply protection to all routes
router.use(protect);
router.use(apiLimiter);

// Comment deletion route should use ':id' for commentId
router.route('/:id').delete(deleteComment);

module.exports = router;
