const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.status(400).json({ errors: errors.array() });
        }
        return res.status(400).render('error', {
            title: 'Validation Error',
            path: '',
            user: req.user,
            errors: errors.array()
        });
    }
    next();
};

// Ticket validation rules
const validateTicket = [
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
        .isLength({ min: 10 })
        .withMessage('Description must be at least 10 characters'),
    
    body('category')
        .trim()
        .notEmpty()
        .withMessage('Category is required')
        .isIn(['Hardware', 'Software', 'Network', 'Access', 'Other'])
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
const validateComment = [
    body('content')
        .trim()
        .notEmpty()
        .withMessage('Comment content is required')
        .isLength({ min: 1, max: 1000 })
        .withMessage('Comment must be between 1 and 1000 characters'),
    
    validate
];

// User validation rules
const validateUser = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email'),
    
    body('password')
        .trim()
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    
    body('role')
        .optional()
        .trim()
        .isIn(['admin', 'first_line', 'second_line', 'user'])
        .withMessage('Invalid role'),
    
    validate
];

module.exports = {
    validate,
    validateTicket,
    validateComment,
    validateUser
}; 