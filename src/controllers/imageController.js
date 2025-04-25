const OpenAI = require('openai');
const { createError } = require('../utils/errorUtils');
const openaiService = require('../services/openaiService');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate an image from a text prompt
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.generateImage = async (req, res, next) => {
  try {
    const { prompt, size, quality, format, compression, transparent } = req.body;

    // Validate request
    if (!prompt) {
      return next(createError(400, 'Prompt is required'));
    }

    // Generate image
    const result = await openaiService.generateImage(
      prompt, 
      size, 
      quality, 
      format, 
      compression, 
      transparent
    );

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error generating image:', error);
    next(createError(500, error.message || 'Failed to generate image'));
  }
};

/**
 * Edit images using AI
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.editImage = async (req, res, next) => {
  try {
    const { prompt, size, quality, format, compression, transparent } = req.body;
    const files = req.files;

    // Log the files object structure
    console.log('Files object structure:', JSON.stringify(files, (key, value) => {
      if (key === 'buffer' && value) {
        return '[Buffer data]';
      }
      return value;
    }, 2));

    // Validate request
    if (!prompt) {
      return next(createError(400, 'Prompt is required'));
    }

    if (!files || files.length === 0) {
      return next(createError(400, 'At least one image file is required'));
    }

    // Edit image
    const result = await openaiService.editImage(
      prompt,
      files,
      size,
      quality,
      format,
      compression,
      transparent
    );

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error editing image:', error);
    next(createError(500, error.message || 'Failed to edit image'));
  }
};
