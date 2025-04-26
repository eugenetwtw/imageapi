const express = require('express');
const authController = require('../controllers/authController');
const { verifyAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Get Supabase key for client-side use (no auth required)
router.get('/key', authController.getSupabaseKey);

// OAuth sign-in route (no auth required)
router.get('/signin', authController.signInWithOAuth);

// Apply auth verification middleware to all other routes
router.use(verifyAuth);

// Get current user
router.get('/user', authController.getCurrentUser);

// Check session
router.get('/session', authController.checkSession);

module.exports = router;
