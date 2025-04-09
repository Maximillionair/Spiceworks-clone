const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authmiddleware');
const Ticket = require('../models/ticket');
const Comment = require('../models/comment');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getHomePage, getDashboardPage, getProfilePage } = require('../controllers/pageController');

// Helper function to get status class for badges
const getStatusClass = (status) => {
  switch (status) {
    case 'Open':
      return 'danger';
    case 'In Progress':
      return 'warning';
    case 'Resolved':
      return 'success';
    default:
      return 'secondary';
  }
};

// Helper function to set JWT token cookie
const setTokenCookie = (user, res) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );

  res.cookie('token', token, {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: false,
    sameSite: 'strict'
  });
};

// Middleware to process query string alerts
const alertMiddleware = (req, res, next) => {
  res.locals.success = req.query.success || null;
  res.locals.error = req.query.error || null;
  next();
};

// Apply alertMiddleware to all routes
router.use(alertMiddleware);

// Public routes
router.get('/', getHomePage);

router.get('/login', (req, res) => {
  if (req.user) {
    return res.redirect('/dashboard');
  }
  res.render('login', { 
    title: 'Login', 
    path: '/login',
    user: null
  });
});

// Handle login form submission
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
      return res.render('login', {
        title: 'Login',
        path: '/login',
        user: null,
        error: 'Please provide both email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.render('login', {
        title: 'Login',
        path: '/login',
        user: null,
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.render('login', {
        title: 'Login',
        path: '/login',
        user: null,
        error: 'Invalid credentials'
      });
    }

    // Set JWT cookie
    setTokenCookie(user, res);

    // Redirect based on role
    res.redirect(user.role === 'admin' ? '/dashboard' : '/tickets');
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', {
      title: 'Login',
      path: '/login',
      user: null,
      error: 'Error during login'
    });
  }
});

router.get('/register', (req, res) => {
  if (req.user) {
    return res.redirect('/dashboard');
  }
  res.render('register', { 
    title: 'Register', 
    path: '/register',
    user: null
  });
});

// Handle registration form submission
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role } = req.body;

    // Basic validation
    if (!name || !email || !password || !confirmPassword) {
      return res.render('register', {
        title: 'Register',
        path: '/register',
        user: null,
        error: 'Please fill in all fields'
      });
    }

    if (password !== confirmPassword) {
      return res.render('register', {
        title: 'Register',
        path: '/register',
        user: null,
        error: 'Passwords do not match'
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.render('register', {
        title: 'Register',
        path: '/register',
        user: null,
        error: 'Email already registered'
      });
    }

    // Create user
    user = await User.create({
      name,
      email,
      password,
      role: role || 'user'
    });

    // Set JWT cookie
    setTokenCookie(user, res);

    // Redirect to login page with success message
    res.redirect('/login?success=Registration successful! Please log in.');
  } catch (error) {
    console.error('Registration error:', error);
    res.render('register', {
      title: 'Register',
      path: '/register',
      user: null,
      error: error.message || 'Error during registration'
    });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.redirect('/?success=Logged out successfully');
});

// Protected routes
router.get('/dashboard', protect, getDashboardPage);

// Tickets routes
router.get('/tickets', protect, async (req, res) => {
  try {
    // Build query based on user role and status filter
    let query = {};
    
    // Regular users can only see their own tickets
    if (req.user.role !== 'admin') {
      query.user = req.user.id;
    }
    
    // Apply status filter if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Get tickets with sorting
    const tickets = await Ticket.find(query)
      .sort('-createdAt')
      .populate('user', 'name email');
    
    res.render('tickets', { 
      title: 'Tickets', 
      path: '/tickets',
      user: req.user,
      tickets,
      status: req.query.status || '',
      getStatusClass
    });
  } catch (error) {
    console.error('Tickets list error:', error);
    res.render('tickets', { 
      title: 'Tickets', 
      path: '/tickets',
      user: req.user,
      tickets: [],
      status: '',
      getStatusClass,
      error: 'Error loading tickets'
    });
  }
});

// New ticket form - MOVED BEFORE :id route
router.get('/tickets/new', protect, (req, res) => {
  res.render('ticketform', { 
    title: 'Create New Ticket', 
    path: '/tickets/new',
    user: req.user,
    ticket: null
  });
});

// Single ticket view - MOVED AFTER /new route
router.get('/tickets/:id', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('user', 'name email')
      .populate('history.changedBy', 'name')
      .populate('comments.user', 'name role');
    
    if (!ticket) {
      return res.redirect('/tickets?error=Ticket not found');
    }
    
    // Check if user has permission to view this ticket
    if (req.user.role !== 'admin' && (!ticket.user || ticket.user._id.toString() !== req.user.id)) {
      return res.redirect('/tickets?error=You do not have permission to view this ticket');
    }
    
    res.render('ticketdetail', { 
      title: `Ticket #${ticket._id}`, 
      path: `/tickets/${ticket._id}`,
      user: req.user,
      ticket,
      getStatusClass
    });
  } catch (error) {
    console.error('Ticket detail error:', error);
    res.redirect('/tickets?error=Error loading ticket details');
  }
});

// Edit ticket form
router.get('/tickets/:id/edit', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.redirect('/tickets?error=Ticket not found');
    }
    
    // Check if user has permission to edit this ticket
    if (req.user.role !== 'admin' && ticket.user.toString() !== req.user.id) {
      return res.redirect('/tickets?error=You do not have permission to edit this ticket');
    }
    
    res.render('ticketform', { 
      title: `Edit Ticket #${ticket._id}`, 
      path: `/tickets/${ticket._id}/edit`,
      user: req.user,
      ticket
    });
  } catch (error) {
    console.error('Ticket edit form error:', error);
    res.redirect('/tickets?error=Error loading ticket edit form');
  }
});

// Create ticket
router.post('/tickets', protect, async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;
    
    // Create new ticket
    const ticket = await Ticket.create({
      title,
      description,
      category,
      priority,
      status: 'Open',
      user: req.user.id
    });
    
    // Add to history
    ticket.history.push({
      status: 'Open',
      updatedAt: new Date(),
      updatedBy: req.user.id
    });
    
    await ticket.save();
    
    res.redirect(`/tickets/${ticket._id}?success=Ticket created successfully`);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.redirect('/tickets/new?error=Error creating ticket');
  }
});

// Update ticket
router.post('/tickets/:id', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.redirect('/tickets?error=Ticket not found');
    }
    
    // Check if user has permission to update this ticket
    if (req.user.role !== 'admin' && ticket.user.toString() !== req.user.id) {
      return res.redirect('/tickets?error=You do not have permission to update this ticket');
    }
    
    const { title, description, category, priority, status } = req.body;
    
    // Update ticket fields
    ticket.title = title;
    ticket.description = description;
    ticket.category = category;
    ticket.priority = priority;
    
    // Only admins can change status
    if (req.user.role === 'admin' && status && status !== ticket.status) {
      ticket.status = status;
      
      // Add to history
      ticket.history.push({
        status,
        updatedAt: new Date(),
        updatedBy: req.user.id
      });
    }
    
    await ticket.save();
    
    res.redirect(`/tickets/${ticket._id}?success=Ticket updated successfully`);
  } catch (error) {
    console.error('Update ticket error:', error);
    res.redirect(`/tickets/${req.params.id}/edit?error=Error updating ticket`);
  }
});

// Add comment to ticket
router.post('/tickets/:id/comment', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.redirect('/tickets?error=Ticket not found');
    }
    
    // Check if user has permission to comment on this ticket
    if (req.user.role !== 'admin' && ticket.user.toString() !== req.user.id) {
      return res.redirect('/tickets?error=You do not have permission to comment on this ticket');
    }
    
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.redirect(`/tickets/${ticket._id}?error=Comment cannot be empty`);
    }
    
    // Create new comment
    await Comment.create({
      content,
      ticket: ticket._id,
      user: req.user.id
    });
    
    res.redirect(`/tickets/${ticket._id}?success=Comment added successfully`);
  } catch (error) {
    console.error('Add comment error:', error);
    res.redirect(`/tickets/${req.params.id}?error=Error adding comment`);
  }
});

// Delete comment from ticket
router.delete('/tickets/:ticketId/comments/:commentId', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    
    if (!ticket) {
      return res.redirect('/tickets?error=Ticket not found');
    }
    
    const comment = await Comment.findById(req.params.commentId);
    
    if (!comment) {
      return res.redirect(`/tickets/${ticket._id}?error=Comment not found`);
    }
    
    // Check if user has permission to delete this comment
    if (req.user.role !== 'admin' && comment.user.toString() !== req.user.id) {
      return res.redirect(`/tickets/${ticket._id}?error=You do not have permission to delete this comment`);
    }
    
    await comment.remove();
    
    res.redirect(`/tickets/${ticket._id}?success=Comment deleted successfully`);
  } catch (error) {
    console.error('Delete comment error:', error);
    res.redirect(`/tickets/${req.params.ticketId}?error=Error deleting comment`);
  }
});

// Profile route
router.get('/profile', protect, getProfilePage);

// Manual route
router.get('/manual', (req, res) => {
  res.render('manual', {
    title: 'User Manual',
    path: '/manual',
    user: req.user
  });
});

module.exports = router;