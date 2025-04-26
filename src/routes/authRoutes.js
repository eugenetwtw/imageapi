const express = require('express');
const authController = require('../controllers/authController');
const { verifyAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth verification middleware to all routes
router.use(verifyAuth);

// Get current user
router.get('/user', authController.getCurrentUser);

// Check session
router.get('/session', authController.checkSession);

module.exports = router;
