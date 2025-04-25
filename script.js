// Global variables
let selectedFiles = [];
let generatedImage = null;

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI elements
    initializeUI();
    
    // Initialize Supabase
    initializeSupabase();
    
    // Load gallery images
    loadGallery();
});

// Initialize UI elements and event listeners
function initializeUI() {
    // Drop area functionality
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);
    
    // Handle selected files
    fileInput.addEventListener('change', handleFiles, false);
    
    // Compression range
    const compressionRange = document.getElementById('compression-range');
    const compressionValue = document.getElementById('compression-value');
    
    compressionRange.addEventListener('input', () => {
        compressionValue.textContent = `${compressionRange.value}%`;
    });
    
    // Format select - disable/enable compression and transparent options
    const formatSelect = document.getElementById('format-select');
    const compressionGroup = document.querySelector('.option-group:nth-of-type(4)');
    const transparentGroup = document.querySelector('.option-group:nth-of-type(5)');
    
    formatSelect.addEventListener('change', () => {
        const format = formatSelect.value;
        
        // Enable/disable compression based on format
        if (format === 'png') {
            compressionGroup.style.opacity = '0.5';
            compressionGroup.style.pointerEvents = 'none';
        } else {
            compressionGroup.style.opacity = '1';
            compressionGroup.style.pointerEvents = 'auto';
        }
        
        // Enable/disable transparent background based on format
        if (format === 'jpeg') {
            transparentGroup.style.opacity = '0.5';
            transparentGroup.style.pointerEvents = 'none';
            document.getElementById('transparent-bg').checked = false;
        } else {
            transparentGroup.style.opacity = '1';
            transparentGroup.style.pointerEvents = 'auto';
        }
    });
    
    // Generate button
    const generateBtn = document.getElementById('generate-btn');
    generateBtn.addEventListener('click', generateImage);
    
    // Download button
    const downloadBtn = document.getElementById('download-btn');
    downloadBtn.addEventListener('click', downloadImage);
    
    // Save button
    const saveBtn = document.getElementById('save-btn');
    saveBtn.addEventListener('click', saveToGallery);
}

// Initialize Supabase client
function initializeSupabase() {
    try {
        // Check if SUPABASE_URL and SUPABASE_KEY are defined in config.js
        if (!SUPABASE_URL || !SUPABASE_KEY) {
            console.error('Supabase configuration is missing. Please check your config.js file.');
            return;
        }
        
        window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('Supabase initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        showError('Failed to connect to the database. Please check your configuration.');
    }
}

// Prevent default drag behaviors
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight drop area
function highlight() {
    document.getElementById('drop-area').classList.add('highlight');
}

// Remove highlight from drop area
function unhighlight() {
    document.getElementById('drop-area').classList.remove('highlight');
}

// Handle dropped files
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles({ target: { files } });
}

// Handle selected files
function handleFiles(e) {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        showError('Please select valid image files.');
        return;
    }
    
    // Add new files to selectedFiles array
    selectedFiles = [...selectedFiles, ...imageFiles];
    
    // Update preview
    updateImagePreview();
}

// Update image preview
function updateImagePreview() {
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    
    // Clear existing preview
    imagePreview.innerHTML = '';
    
    // Show preview container if there are files
    if (selectedFiles.length > 0) {
        previewContainer.classList.remove('hidden');
        
        // Add preview for each file
        selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = file.name;
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '&times;';
                removeBtn.addEventListener('click', () => removeFile(index));
                
                previewItem.appendChild(img);
                previewItem.appendChild(removeBtn);
                imagePreview.appendChild(previewItem);
            };
            
            reader.readAsDataURL(file);
        });
    } else {
        previewContainer.classList.add('hidden');
    }
}

// Remove file from selectedFiles
function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateImagePreview();
}

// Generate image using OpenAI API
async function generateImage() {
    // Get prompt
    const prompt = document.getElementById('prompt-input').value.trim();
    
    if (!prompt) {
        showError('Please enter a prompt to generate an image.');
        return;
    }
    
    // Get options
    const size = document.getElementById('size-select').value;
    const quality = document.getElementById('quality-select').value;
    const format = document.getElementById('format-select').value;
    const compression = format !== 'png' ? parseInt(document.getElementById('compression-range').value) : null;
    const transparent = document.getElementById('transparent-bg').checked && (format === 'png' || format === 'webp');
    
    // Show loading
    const resultSection = document.getElementById('result-section');
    const loading = document.getElementById('loading');
    const resultContainer = document.getElementById('result-container');
    const downloadBtn = document.getElementById('download-btn');
    const saveBtn = document.getElementById('save-btn');
    
    resultSection.classList.remove('hidden');
    loading.classList.remove('hidden');
    resultContainer.innerHTML = '';
    downloadBtn.classList.add('hidden');
    saveBtn.classList.add('hidden');
    
    try {
        // Check if OpenAI API key is configured
        if (!OPENAI_API_KEY) {
            throw new Error('OpenAI API key is missing. Please check your config.js file.');
        }
        
        let result;
        
        // If files are selected, use image edit endpoint
        if (selectedFiles.length > 0) {
            result = await editImage(prompt, selectedFiles, size, quality, format, compression, transparent);
        } else {
            // Otherwise use image generation endpoint
            result = await createImage(prompt, size, quality, format, compression, transparent);
        }
        
        // Display the result
        if (result && result.b64_json) {
            generatedImage = {
                data: result.b64_json,
                format: format,
                prompt: prompt
            };
            
            const img = document.createElement('img');
            img.src = `data:image/${format};base64,${result.b64_json}`;
            img.alt = prompt;
            
            resultContainer.appendChild(img);
            downloadBtn.classList.remove('hidden');
            saveBtn.classList.remove('hidden');
        } else {
            throw new Error('Failed to generate image. Please try again.');
        }
    } catch (error) {
        console.error('Error generating image:', error);
        resultContainer.innerHTML = `<div class="error">${error.message || 'Failed to generate image. Please try again.'}</div>`;
    } finally {
        loading.classList.add('hidden');
    }
}

// Create image using OpenAI API
async function createImage(prompt, size, quality, format, compression, transparent) {
    try {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-image-1",
                prompt: prompt,
                n: 1,
                size: size !== 'auto' ? size : undefined,
                quality: quality !== 'auto' ? quality : undefined,
                response_format: 'b64_json',
                background: transparent ? 'transparent' : undefined,
                output_compression: compression !== null ? compression / 100 : undefined
            })
        };
        
        const response = await fetch('https://api.openai.com/v1/images/generations', options);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to generate image');
        }
        
        const data = await response.json();
        return data.data[0];
    } catch (error) {
        console.error('Error in createImage:', error);
        throw error;
    }
}

// Edit image using OpenAI API
async function editImage(prompt, files, size, quality, format, compression, transparent) {
    try {
        // Create FormData
        const formData = new FormData();
        formData.append('model', 'gpt-image-1');
        formData.append('prompt', prompt);
        formData.append('n', '1');
        formData.append('response_format', 'b64_json');
        
        if (size !== 'auto') formData.append('size', size);
        if (quality !== 'auto') formData.append('quality', quality);
        if (transparent) formData.append('background', 'transparent');
        if (compression !== null) formData.append('output_compression', compression / 100);
        
        // Append all image files
        files.forEach(file => {
            formData.append('image', file);
        });
        
        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: formData
        };
        
        const response = await fetch('https://api.openai.com/v1/images/edit', options);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to edit image');
        }
        
        const data = await response.json();
        return data.data[0];
    } catch (error) {
        console.error('Error in editImage:', error);
        throw error;
    }
}

// Download generated image
function downloadImage() {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = `data:image/${generatedImage.format};base64,${generatedImage.data}`;
    link.download = `generated-image-${Date.now()}.${generatedImage.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Save image to gallery (Supabase)
async function saveToGallery() {
    if (!generatedImage) return;
    
    try {
        // Check if Supabase is initialized
        if (!window.supabase) {
            throw new Error('Database connection not initialized');
        }
        
        const timestamp = new Date().toISOString();
        const { data, error } = await window.supabase
            .from('photo2writing')
            .insert([
                {
                    prompt: generatedImage.prompt,
                    image_data: generatedImage.data,
                    format: generatedImage.format,
                    created_at: timestamp
                }
            ]);
        
        if (error) throw error;
        
        showSuccess('Image saved to gallery successfully!');
        
        // Reload gallery
        loadGallery();
    } catch (error) {
        console.error('Error saving to gallery:', error);
        showError('Failed to save image to gallery. Please try again.');
    }
}

// Load gallery images from Supabase
async function loadGallery() {
    try {
        // Check if Supabase is initialized
        if (!window.supabase) {
            throw new Error('Database connection not initialized');
        }
        
        const { data, error } = await window.supabase
            .from('photo2writing')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const galleryContainer = document.getElementById('gallery-container');
        const emptyMessage = document.getElementById('gallery-empty-message');
        
        // Clear existing gallery
        galleryContainer.innerHTML = '';
        
        if (data && data.length > 0) {
            emptyMessage.style.display = 'none';
            
            // Add each image to gallery
            data.forEach(item => {
                const galleryItem = document.createElement('div');
                galleryItem.className = 'gallery-item';
                
                const img = document.createElement('img');
                img.src = `data:image/${item.format};base64,${item.image_data}`;
                img.alt = item.prompt;
                
                const overlay = document.createElement('div');
                overlay.className = 'gallery-item-overlay';
                
                const prompt = document.createElement('p');
                prompt.textContent = item.prompt;
                
                const actions = document.createElement('div');
                actions.className = 'gallery-item-actions';
                
                const downloadBtn = document.createElement('button');
                downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download';
                downloadBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    downloadGalleryImage(item);
                });
                
                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteGalleryImage(item.id);
                });
                
                actions.appendChild(downloadBtn);
                actions.appendChild(deleteBtn);
                
                overlay.appendChild(prompt);
                overlay.appendChild(actions);
                
                galleryItem.appendChild(img);
                galleryItem.appendChild(overlay);
                
                galleryContainer.appendChild(galleryItem);
            });
        } else {
            emptyMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading gallery:', error);
        const galleryContainer = document.getElementById('gallery-container');
        galleryContainer.innerHTML = `<div class="error">Failed to load gallery. Please try again.</div>`;
    }
}

// Download gallery image
function downloadGalleryImage(item) {
    const link = document.createElement('a');
    link.href = `data:image/${item.format};base64,${item.image_data}`;
    link.download = `gallery-image-${Date.now()}.${item.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Delete gallery image
async function deleteGalleryImage(id) {
    try {
        // Check if Supabase is initialized
        if (!window.supabase) {
            throw new Error('Database connection not initialized');
        }
        
        const { error } = await window.supabase
            .from('photo2writing')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showSuccess('Image deleted successfully!');
        
        // Reload gallery
        loadGallery();
    } catch (error) {
        console.error('Error deleting image:', error);
        showError('Failed to delete image. Please try again.');
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    
    // Remove any existing error messages
    document.querySelectorAll('.error').forEach(el => el.remove());
    
    // Add to the top of the input section
    const inputSection = document.querySelector('.input-section');
    inputSection.insertBefore(errorDiv, inputSection.firstChild);
    
    // Remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Show success message
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success';
    successDiv.textContent = message;
    
    // Remove any existing success messages
    document.querySelectorAll('.success').forEach(el => el.remove());
    
    // Add to the top of the input section
    const inputSection = document.querySelector('.input-section');
    inputSection.insertBefore(successDiv, inputSection.firstChild);
    
    // Remove after 5 seconds
    setTimeout(() => {
        successDiv.remove();
    }, 5000);
}
