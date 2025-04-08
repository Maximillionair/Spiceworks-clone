const express = require('express');
const { protect } = require('../middleware/authmiddleware');
const Ticket = require('../models/ticket');
const router = express.Router();

// Middleware to process query string alerts
const alertMiddleware = (req, res, next) => {
  res.locals.success = req.query.success || null;
  res.locals.error = req.query.error || null;
  next();
};

// Apply alertMiddleware to all routes
router.use(alertMiddleware);

// Public routes
router.get('/', (req, res) => {
  res.render('index');
});

router.get('/login', (req, res) => {
  res.render('login');
});

router.get('/register', (req, res) => {
  res.render('register');
});

// Protected routes - require authentication
router.get('/dashboard', protect, async (req, res) => {
  try {
    // Get recent tickets
    const recentTickets = await Ticket.find({ user: req.user.id })
      .sort('-createdAt')
      .limit(5);
    
    // Get ticket counts
    const openCount = await Ticket.countDocuments({ 
      user: req.user.id,
      status: 'open'
    });
    
    const inProgressCount = await Ticket.countDocuments({ 
      user: req.user.id,
      status: 'in progress'
    });
    
    const resolvedCount = await Ticket.countDocuments({ 
      user: req.user.id,
      status: 'resolved'
    });

    res.render('dashboard', {
      user: req.user,
      recentTickets,
      stats: {
        open: openCount,
        inProgress: inProgressCount,
        resolved: resolvedCount
      }
    });
  } catch (error) {
    console.error(error);
    res.render('dashboard', {
      user: req.user,
      error: 'Error loading dashboard data'
    });
  }
});

router.get('/tickets', protect, async (req, res) => {
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
    
    // Execute query
    const tickets = await query;
    
    res.render('ticketpage', { 
      tickets,
      user: req.user
    });
  } catch (error) {
    console.error(error);
    res.render('ticketpage', {
      user: req.user,
      error: 'Error loading tickets'
    });
  }
});

router.get('/ticket/:id', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate({
      path: 'user',
      select: 'name email'
    });
    
    if (!ticket) {
      return res.redirect('/tickets?error=Ticket not found');
    }
    
    // Make sure user is ticket owner or admin
    if (ticket.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.redirect('/tickets?error=Not authorized to view this ticket');
    }
    
    res.render('ticketdetail', { 
      ticket,
      user: req.user
    });
  } catch (error) {
    res.redirect('/tickets?error=' + encodeURIComponent(error.message));
  }
});

module.exports = router;