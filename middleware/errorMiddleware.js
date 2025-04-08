// middleware/errorMiddleware.js
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
  
    // Log for dev
    console.error(err);
  
    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
      const message = `Resource not found with id of ${err.value}`;
      error = { message, statusCode: 404 };
    }
  
    // Mongoose duplicate key
    if (err.code === 11000) {
      const message = 'Duplicate field value entered';
      error = { message, statusCode: 400 };
    }
  
    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(val => val.message);
      error = { message, statusCode: 400 };
    }
  
    // For API routes
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Server Error'
      });
    }
    
    // For view routes
    return res.status(error.statusCode || 500).render('error', { 
      title: 'Error',
      path: '',
      user: req.user || null,
      message: error.message || 'Server Error',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  };
  
  module.exports = errorHandler;