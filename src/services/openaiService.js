const OpenAI = require('openai');
const { toFile } = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate an image from a text prompt
 * @param {string} prompt - The text prompt
 * @param {string} size - Image size (e.g., '1024x1024')
 * @param {string} quality - Image quality (e.g., 'standard', 'hd')
 * @param {string} format - Image format (e.g., 'png', 'jpeg', 'webp')
 * @param {number} compression - Compression level (0-100)
 * @param {boolean} transparent - Whether to use transparent background
 * @returns {Object} Generated image data
 */
exports.generateImage = async (prompt, size = 'auto', quality = 'auto', format = 'png', compression = null, transparent = false) => {
  try {
    // Prepare request parameters
    const params = {
      model: "gpt-image-1",
      prompt: prompt,
      n: 1
    };

    // Add optional parameters if provided
    if (size !== 'auto') params.size = size;
    if (quality !== 'auto') params.quality = quality;
    if (transparent && (format === 'png' || format === 'webp')) params.background = 'transparent';
    if (compression !== null && format !== 'png') params.output_compression = compression / 100;

    // Call OpenAI API
    const response = await openai.images.generate(params);

    // Return the generated image data
    return {
      b64_json: response.data[0].url ? null : response.data[0].b64_json,
      url: response.data[0].url || null,
      format: format
    };
  } catch (error) {
    console.error('OpenAI image generation error:', error);
    throw new Error(error.message || 'Failed to generate image');
  }
};

const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

const sharp = require('sharp');

/**
 * Edit images using AI
 * @param {string} prompt - The text prompt
 * @param {Array} files - Array of image files
 * @param {string} size - Image size (e.g., '1024x1024')
 * @param {string} quality - Image quality (e.g., 'standard', 'hd')
 * @param {string} format - Image format (e.g., 'png', 'jpeg', 'webp')
 * @param {number} compression - Compression level (0-100)
 * @param {boolean} transparent - Whether to use transparent background
 * @returns {Object} Generated image data
 */
exports.editImage = async (prompt, files, size = 'auto', quality = 'auto', format = 'png', compression = null, transparent = false) => {
  try {
    console.log(`Editing image with ${files.length} files`);
    
    // Convert file buffers, handling HEIC format conversion if necessary
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        // Check if the file is in HEIC format
        if (file.mimetype === 'image/heic' || file.mimetype === 'image/heif') {
          console.log(`Converting HEIC file: ${file.originalname}`);
          // Convert HEIC to PNG using sharp
          const convertedBuffer = await sharp(file.buffer)
            .png()
            .toBuffer();
          return {
            ...file,
            buffer: convertedBuffer,
            mimetype: 'image/png',
            originalname: file.originalname.replace(/\.(heic|heif)$/i, '.png')
          };
        }
        return file;
      })
    );
    
    // Convert processed file buffers to OpenAI file format using toFile and Readable streams
    const openaiFiles = await Promise.all(
      processedFiles.map(async (file) => {
        // Create a readable stream from the buffer
        const stream = new Readable();
        stream.push(file.buffer);
        stream.push(null); // Signal the end of the stream
        
        // Convert to OpenAI file format
        return await toFile(stream, file.originalname, {
          type: file.mimetype,
        });
      })
    );
    
    console.log('Created OpenAI files:', openaiFiles.map(f => f.filename || 'unnamed'));
    
    // Prepare request parameters
    const params = {
      model: "gpt-image-1",
      prompt: prompt,
      n: 1,
      image: openaiFiles
    };
    
    // Add optional parameters if provided
    if (size !== 'auto') params.size = size;
    if (quality !== 'auto') params.quality = quality;
    if (transparent && (format === 'png' || format === 'webp')) params.background = 'transparent';
    if (compression !== null && format !== 'png') params.output_compression = compression / 100;
    
    console.log('Sending request to OpenAI API with params:', JSON.stringify(params, (key, value) => {
      if (key === 'image') return '[Image Stream]';
      return value;
    }));
    
    // Call OpenAI API
    const response = await openai.images.edit(params);

    // Return the generated image data
    return {
      b64_json: response.data[0].url ? null : response.data[0].b64_json,
      url: response.data[0].url || null,
      format: format
    };
  } catch (error) {
    console.error('OpenAI image editing error:', error);
    throw new Error(error.message || 'Failed to edit image');
  }
};
