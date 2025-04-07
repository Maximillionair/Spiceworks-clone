const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Helper function to send JWT token as cookie after registration or login
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true // Cookie cannot be accessed by client-side JS
  };

  // Use secure cookies in production (only over HTTPS)
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.status(statusCode)
    .cookie('token', token, options) // Store the token in an HTTP-only cookie
    .json({
      success: true,
      message: 'User registered and logged in successfully',
      token
    });
};

// Register user
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if the email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already taken'
      });
    }

    // Create the new user
    const user = await User.create({
      name,
      email,
      password,  // The password will be hashed automatically in the model
      role: role || 'user' // Default to 'user' if no role provided
    });

    // Automatically log in the user by generating a JWT and sending it as a cookie
    sendTokenResponse(user, 201, res); // Send response with token in cookie
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    // Check for the user in the database
    const user = await User.findOne({ email }).select('+password'); // Include password field in query
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if the password matches
    const isMatch = await user.matchPassword(password);  // Use the method from the model
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // If credentials are valid, log the user in by sending a token in a cookie
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Log user out / clear cookie
exports.logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // Set a short expiration date
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
};

// Get current logged-in user
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id); // Get the user from the database using the ID in the JWT

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
