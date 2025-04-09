const User = require('../models/User');
const Ticket = require('../models/ticket');
const Comment = require('../models/comment');
const { validationResult } = require('express-validator');
const { StatusCodes } = require('http-status-codes');
const { getStatusClass } = require('../utils/helpers');

// @desc    Get admin dashboard
// @route   GET /admin/dashboard
// @access  Private/Admin
exports.getAdminDashboard = async (req, res) => {
  try {
    // Get ticket statistics
    const ticketStats = await Ticket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent tickets
    const recentTickets = await Ticket.find()
      .sort('-createdAt')
      .limit(5)
      .populate('user', 'name email');

    // Format statistics
    const stats = {
      tickets: {
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0
      },
      users: {
        total: 0,
        admin: 0,
        first_line: 0,
        second_line: 0,
        user: 0
      }
    };

    // Process ticket statistics
    ticketStats.forEach(stat => {
      stats.tickets.total += stat.count;
      switch (stat._id) {
        case 'Open':
          stats.tickets.open = stat.count;
          break;
        case 'In Progress':
          stats.tickets.inProgress = stat.count;
          break;
        case 'Resolved':
          stats.tickets.resolved = stat.count;
          break;
      }
    });

    // Process user statistics
    userStats.forEach(stat => {
      stats.users.total += stat.count;
      stats.users[stat._id] = stat.count;
    });

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      path: '/admin/dashboard',
      user: req.user,
      stats,
      recentTickets
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).render('error', {
      title: 'Error',
      path: '',
      user: req.user,
      message: 'Error loading admin dashboard'
    });
  }
};

// @desc    Get all users
// @route   GET /admin/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.render('admin/users', {
      title: 'User Management',
      users,
      currentUser: req.user,
      user: req.user,
      getStatusClass
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).render('error', {
      message: 'Error fetching users',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// @desc    Create a new user
// @route   POST /admin/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role
    });

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update user role
// @route   POST /admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await User.findById(id);
    if (!user) {
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(StatusCodes.NOT_FOUND).json({ msg: 'User not found' });
      }
      req.flash('error', 'User not found');
      return res.redirect('/admin/users');
    }

    user.role = role;
    await user.save();

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(StatusCodes.OK).json({ msg: 'User role updated successfully' });
    }

    req.flash('success', 'User role updated successfully');
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Error updating user role:', error);
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Error updating user role' });
    }
    req.flash('error', 'Error updating user role');
    res.redirect('/admin/users');
  }
};

// @desc    Delete user
// @route   DELETE /admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting own account
    if (user._id.toString() === req.user.id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await user.remove();

    res.status(StatusCodes.OK).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error deleting user'
    });
  }
};

// @desc    Get reports
// @route   GET /admin/reports
// @access  Private/Admin
exports.getReports = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    const reports = {
      totalTickets: tickets.length,
      openTickets: tickets.filter(ticket => ticket.status === 'open').length,
      inProgressTickets: tickets.filter(ticket => ticket.status === 'in-progress').length,
      resolvedTickets: tickets.filter(ticket => ticket.status === 'resolved').length,
      closedTickets: tickets.filter(ticket => ticket.status === 'closed').length,
      tickets
    };

    res.render('admin/reports', {
      title: 'Reports',
      reports,
      user: req.user,
      getStatusClass
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).render('error', {
      message: 'Error fetching reports',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// @desc    Export reports
// @route   GET /admin/reports/export
// @access  Private/Admin
exports.exportReports = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    const reports = {
      totalTickets: tickets.length,
      openTickets: tickets.filter(ticket => ticket.status === 'open').length,
      inProgressTickets: tickets.filter(ticket => ticket.status === 'in-progress').length,
      resolvedTickets: tickets.filter(ticket => ticket.status === 'resolved').length,
      closedTickets: tickets.filter(ticket => ticket.status === 'closed').length,
      tickets
    };

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error exporting reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting reports',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user for editing
// @route   GET /admin/users/:id/edit
// @access  Private/Admin
exports.getUserForEdit = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.redirect('/admin/users?error=User not found');
    }
    
    res.render('admin/edituser', {
      title: 'Edit User',
      path: '/admin/users',
      user: user,
      currentUser: req.user
    });
  } catch (error) {
    console.error('Error fetching user for edit:', error);
    res.redirect('/admin/users?error=Error fetching user');
  }
};

// @desc    Update user
// @route   PUT /admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.redirect('/admin/users?error=User not found');
    }
    
    // Update user fields
    user.name = name;
    user.email = email;
    user.role = role;
    
    // Only update password if provided
    if (password && password.trim() !== '') {
      user.password = password;
    }
    
    await user.save();
    
    res.redirect('/admin/users?success=User updated successfully');
  } catch (error) {
    console.error('Error updating user:', error);
    res.redirect(`/admin/users/${req.params.id}/edit?error=Error updating user`);
  }
}; 