const express = require('express');
const { deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Apply protection to all routes
router.use(protect);
router.use(apiLimiter);

router.route('/:id').delete(deleteComment);

module.exports = router;