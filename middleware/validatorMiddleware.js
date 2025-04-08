const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Check if it's an API request
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }
        
        // For view routes, redirect back with errors
        const errorMessages = errors.array().map(err => err.msg).join(', ');
        return res.redirect(`${req.originalUrl}?error=${encodeURIComponent(errorMessages)}`);
    }
    next();
};

// Ticket validation rules
const validateTicketInput = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('Title must be between 3 and 100 characters'),
    
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Description must be between 10 and 1000 characters'),
    
    body('category')
        .trim()
        .notEmpty()
        .withMessage('Category is required')
        .isIn(['Hardware', 'Software', 'Network', 'Account', 'Other'])
        .withMessage('Invalid category'),
    
    body('priority')
        .trim()
        .notEmpty()
        .withMessage('Priority is required')
        .isIn(['Low', 'Medium', 'High', 'Critical'])
        .withMessage('Invalid priority'),
    
    body('status')
        .optional()
        .trim()
        .isIn(['Open', 'In Progress', 'Resolved'])
        .withMessage('Invalid status'),
    
    validate
];

// Comment validation rules
const validateCommentInput = [
    body('content')
        .trim()
        .notEmpty()
        .withMessage('Comment content is required')
        .isLength({ min: 1, max: 1000 })
        .withMessage('Comment must be between 1 and 1000 characters'),
    
    validate
];

module.exports = {
    validateTicketInput,
    validateCommentInput
}; 