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
    res.redirect('/dashboard?success=Ticket created successfully');
  } catch (error) {
    res.redirect('/dashboard?error=' + encodeURIComponent(error.message));
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
    
    query = query.skip(startIndex).limit(limit);
    
    // Execute query
    const tickets = await query;
    
    // Render tickets page with data
    res.render('ticketpage', { 
      tickets,
      currentPage: page,
      user: req.user
    });
  } catch (error) {
    res.redirect('/dashboard?error=' + encodeURIComponent(error.message));
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
      return res.redirect('/dashboard?error=Ticket not found');
    }
    
    // Make sure user is ticket owner or admin
    if (ticket.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.redirect('/dashboard?error=Not authorized to view this ticket');
    }
    
    // Render ticket detail page with data
    res.render('ticketdetail', { 
      ticket,
      user: req.user
    });
  } catch (error) {
    res.redirect('/dashboard?error=' + encodeURIComponent(error.message));
  }
};

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Private/Admin
exports.updateTicket = async (req, res, next) => {
  try {
    let ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.redirect('/tickets?error=Ticket not found');
    }
    
    // Make sure user is admin
    if (req.user.role !== 'admin') {
      return res.redirect('/tickets?error=Only admins can update ticket status');
    }
    
    // Add admin ID to the update for history tracking
    req.body.updatedBy = req.user.id;
    
    ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.redirect('/tickets?success=Ticket updated successfully');
  } catch (error) {
    res.redirect('/tickets?error=' + encodeURIComponent(error.message));
  }
};

// @desc    Get ticket statistics
// @route   GET /api/tickets/stats
// @access  Private/Admin
exports.getTicketStats = async (req, res, next) => {
  try {
    // Make sure user is admin
    if (req.user.role !== 'admin') {
      return res.redirect('/dashboard?error=Only admins can access ticket statistics');
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
    
    res.render('admin/statistics', {
      user: req.user,
      statusStats: stats,
      categoryStats
    });
  } catch (error) {
    res.redirect('/dashboard?error=' + encodeURIComponent(error.message));
  }
};