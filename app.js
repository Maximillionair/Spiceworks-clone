
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const path = require('path');

// Load env vars
dotenv.config();

// Route files
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const commentRoutes = require('./routes/commentRoutes');
const viewRoutes = require('./routes/viewRoutes'); // New route file for views

// Initialize app
const app = express();

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Security headers
app.use(helmet({
  contentSecurityPolicy: false // This may need to be adjusted based on your needs
}));

// Prevent parameter pollution
app.use(hpp());

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:4000',
  credentials: true
}));

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes
console.log('Mounting API routes...');
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/comments', commentRoutes);
console.log('API routes mounted successfully!');

// Mount view routes - these will handle rendering the EJS templates
app.use('/', viewRoutes);

// Global error handler for API routes
app.use('/api', (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

// Global error handler for view routes
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

module.exports = app;
