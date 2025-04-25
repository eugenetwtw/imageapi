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
    
    // Create temporary files from the buffers
    const tempFiles = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const tempFilePath = path.join(__dirname, `../../temp/temp_image_${i}.png`);
      fs.writeFileSync(tempFilePath, file.buffer);
      tempFiles.push(tempFilePath);
      console.log(`Created temp file: ${tempFilePath}`);
    }
    
    // Convert file streams to OpenAI file format using toFile
    const openaiFiles = await Promise.all(
      tempFiles.map(async (file) => {
        return await toFile(fs.createReadStream(file), null, {
          type: "image/png",
        });
      })
    );
    
    console.log('Created OpenAI files:', openaiFiles.map(f => f.filename));
    
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
    
    // Clean up temporary files
    tempFiles.forEach(file => {
      try {
        fs.unlinkSync(file);
        console.log(`Deleted temp file: ${file}`);
      } catch (err) {
        console.error(`Error deleting temp file ${file}:`, err);
      }
    });

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
