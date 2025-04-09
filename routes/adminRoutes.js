const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authmiddleware');
const {
    getAdminDashboard,
    getUsers,
    createUser,
    updateUserRole,
    deleteUser,
    getReports,
    exportReports,
    getUserForEdit,
    updateUser
} = require('../controllers/adminController');

// Protect and authorize all routes
router.use(protect);
router.use(authorize('admin'));

// Admin dashboard
router.get('/dashboard', getAdminDashboard);

// User management
router.get('/users', getUsers);
router.post('/users', createUser);
router.post('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/users/:id/edit', getUserForEdit);
router.put('/users/:id', updateUser);
router.post('/users/:id', updateUser);

// Reports
router.get('/reports', getReports);
router.get('/reports/export', exportReports);

module.exports = router; 