const express = require('express');
const { protect } = require('../middleware/authmiddleware');
const Ticket = require('../models/ticket');
const Comment = require('../models/comment');
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
  res.render('index', {
    title: 'Home',
    path: '/',
    user: req.user || null
  });
});

router.get('/login', (req, res) => {
  res.render('login', {
    title: 'Login',
    path: '/login',
    user: req.user || null
  });
});

router.get('/register', (req, res) => {
  res.render('register', {
    title: 'Register',
    path: '/register',
    user: req.user || null
  });
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
      status: 'Åpen'
    });
    
    const inProgressCount = await Ticket.countDocuments({ 
      user: req.user.id,
      status: 'Under arbeid'
    });
    
    const resolvedCount = await Ticket.countDocuments({ 
      user: req.user.id,
      status: 'Løst'
    });

    res.render('dashboard', {
      title: 'Dashboard',
      path: '/dashboard',
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
      title: 'Dashboard',
      path: '/dashboard',
      user: req.user,
      error: 'Error loading dashboard data'
    });
  }
});

// Add profile route
router.get('/profile', protect, async (req, res) => {
  try {
    res.render('profile', {
      title: 'Profile',
      path: '/profile',
      user: req.user
    });
  } catch (error) {
    console.error(error);
    res.redirect('/dashboard?error=Error loading profile');
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
      title: 'My Tickets',
      path: '/tickets',
      tickets,
      user: req.user
    });
  } catch (error) {
    console.error(error);
    res.render('ticketpage', {
      title: 'My Tickets',
      path: '/tickets',
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
    
    // Get comments for this ticket
    const comments = await Comment.find({ ticket: req.params.id })
      .populate({
        path: 'user',
        select: 'name role'
      })
      .sort('createdAt');
    
    res.render('ticketdetail', { 
      title: `Ticket #${ticket._id}`,
      path: `/ticket/${req.params.id}`,
      ticket,
      comments,
      user: req.user
    });
  } catch (error) {
    res.redirect('/tickets?error=' + encodeURIComponent(error.message));
  }
});

// Form submission routes
router.post('/ticket/create', protect, async (req, res) => {
  try {
    req.body.user = req.user.id;
    await Ticket.create(req.body);
    res.redirect('/dashboard?success=Ticket created successfully');
  } catch (error) {
    res.redirect('/dashboard?error=' + encodeURIComponent(error.message));
  }
});

router.post('/ticket/:id/comment', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.redirect('/tickets?error=Ticket not found');
    }
    
    // Make sure user is ticket owner or admin
    if (ticket.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.redirect('/tickets?error=Not authorized to add a comment to this ticket');
    }
    
    await Comment.create({
      ticket: req.params.id,
      user: req.user.id,
      content: req.body.content
    });
    
    res.redirect(`/ticket/${req.params.id}?success=Comment added successfully`);
  } catch (error) {
    res.redirect(`/ticket/${req.params.id}?error=${encodeURIComponent(error.message)}`);
  }
});

router.post('/ticket/:id/update', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.redirect('/tickets?error=Ticket not found');
    }
    
    // Make sure user is admin
    if (req.user.role !== 'admin') {
      return res.redirect('/tickets?error=Only admins can update ticket status');
    }
    
    // Add admin ID to the update for history tracking
    req.body.updatedBy = req.user.id;
    
    await Ticket.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.redirect(`/ticket/${req.params.id}?success=Ticket updated successfully`);
  } catch (error) {
    res.redirect(`/ticket/${req.params.id}?error=${encodeURIComponent(error.message)}`);
  }
});

module.exports = router;