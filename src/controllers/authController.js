const { createError } = require('../utils/errorUtils');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/**
 * Handle OAuth sign-in
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.signInWithOAuth = async (req, res, next) => {
  try {
    const { provider, redirectTo } = req.query;
    
    if (!provider) {
      return next(createError(400, 'Provider is required'));
    }
    
    // Get the OAuth URL from Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo || process.env.REDIRECT_URL || `${req.protocol}://${req.get('host')}`
      }
    });
    
    if (error) {
      return next(createError(500, error.message || 'Failed to generate OAuth URL'));
    }
    
    // Redirect to the OAuth URL
    res.redirect(data.url);
  } catch (error) {
    console.error('Error in OAuth sign-in:', error);
    next(createError(500, error.message || 'Failed to initiate OAuth sign-in'));
  }
};

/**
 * Get the current authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    // If user is not set by auth middleware, return null
    if (!req.user) {
      return res.status(200).json({
        status: 'success',
        data: null
      });
    }
    
    // Return user data
    res.status(200).json({
      status: 'success',
      data: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.user_metadata?.full_name || null,
        avatar: req.user.user_metadata?.avatar_url || null
      }
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    next(createError(500, error.message || 'Failed to get current user'));
  }
};

/**
 * Check if the current session is valid
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.checkSession = async (req, res, next) => {
  try {
    // If user is not set by auth middleware, session is invalid
    if (!req.user) {
      return res.status(200).json({
        status: 'success',
        data: {
          valid: false
        }
      });
    }
    
    // Session is valid
    res.status(200).json({
      status: 'success',
      data: {
        valid: true,
        user: {
          id: req.user.id,
          email: req.user.email,
          name: req.user.user_metadata?.full_name || null,
          avatar: req.user.user_metadata?.avatar_url || null
        }
      }
    });
  } catch (error) {
    console.error('Error checking session:', error);
    next(createError(500, error.message || 'Failed to check session'));
  }
};
