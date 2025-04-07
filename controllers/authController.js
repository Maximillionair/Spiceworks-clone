const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Helper function for sending token response (from second controller)
const sendTokenResponse = (user, statusCode, res) => {
  // Create JWT token
  const token = jwt.sign({ id: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Cookie options for token (set expiration based on environment)
  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,  // Cookie cannot be accessed by client-side JS
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;  // Secure cookies for production
  }

  // Send the response with token
  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
  });
};

// @desc    Register user
// @route   POST /auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if the email is already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already taken" });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role: role || 'user',  // Default role to 'user' if none is provided
    });

    // Save user to the database
    await user.save();
    
    // Send response with token (JWT)
    sendTokenResponse(user, 201, res);  // 201 - Created
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: "Registration failed: " + error.message });
  }
};

// @desc    Login user
// @route   POST /auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Ensure both email and password are provided
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide both email and password" });
    }

    // Check if the user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Send token in response (JWT)
    sendTokenResponse(user, 200, res);  // 200 - OK
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: "Login failed: " + error.message });
  }
};

// @desc    Logout user
// @route   GET /auth/logout
// @access  Private
const logout = (req, res) => {
  // Clear the token cookie
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // Expire immediately
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

// @desc    Get current logged-in user
// @route   GET /auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);  // req.user is populated by authMiddleware (from JWT token)
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: "Failed to fetch user data" });
  }
};

// @desc    Display register page (GET request)
// @route   GET /auth/register
// @access  Public
const user_register_get = (req, res) => {
  res.render('register', { title: 'Create a new user' });
};

// @desc    Display login page (GET request)
// @route   GET /auth/login
// @access  Public
const user_login_get = (req, res) => {
  res.render('login', { title: 'Login' });
};

module.exports = {
  user_register_get,
  user_login_get,
  registerUser,
  loginUser,
  logout,
  getMe,
};
