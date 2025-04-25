const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Table name
const TABLE_NAME = 'imageapi';

/**
 * Get all images from the gallery
 * @returns {Array} Array of gallery images
 */
exports.getAllImages = async () => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Supabase error fetching images:', error);
    throw new Error(error.message || 'Failed to fetch gallery images');
  }
};

/**
 * Save an image to the gallery
 * @param {string} prompt - The text prompt used to generate the image
 * @param {string} imageData - Base64 encoded image data
 * @param {string} format - Image format (e.g., 'png', 'jpeg', 'webp')
 * @param {number} duration - Duration in seconds it took to generate the image
 * @param {boolean} isEdit - Whether this was an edit operation
 * @param {string} sourceType - Source type of the image (text, edit, etc.)
 * @returns {Object} Saved image data
 */
exports.saveImage = async (prompt, imageData, format, duration = 0, isEdit = false, sourceType = 'text') => {
  try {
    const timestamp = new Date().toISOString();
    
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([
        {
          prompt: prompt,
          image_data: imageData,
          format: format,
          created_at: timestamp,
          duration_seconds: duration,
          is_edit: isEdit,
          source_type: sourceType
        }
      ])
      .select();

    if (error) throw error;

    return data[0] || null;
  } catch (error) {
    console.error('Supabase error saving image:', error);
    throw new Error(error.message || 'Failed to save image to gallery');
  }
};

/**
 * Get a specific image by ID
 * @param {string} id - Image ID
 * @returns {Object} Image data
 */
exports.getImageById = async (id) => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return data || null;
  } catch (error) {
    console.error('Supabase error fetching image by ID:', error);
    throw new Error(error.message || 'Failed to fetch image');
  }
};

/**
 * Delete an image from the gallery
 * @param {string} id - Image ID
 * @returns {boolean} Success status
 */
exports.deleteImage = async (id) => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Supabase error deleting image:', error);
    throw new Error(error.message || 'Failed to delete image');
  }
};
