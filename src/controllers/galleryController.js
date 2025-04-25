const { createError } = require('../utils/errorUtils');
const supabaseService = require('../services/supabaseService');

/**
 * Get images from the gallery with pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllImages = async (req, res, next) => {
  try {
    // Set a reasonable default limit to avoid timeouts
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
    const offset = parseInt(req.query.offset, 10) || 0;
    const fetchTotal = req.query.fetchTotal === 'true';
    
    console.log('Requesting images with limit:', limit, 'offset:', offset, 'fetchTotal:', fetchTotal);
    const result = await supabaseService.getAllImages(limit, offset, fetchTotal);
    
    res.status(200).json({
      status: 'success',
      results: result.data.length,
      total: result.total,
      data: result.data
    });
  } catch (error) {
    console.error('Error fetching gallery images:', error.message, error.stack);
    next(createError(500, error.message || 'Failed to fetch gallery images'));
  }
};

/**
 * Save an image to the gallery
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.saveImage = async (req, res, next) => {
  try {
    const { prompt, imageData, format, duration, isEdit, sourceType } = req.body;

    // Validate request
    if (!prompt || !imageData || !format) {
      return next(createError(400, 'Prompt, image data, and format are required'));
    }

    // Ensure isEdit is a boolean and log it
    const isEditBoolean = isEdit === true;
    console.log('Saving image with isEdit:', isEdit, 'converted to:', isEditBoolean);
    
    // Save image to gallery
    const result = await supabaseService.saveImage(
      prompt, 
      imageData, 
      format, 
      duration || 0, 
      isEditBoolean, 
      sourceType || 'text'
    );

    res.status(201).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error saving image to gallery:', error);
    next(createError(500, error.message || 'Failed to save image to gallery'));
  }
};

/**
 * Get a specific image by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getImageById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get image by ID
    const image = await supabaseService.getImageById(id);
    
    if (!image) {
      return next(createError(404, 'Image not found'));
    }
    
    res.status(200).json({
      status: 'success',
      data: image
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    next(createError(500, error.message || 'Failed to fetch image'));
  }
};

/**
 * Delete an image from the gallery
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Delete image
    const result = await supabaseService.deleteImage(id);
    
    if (!result) {
      return next(createError(404, 'Image not found'));
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    next(createError(500, error.message || 'Failed to delete image'));
  }
};
