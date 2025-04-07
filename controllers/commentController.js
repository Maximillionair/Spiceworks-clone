const Comment = require('../models/comment');
const Ticket = require('../models/ticket');

// @desc    Add comment to ticket
// @route   POST /api/tickets/:ticketId/comments
// @access  Private
exports.addComment = async (req, res, next) => {
  try {
    req.body.ticket = req.params.ticketId;
    req.body.user = req.user.id;
    
    const ticket = await Ticket.findById(req.params.ticketId);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: `No ticket found with id of ${req.params.ticketId}`
      });
    }
    
    // Check if user is ticket owner or admin
    if (ticket.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to add a comment to this ticket`
      });
    }
    
    const comment = await Comment.create(req.body);
    
    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get comments for ticket
// @route   GET /api/tickets/:ticketId/comments
// @access  Private
exports.getTicketComments = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: `No ticket found with id of ${req.params.ticketId}`
      });
    }
    
    // Check if user is ticket owner or admin
    if (ticket.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to view comments for this ticket`
      });
    }
    
    const comments = await Comment.find({ ticket: req.params.ticketId })
      .populate({
        path: 'user',
        select: 'name role'
      })
      .sort('createdAt');
    
    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: `No comment found with id of ${req.params.id}`
      });
    }
    
    // Check if user is comment owner or admin
    if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this comment`
      });
    }
    
    await comment.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};