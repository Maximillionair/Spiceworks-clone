const Ticket = require('../models/ticket');

// @desc    Show home page
// @route   GET /
// @access  Public
exports.getHomePage = (req, res) => {
  res.render('index', { 
    title: 'Home', 
    path: '/',
    user: req.user || null
  });
};

// @desc    Show dashboard page
// @route   GET /dashboard
// @access  Private
exports.getDashboardPage = async (req, res) => {
  try {
    // Get recent tickets for the user
    const recentTickets = await Ticket.find({ user: req.user.id })
      .sort('-createdAt')
      .limit(5);
    
    // Get ticket counts by status
    const query = req.user.role === 'admin' ? {} : { user: req.user.id };
    
    const stats = {
      open: await Ticket.countDocuments({ ...query, status: 'Open' }),
      inProgress: await Ticket.countDocuments({ ...query, status: 'In Progress' }),
      resolved: await Ticket.countDocuments({ ...query, status: 'Resolved' })
    };
    
    res.render('dashboard', { 
      title: 'Dashboard', 
      path: '/dashboard',
      user: req.user,
      recentTickets,
      stats,
      getStatusClass: (status) => {
        switch (status) {
          case 'Open':
            return 'bg-danger';
          case 'In Progress':
            return 'bg-warning';
          case 'Resolved':
            return 'bg-success';
          default:
            return 'bg-secondary';
        }
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('dashboard', { 
      title: 'Dashboard', 
      path: '/dashboard',
      user: req.user,
      recentTickets: [],
      stats: { open: 0, inProgress: 0, resolved: 0 },
      getStatusClass: () => 'bg-secondary',
      error: 'Error loading dashboard data'
    });
  }
};

// @desc    Show profile page
// @route   GET /profile
// @access  Private
exports.getProfilePage = async (req, res) => {
  try {
    // Get user's ticket statistics
    const stats = {
      total: await Ticket.countDocuments({ user: req.user.id }),
      open: await Ticket.countDocuments({ user: req.user.id, status: 'Open' }),
      inProgress: await Ticket.countDocuments({ user: req.user.id, status: 'In Progress' }),
      resolved: await Ticket.countDocuments({ user: req.user.id, status: 'Resolved' })
    };

    // Get user's recent tickets
    const recentTickets = await Ticket.find({ user: req.user.id })
      .sort('-createdAt')
      .limit(5)
      .populate('assignedTo', 'name email');

    res.render('profile', {
      title: 'Profile',
      path: '/profile',
      user: req.user,
      stats,
      recentTickets,
      getStatusClass: (status) => {
        switch (status) {
          case 'Open':
            return 'bg-danger';
          case 'In Progress':
            return 'bg-warning';
          case 'Resolved':
            return 'bg-success';
          default:
            return 'bg-secondary';
        }
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.render('profile', {
      title: 'Profile',
      path: '/profile',
      user: req.user,
      stats: { total: 0, open: 0, inProgress: 0, resolved: 0 },
      recentTickets: [],
      getStatusClass: () => 'bg-secondary',
      error: 'Error loading profile data'
    });
  }
}; 