const User = require('../models/User');
const { setTokenCookie, clearTokenCookie } = require('../utils/helpers');
const { validationResult } = require('express-validator');

// @desc    Show login page
// @route   GET /login
// @access  Public
exports.getLoginPage = (req, res) => {
  if (req.user) {
    return res.redirect('/dashboard');
  }
  res.render('login', { 
    title: 'Login', 
    path: '/login',
    user: null
  });
};

// @desc    Show register page
// @route   GET /register
// @access  Public
exports.getRegisterPage = (req, res) => {
  if (req.user) {
    return res.redirect('/dashboard');
  }
  res.render('register', { 
    title: 'Register', 
    path: '/register',
    user: null
  });
};

/**
 * @desc    Register user
 * @route   POST /auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('register', {
        title: 'Register',
        errors: errors.array(),
        user: req.user
      });
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).render('register', {
        title: 'Register',
        errors: [{ msg: 'User already exists' }],
        user: req.user
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    // Set token cookie
    setTokenCookie(user, res);

    // Redirect to dashboard
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).render('register', {
      title: 'Register',
      errors: [{ msg: 'Server error' }],
      user: req.user
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('login', {
        title: 'Login',
        errors: errors.array(),
        user: req.user
      });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).render('login', {
        title: 'Login',
        errors: [{ msg: 'Invalid credentials' }],
        user: req.user
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).render('login', {
        title: 'Login',
        errors: [{ msg: 'Invalid credentials' }],
        user: req.user
      });
    }

    // Set token cookie
    setTokenCookie(user, res);

    // Redirect to dashboard
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).render('login', {
      title: 'Login',
      errors: [{ msg: 'Server error' }],
      user: req.user
    });
  }
};

/**
 * @desc    Logout user
 * @route   GET /auth/logout
 * @access  Private
 */
exports.logout = (req, res) => {
  clearTokenCookie(res);
  res.redirect('/');
};

/**
 * @desc    Get current logged in user
 * @route   GET /auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).render('profile', {
      title: 'Profile',
      user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Server error'
    });
  }
};