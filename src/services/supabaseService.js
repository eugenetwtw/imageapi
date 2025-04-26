const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Table name
const TABLE_NAME = 'imageapi';

// Simple cache for count results to avoid repeated expensive count queries
const countCache = {
  value: null,
  timestamp: 0,
  // Cache expires after 5 minutes
  TTL: 5 * 60 * 1000
};

/**
 * Get all images from the gallery
 * @param {number} limit - Number of items to fetch (optional, if not provided, fetch all)
 * @param {number} offset - Offset for pagination (optional)
 * @param {boolean} fetchTotal - Whether to fetch the total count (can be skipped for performance)
 * @param {string} userId - Filter images by user ID (optional)
 * @returns {Object} Object containing array of gallery images and total count (if fetched)
 */
exports.getAllImages = async (limit = null, offset = 0, fetchTotal = false, userId = null) => {
  try {
    console.log('Fetching images from Supabase table:', TABLE_NAME, 'with limit:', limit, 'and offset:', offset, 'fetchTotal:', fetchTotal, 'userId:', userId);
    console.time('Supabase Fetch Data Time');
    
    // Select only the necessary columns to reduce data transfer
    let query = supabase
      .from(TABLE_NAME)
      .select('id, prompt, image_data, format, created_at, duration_seconds, is_edit, source_type, user_id')
      .order('created_at', { ascending: false });
    
    // Filter by user_id if provided
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    // Apply pagination only if limit is provided
    if (limit !== null) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;

    console.timeEnd('Supabase Fetch Data Time');
    
    if (error) throw error;

    let count = 0;
    if (fetchTotal) {
      // Check if we have a valid cached count
      const now = Date.now();
      if (countCache.value !== null && (now - countCache.timestamp) < countCache.TTL) {
        console.log('Using cached count value:', countCache.value);
        count = countCache.value;
      } else {
        console.time('Supabase Fetch Count Time');
        try {
          // Use a more efficient count query
          // Instead of selecting all columns, just select the id which is more efficient
          const { count: totalCount, error: countError } = await supabase
            .from(TABLE_NAME)
            .select('id', { count: 'exact', head: true });
          
          console.timeEnd('Supabase Fetch Count Time');
          
          if (countError) {
            console.warn('Count query error, using estimate instead:', countError);
            // If count query fails, use an estimate based on the current page
            count = offset + data.length + (data.length === limit ? limit : 0);
          } else {
            count = totalCount || 0;
            // Update the cache
            countCache.value = count;
            countCache.timestamp = now;
            console.log('Updated count cache with value:', count);
          }
        } catch (countError) {
          console.warn('Count query exception, using estimate instead:', countError);
          // If count query throws an exception, use an estimate
          count = offset + data.length + (data.length === limit ? limit : 0);
        }
      }
    } else {
      console.log('Skipping total count fetch for performance');
      // Provide an estimate based on current data
      count = offset + data.length + (data.length === limit ? limit : 0);
    }

    console.log(`Retrieved ${data ? data.length : 0} images from Supabase, total count: ${count}`);
    
    // Log the first few images for debugging
    if (data && data.length > 0) {
      console.log('First image:', {
        id: data[0].id,
        prompt: data[0].prompt,
        created_at: data[0].created_at,
        is_edit: data[0].is_edit,
        format: data[0].format
      });
    }

    return { data: data || [], total: count };
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
 * @param {string} userId - The ID of the user who created the image (optional)
 * @returns {Object} Saved image data
 */
exports.saveImage = async (prompt, imageData, format, duration = 0, isEdit = false, sourceType = 'text', userId = null) => {
  // Ensure isEdit is a boolean
  const isEditBoolean = isEdit === true;
  
  console.log('Saving image to Supabase:', {
    prompt: prompt,
    format: format,
    duration: duration,
    isEdit: isEdit,
    isEditBoolean: isEditBoolean,
    sourceType: sourceType,
    userId: userId,
    imageDataLength: imageData ? imageData.length : 0,
    table: TABLE_NAME
  });
  
  try {
    const timestamp = new Date().toISOString();
    
    const imageRecord = {
      prompt: prompt,
      image_data: imageData,
      format: format,
      created_at: timestamp,
      duration_seconds: duration,
      is_edit: isEditBoolean,
      source_type: sourceType,
      user_id: userId
    };
    
    console.log('Image record prepared with is_edit:', imageRecord.is_edit);
    
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([imageRecord])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    console.log('Image saved successfully:', {
      id: data && data[0] ? data[0].id : null,
      is_edit: data && data[0] ? data[0].is_edit : null
    });

    // Invalidate the count cache since we've added a new image
    countCache.value = null;
    console.log('Count cache invalidated due to new image');

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

    // Invalidate the count cache since we've deleted an image
    countCache.value = null;
    console.log('Count cache invalidated due to image deletion');

    return true;
  } catch (error) {
    console.error('Supabase error deleting image:', error);
    throw new Error(error.message || 'Failed to delete image');
  }
};
