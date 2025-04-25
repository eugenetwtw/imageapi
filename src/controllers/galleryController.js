const { createError } = require('../utils/errorUtils');
const supabaseService = require('../services/supabaseService');

/**
 * Get all images from the gallery
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllImages = async (req, res, next) => {
  try {
    const images = await supabaseService.getAllImages();
    
    res.status(200).json({
      status: 'success',
      results: images.length,
      data: images
    });
  } catch (error) {
    console.error('Error fetching gallery images:', error);
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

    // Ensure isEdit is a boolean
    const isEditBoolean = isEdit === true;
    
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
