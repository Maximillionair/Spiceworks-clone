const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Set token cookie
const setTokenCookie = (user, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true // Cookie cannot be accessed by client-side JS
  };

  // Use secure cookies in production (HTTPS only)
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.cookie('token', token, options);
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user'
    });

    // Set token in cookie
    setTokenCookie(user, res);
    // Redirect with success message
    res.redirect('/login?success=Account created successfully. Please log in.');
  } catch (error) {
    // Redirect with an improved error message
    res.redirect(`/register?error=${encodeURIComponent("Error creating account: " + error.message)}`);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.redirect('/login?error=' + encodeURIComponent("Please provide both email and password"));
    }

    // Check if the user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.redirect('/login?error=' + encodeURIComponent("Invalid email or password"));
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.redirect('/login?error=' + encodeURIComponent("Invalid email or password"));
    }

    // Set token and redirect to dashboard
    setTokenCookie(user, res);
    res.redirect('/dashboard');
  } catch (error) {
    // General error handling
    res.redirect(`/login?error=${encodeURIComponent("Error logging in: " + error.message)}`);
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.redirect('/');
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.redirect('/dashboard');
};