const Comment = require('../models/comment');
const Ticket = require('../models/ticket');

// @desc    Add comment to ticket
// @route   POST /api/comments/tickets/:ticketId/comments
// @access  Private
exports.addComment = async (req, res, next) => {
  try {
    req.body.ticket = req.params.ticketId;
    req.body.user = req.user.id;
    
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
          message: `User ${req.user.id} is not authorized to add a comment to this ticket`
        });
      }
      return res.redirect(`/ticket/${req.params.ticketId}?error=Not authorized to add a comment to this ticket`);
    }
    
    const comment = await Comment.create(req.body);
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(201).json({
        success: true,
        data: comment
      });
    }
    
    res.redirect(`/ticket/${req.params.ticketId}?success=Comment added successfully`);
  } catch (error) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.redirect(`/ticket/${req.params.ticketId}?error=${encodeURIComponent(error.message)}`);
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

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(404).json({
          success: false,
          message: `No comment found with id of ${req.params.id}`
        });
      }
      return res.redirect(`/ticket/${comment.ticket}?error=Comment not found`);
    }
    
    // Check if user is comment owner or admin
    if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(403).json({
          success: false,
          message: `User ${req.user.id} is not authorized to delete this comment`
        });
      }
      return res.redirect(`/ticket/${comment.ticket}?error=Not authorized to delete this comment`);
    }
    
    // Store ticket ID before deleting the comment
    const ticketId = comment.ticket;
    
    // Delete the comment
    await Comment.deleteOne({ _id: req.params.id });
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(200).json({
        success: true,
        data: {}
      });
    }
    
    res.redirect(`/ticket/${ticketId}?success=Comment deleted successfully`);
  } catch (error) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
    res.redirect(`/ticket/${req.params.id}?error=${encodeURIComponent(error.message)}`);
  }
};
