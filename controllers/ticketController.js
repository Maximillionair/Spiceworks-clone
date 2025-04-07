const Ticket = require('../models/ticket');
const User = require('../models/user');

// @desc    Create new ticket
// @route   POST /api/tickets
// @access  Private
exports.createTicket = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.user = req.user.id;
    
    const ticket = await Ticket.create(req.body);
    
    res.status(201).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Private/Admin
exports.getTickets = async (req, res, next) => {
  try {
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
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Ticket.countDocuments();
    
    query = query.skip(startIndex).limit(limit);
    
    // Execute query
    const tickets = await query;
    
    // Pagination result
    const pagination = {};
    
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }
    
    res.status(200).json({
      success: true,
      count: tickets.length,
      pagination,
      data: tickets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single ticket
// @route   GET /api/tickets/:id
// @access  Private
exports.getTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate({
      path: 'user',
      select: 'name email'
    });
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: `No ticket found with id of ${req.params.id}`
      });
    }
    
    // Make sure user is ticket owner or admin
    if (ticket.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to access this ticket`
      });
    }
    
    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Private/Admin
exports.updateTicket = async (req, res, next) => {
  try {
    let ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: `No ticket found with id of ${req.params.id}`
      });
    }
    
    // Make sure user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update ticket status and priority'
      });
    }
    
    // Add admin ID to the update for history tracking
    req.body.updatedBy = req.user.id;
    
    ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get ticket statistics
// @route   GET /api/tickets/stats
// @access  Private/Admin
exports.getTicketStats = async (req, res, next) => {
  try {
    // Make sure user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access ticket statistics'
      });
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
    
    res.status(200).json({
      success: true,
      data: {
        statusStats: stats,
        categoryStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};