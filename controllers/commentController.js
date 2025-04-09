const Ticket = require('../models/ticket');
const { validationResult } = require('express-validator');

// @desc    Add a comment to a ticket
// @route   POST /tickets/:ticketId/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const comment = {
      content: req.body.content,
      user: req.user._id,
      createdAt: new Date()
    };

    ticket.comments.push(comment);
    await ticket.save();

    res.redirect(`/tickets/${ticket._id}`);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get comments for ticket
// @route   GET /api/comments/tickets/:ticketId/comments
// @access  Private
exports.getTicketComments = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    
    if (!ticket) {
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(404).json({
          success: false,
          message: `No ticket found with id of ${req.params.ticketId}`
        });
      }
      return res.redirect(`/ticket/${req.params.ticketId}?error=Ticket not found`);
    }
    
    // Check if user is ticket owner or admin
    if (ticket.user.toString() !== req.user.id && req.user.role !== 'admin') {
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(403).json({
          success: false,
          message: `User ${req.user.id} is not authorized to view comments for this ticket`
        });
      }
      return res.redirect(`/ticket/${req.params.ticketId}?error=Not authorized to view comments for this ticket`);
    }
    
    const comments = await Comment.find({ ticket: req.params.ticketId })
      .populate({
        path: 'user',
        select: 'name role'
      })
      .sort('createdAt');
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(200).json({
        success: true,
        count: comments.length,
        data: comments
      });
    }
    
    // For view requests, this should be handled by viewRoutes.js
    res.redirect(`/ticket/${req.params.ticketId}`);
  } catch (error) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
    res.redirect(`/ticket/${req.params.ticketId}?error=${encodeURIComponent(error.message)}`);
  }
};

// @desc    Delete a comment from a ticket
// @route   DELETE /tickets/:ticketId/comments/:commentId
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const comment = ticket.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is admin or comment owner
    if (req.user.role !== 'admin' && comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    comment.remove();
    await ticket.save();

    res.redirect(`/tickets/${ticket._id}`);
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
