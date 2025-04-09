const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');

// Load env vars
dotenv.config();

// Route files
const viewRoutes = require('./routes/viewRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const adminRoutes = require('./routes/adminRoutes');

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

// Method override for PUT/DELETE requests
app.use(methodOverride('_method'));

// Enable logging middleware in all environments
app.use(morgan('dev'));

// Security headers
// Conditionally apply Helmet based on environment
// Security headers configuration
// Security headers - Modified to allow HTTP in development
if (process.env.NODE_ENV === 'production') {
  // Production settings - full security
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"]
      }
    }
  }));
} else {
  // Development settings - allow HTTP
  console.log('Using development Helmet settings (HTTP allowed)');
  app.use(helmet({
    contentSecurityPolicy: false,
    hsts: false
  }));
}

// Apply Helmet with the configuration
// app.use(helmet(helmetConfig));

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Mount routes
app.use('/', viewRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/admin', adminRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Error',
    path: '',
    user: req.user || null,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});
// Middleware to rewrite HTTPS URLs to HTTP
// app.use((req, res, next) => {
//   res.setHeader('Content-Security-Policy', "upgrade-insecure-requests: ;");
//   next();
// });
module.exports = app;
