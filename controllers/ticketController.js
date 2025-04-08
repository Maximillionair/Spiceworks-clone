const Ticket = require('../models/ticket');
const User = require('../models/user');
const asyncHandler = require('express-async-handler');

// @desc    Create new ticket
// @route   POST /api/tickets
// @access  Private
const createTicket = asyncHandler(async (req, res) => {
  const { title, description, category, priority } = req.body;
  
  if (!title || !description || !category) {
    if (req.xhr || req.headers.accept.includes('application/json')) {
      res.status(400).json({ message: 'Please add a title, description, and category' });
    } else {
      res.redirect('/dashboard?error=Please add a title, description, and category');
    }
    return;
  }
  
  // Create ticket
  const ticket = await Ticket.create({
    title,
    description,
    category,
    priority,
    user: req.user.id
  });
  
  // Check if it's an AJAX request or if the response should be JSON
  if (req.xhr || req.headers.accept.includes('application/json')) {
    res.status(201).json(ticket);
  } else {
    res.redirect('/dashboard?success=Ticket created successfully');
  }
});

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Private
const getTickets = asyncHandler(async (req, res) => {
  // For admin: get all tickets
  // For regular user: get only own tickets
  let query;
  
  if (req.user.role === 'admin') {
    query = Ticket.find().populate({
      path: 'user',
      select: 'name email'
    });
  } else {
    query = Ticket.find({ user: req.user.id });
  }
  
  // Add sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }
  
  // Execute query
  const tickets = await query;
  
  // Check if it's an AJAX request or if the response should be JSON
  if (req.xhr || req.headers.accept.includes('application/json')) {
    res.status(200).json(tickets);
  } else {
    res.render('ticketpage', { 
      tickets,
      user: req.user
    });
  }
});

// @desc    Get single ticket
// @route   GET /api/tickets/:id
// @access  Private
const getTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id).populate({
    path: 'user',
    select: 'name email'
  });
  
  if (!ticket) {
    if (req.xhr || req.headers.accept.includes('application/json')) {
      res.status(404).json({ message: 'Ticket not found' });
    } else {
      res.redirect('/tickets?error=Ticket not found');
    }
    return;
  }
  
  // Make sure user is ticket owner or admin
  if (ticket.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    if (req.xhr || req.headers.accept.includes('application/json')) {
      res.status(401).json({ message: 'Not authorized to view this ticket' });
    } else {
      res.redirect('/tickets?error=Not authorized to view this ticket');
    }
    return;
  }
  
  // Check if it's an AJAX request or if the response should be JSON
  if (req.xhr || req.headers.accept.includes('application/json')) {
    res.status(200).json(ticket);
  } else {
    res.render('ticketdetail', { 
      ticket,
      user: req.user
    });
  }
});

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Private/Admin
const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  
  if (!ticket) {
    if (req.xhr || req.headers.accept.includes('application/json')) {
      res.status(404).json({ message: 'Ticket not found' });
    } else {
      res.redirect('/tickets?error=Ticket not found');
    }
    return;
  }
  
  // Make sure user is admin
  if (req.user.role !== 'admin') {
    if (req.xhr || req.headers.accept.includes('application/json')) {
      res.status(401).json({ message: 'Only admins can update ticket status' });
    } else {
      res.redirect('/tickets?error=Only admins can update ticket status');
    }
    return;
  }
  
  // Add admin ID to the update for history tracking
  req.body.updatedBy = req.user.id;
  
  const updatedTicket = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  // Check if it's an AJAX request or if the response should be JSON
  if (req.xhr || req.headers.accept.includes('application/json')) {
    res.status(200).json(updatedTicket);
  } else {
    res.redirect(`/ticket/${req.params.id}?success=Ticket updated successfully`);
  }
});

// @desc    Delete ticket
// @route   DELETE /api/tickets/:id
// @access  Private/Admin
const deleteTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  
  if (!ticket) {
    if (req.xhr || req.headers.accept.includes('application/json')) {
      res.status(404).json({ message: 'Ticket not found' });
    } else {
      res.redirect('/tickets?error=Ticket not found');
    }
    return;
  }
  
  // Make sure user is admin
  if (req.user.role !== 'admin') {
    if (req.xhr || req.headers.accept.includes('application/json')) {
      res.status(401).json({ message: 'Only admins can delete tickets' });
    } else {
      res.redirect('/tickets?error=Only admins can delete tickets');
    }
    return;
  }
  
  await ticket.deleteOne();
  
  // Check if it's an AJAX request or if the response should be JSON
  if (req.xhr || req.headers.accept.includes('application/json')) {
    res.status(200).json({ id: req.params.id });
  } else {
    res.redirect('/tickets?success=Ticket deleted successfully');
  }
});

// @desc    Get ticket statistics
// @route   GET /api/tickets/stats
// @access  Private/Admin
const getTicketStats = asyncHandler(async (req, res) => {
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
});

// @desc    Get recent tickets
// @route   GET /api/tickets/recent
// @access  Private
const getRecentTickets = asyncHandler(async (req, res) => {
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
});

module.exports = {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketStats,
  getRecentTickets
};