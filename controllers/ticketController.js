const Ticket = require('../models/ticket');
const Comment = require('../models/comment');
const { StatusCodes } = require('http-status-codes');
const { validateTicketInput, validateCommentInput } = require('../middleware/validatorMiddleware');
const { validateTicket } = require('../middleware/validators');
const { getStatusClass } = require('../utils/helpers');
const { validationResult } = require('express-validator');

// @desc    Create new ticket
// @route   POST /tickets
// @access  Private
const createTicket = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('ticketform', {
        title: 'Create Ticket',
        errors: errors.array(),
        user: req.user
      });
    }

    const { title, description, priority } = req.body;

    const ticket = await Ticket.create({
      title,
      description,
      priority,
      user: req.user.id
    });

    res.redirect(`/tickets/${ticket._id}`);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).render('ticketform', {
      title: 'Create Ticket',
      errors: [{ msg: 'Server error' }],
      user: req.user
    });
  }
};

// @desc    Get all tickets
// @route   GET /tickets
// @access  Private
const getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.render('ticketpage', {
      title: 'My Tickets',
      tickets,
      getStatusClass
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Server error'
    });
  }
};

// @desc    Get single ticket
// @route   GET /tickets/:id
// @access  Private
const getTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Ticket not found'
      });
    }

    // Make sure user is ticket owner
    if (ticket.user.toString() !== req.user.id) {
      return res.status(401).render('error', {
        title: 'Error',
        message: 'Not authorized to access this ticket'
      });
    }

    res.render('ticketdetail', {
      title: 'Ticket Details',
      ticket,
      getStatusClass
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Server error'
    });
  }
};

// @desc    Update ticket
// @route   PUT /tickets/:id
// @access  Private
const updateTicket = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('ticketdetail', {
        title: 'Ticket Details',
        ticket: await Ticket.findById(req.params.id),
        errors: errors.array(),
        getStatusClass
      });
    }

    let ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Ticket not found'
      });
    }

    // Make sure user is ticket owner
    if (ticket.user.toString() !== req.user.id) {
      return res.status(401).render('error', {
        title: 'Error',
        message: 'Not authorized to update this ticket'
      });
    }

    const { title, description, status, priority } = req.body;

    ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { title, description, status, priority },
      { new: true, runValidators: true }
    );

    res.redirect(`/tickets/${ticket._id}`);
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Server error'
    });
  }
};

// @desc    Delete ticket
// @route   DELETE /tickets/:id
// @access  Private
const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Ticket not found'
      });
    }

    // Make sure user is ticket owner
    if (ticket.user.toString() !== req.user.id) {
      return res.status(401).render('error', {
        title: 'Error',
        message: 'Not authorized to delete this ticket'
      });
    }

    await ticket.remove();

    res.redirect('/tickets');
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Server error'
    });
  }
};

// @desc    Get ticket statistics
// @route   GET /api/tickets/stats
// @access  Private/Admin
const getTicketStats = async (req, res) => {
  try {
    // Make sure user is admin
    if (req.user.role !== 'admin') {
      if (req.xhr || req.headers.accept.includes('application/json')) {
        res.status(403).json({ message: 'Only admins can access ticket statistics' });
      } else {
        res.redirect('/dashboard?error=Only admins can access ticket statistics');
      }
      return;
    }
    
    // Get counts for each status
    const statusCounts = await Ticket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Convert to a more user-friendly format
    const stats = {};
    statusCounts.forEach(status => {
      stats[status._id] = status.count;
    });
    
    // Get counts by category
    const categoryCounts = await Ticket.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Convert to a more user-friendly format
    const categoryStats = {};
    categoryCounts.forEach(category => {
      categoryStats[category._id] = category.count;
    });
    
    if (req.xhr || req.headers.accept.includes('application/json')) {
      res.status(200).json({
        statusStats: stats,
        categoryStats
      });
    } else {
      res.render('admin/statistics', {
        user: req.user,
        statusStats: stats,
        categoryStats
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error getting ticket statistics', error: error.message });
  }
};

// @desc    Get recent tickets
// @route   GET /api/tickets/recent
// @access  Private
const getRecentTickets = async (req, res) => {
  try {
    // For admin: get all recent tickets
    // For regular user: get only own recent tickets
    let query;
    
    if (req.user.role === 'admin') {
      query = Ticket.find().populate({
        path: 'user',
        select: 'name email'
      });
    } else {
      query = Ticket.find({ user: req.user.id });
    }
    
    // Get recent tickets with sorting by 'createdAt' (most recent first)
    const tickets = await query
      .sort({ createdAt: -1 })
      .limit(5);
    
    if (req.xhr || req.headers.accept.includes('application/json')) {
      res.status(200).json(tickets);
    } else {
      // For view requests, this should be handled by viewRoutes.js
      res.redirect('/dashboard');
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recent tickets', error: error.message });
  }
};

// @desc    Add comment to ticket
// @route   POST /tickets/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    // Check if user has access to this ticket
    if (req.user.role !== 'admin' && 
      ticket.user.toString() !== req.user._id.toString() && 
      ticket.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: 'Not authorized to comment on this ticket'
      });
    }

    await ticket.addComment(req.body.content, req.user._id);

    const updatedTicket = await Ticket.findById(req.params.id)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email');

    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedTicket
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Error adding comment'
    });
  }
};

module.exports = {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketStats,
  getRecentTickets,
  addComment
};