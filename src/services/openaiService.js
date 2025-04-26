const OpenAI = require('openai');
const { toFile } = require('openai');
const axios = require('axios');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate an image using Grok API
 * @param {string} prompt - The text prompt
 * @param {string} size - Image size (e.g., '1024x1024')
 * @param {string} quality - Image quality (e.g., 'standard', 'hd')
 * @param {string} format - Image format (e.g., 'png', 'jpeg', 'webp')
 * @param {number} compression - Compression level (0-100)
 * @param {boolean} transparent - Whether to use transparent background
 * @returns {Object} Generated image data
 */
async function generateWithGrok(prompt, size = 'auto', quality = 'auto', format = 'png', compression = null, transparent = false) {
  try {
    console.log('Generating image with Grok API');
    
    // Prepare request parameters for Grok API
    const params = {
      model: "grok-2-image-1212",
      prompt: prompt,
      n: 1
    };
    
    // Add optional parameters if provided
    if (size !== 'auto') {
      // Convert size format if needed (e.g., '1024x1024' to { width: 1024, height: 1024 })
      const [width, height] = size.split('x').map(Number);
      if (width && height) {
        params.width = width;
        params.height = height;
      }
    }
    
    // Make request to Grok API
    const response = await axios.post('https://api.grok.ai/v1/images/generations', params, {
      headers: {
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Process response
    if (response.data && response.data.data && response.data.data.length > 0) {
      return {
        b64_json: response.data.data[0].b64_json || null,
        url: response.data.data[0].url || null,
        format: format
      };
    } else {
      throw new Error('Invalid response from Grok API');
    }
  } catch (error) {
    console.error('Grok image generation error:', error);
    throw new Error(error.message || 'Failed to generate image with Grok');
  }
}

/**
 * Generate an image from a text prompt
 * @param {string} prompt - The text prompt
 * @param {string} size - Image size (e.g., '1024x1024')
 * @param {string} model - Model to use (e.g., 'openai', 'grok')
 * @param {string} quality - Image quality (e.g., 'standard', 'hd')
 * @param {string} format - Image format (e.g., 'png', 'jpeg', 'webp')
 * @param {number} compression - Compression level (0-100)
 * @param {boolean} transparent - Whether to use transparent background
 * @returns {Object} Generated image data
 */
exports.generateImage = async (prompt, size = 'auto', model = 'openai', quality = 'auto', format = 'png', compression = null, transparent = false) => {
  try {
    // Determine which API to use based on the model parameter
    if (model === 'grok') {
      return await generateWithGrok(prompt, size, quality, format, compression, transparent);
    }
    
    // Default to OpenAI
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
 * Edit an image using Grok API
 * @param {string} prompt - The text prompt
 * @param {Array} files - Array of image files
 * @param {string} size - Image size (e.g., '1024x1024')
 * @param {string} quality - Image quality (e.g., 'standard', 'hd')
 * @param {string} format - Image format (e.g., 'png', 'jpeg', 'webp')
 * @param {number} compression - Compression level (0-100)
 * @param {boolean} transparent - Whether to use transparent background
 * @returns {Object} Generated image data
 */
async function editWithGrok(prompt, files, size = 'auto', quality = 'auto', format = 'png', compression = null, transparent = false) {
  try {
    console.log('Editing image with Grok API');
    
    // For now, Grok doesn't support image editing directly
    // So we'll use the first image as a reference and generate a new image based on the prompt
    
    // Convert the first image to base64
    const file = files[0];
    const base64Image = file.buffer.toString('base64');
    
    // Prepare request parameters for Grok API
    const params = {
      model: "grok-2-image-1212",
      prompt: `Edit this image: ${prompt}`,
      n: 1,
      reference_image: base64Image
    };
    
    // Add optional parameters if provided
    if (size !== 'auto') {
      // Convert size format if needed (e.g., '1024x1024' to { width: 1024, height: 1024 })
      const [width, height] = size.split('x').map(Number);
      if (width && height) {
        params.width = width;
        params.height = height;
      }
    }
    
    // Make request to Grok API
    const response = await axios.post('https://api.grok.ai/v1/images/generations', params, {
      headers: {
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Process response
    if (response.data && response.data.data && response.data.data.length > 0) {
      return {
        b64_json: response.data.data[0].b64_json || null,
        url: response.data.data[0].url || null,
        format: format
      };
    } else {
      throw new Error('Invalid response from Grok API');
    }
  } catch (error) {
    console.error('Grok image editing error:', error);
    throw new Error(error.message || 'Failed to edit image with Grok');
  }
}

/**
 * Edit images using AI
 * @param {string} prompt - The text prompt
 * @param {Array} files - Array of image files
 * @param {string} size - Image size (e.g., '1024x1024')
 * @param {string} model - Model to use (e.g., 'openai', 'grok')
 * @param {string} quality - Image quality (e.g., 'standard', 'hd')
 * @param {string} format - Image format (e.g., 'png', 'jpeg', 'webp')
 * @param {number} compression - Compression level (0-100)
 * @param {boolean} transparent - Whether to use transparent background
 * @returns {Object} Generated image data
 */
exports.editImage = async (prompt, files, size = 'auto', model = 'openai', quality = 'auto', format = 'png', compression = null, transparent = false) => {
  try {
    console.log(`Editing image with ${files.length} files using ${model} model`);
    
    // Determine which API to use based on the model parameter
    if (model === 'grok') {
      try {
        return await editWithGrok(prompt, files, size, quality, format, compression, transparent);
      } catch (error) {
        console.error('Falling back to OpenAI due to Grok failure:', error);
        // Fall back to OpenAI if Grok fails
      }
    }
    
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
