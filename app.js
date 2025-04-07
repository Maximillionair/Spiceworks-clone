const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');

// Load env vars
dotenv.config();

// Route files
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const commentRoutes = require('./routes/commentRoutes');

// Initialize app
const app = express();

app.set('view engine', 'ejs');

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Sanitize data
app.use(mongoSanitize());

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:4000',
  credentials: true
}));

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));



// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

// Log route paths to debug
console.log('Ticket routes:', ticketRoutes.stack);
console.log('Comment routes:', commentRoutes.stack);


console.log('Mounting routes...');
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/comments', commentRoutes);
console.log('Routes mounted successfully!');

// Serve frontend
// app.get('*', (req, res) => {
//   res.sendFile(path.resolve(__dirname, '../', 'index'));
// });

module.exports = app;