const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { addComment, deleteComment } = require('../controllers/commentController');
const { check } = require('express-validator');

// @route   POST /tickets/:ticketId/comments
router.post(
  '/tickets/:ticketId/comments',
  protect,
  [
    check('content', 'Comment content is required').not().isEmpty()
  ],
  addComment
);

// @route   DELETE /tickets/:ticketId/comments/:commentId
router.delete(
  '/tickets/:ticketId/comments/:commentId',
  protect,
  deleteComment
);

module.exports = router;
