const { createError } = require('../utils/errorUtils');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/**
 * Middleware to verify authentication token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.verifyAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue as unauthenticated
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      console.warn('Invalid auth token:', error);
      // Invalid token, continue as unauthenticated
      return next();
    }
    
    // Token is valid, set user in request
    req.user = data.user;
    console.log('Authenticated user:', req.user.id);
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    // Continue as unauthenticated in case of error
    next();
  }
};

/**
 * Middleware to require authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.requireAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(createError(401, 'Authentication required'));
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      console.warn('Invalid auth token:', error);
      return next(createError(401, 'Invalid or expired token'));
    }
    
    // Token is valid, set user in request
    req.user = data.user;
    console.log('Authenticated user:', req.user.id);
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    next(createError(500, 'Authentication error'));
  }
};
