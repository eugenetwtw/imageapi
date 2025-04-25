// Global variables
let selectedFiles = [];
let generatedImage = null;

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI elements
    initializeUI();
    
    // Initialize Supabase
    initializeSupabase();
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

// Generate image using API
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
    
    resultSection.classList.remove('hidden');
    loading.classList.remove('hidden');
    resultContainer.innerHTML = '';
    downloadBtn.classList.add('hidden');
    
    try {
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

// Create image using API
async function createImage(prompt, size, quality, format, compression, transparent) {
    try {
        const response = await fetch('/api/images/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt,
                size,
                quality,
                format,
                compression,
                transparent
            })
        });
        
        if (!response.ok) {
            let errorMessage = 'Failed to generate image';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (parseError) {
                // If the response is not valid JSON, try to get the text
                try {
                    const errorText = await response.text();
                    errorMessage = errorText || errorMessage;
                } catch (textError) {
                    console.error('Error parsing error response:', textError);
                }
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error in createImage:', error);
        throw error;
    }
}

// Edit image using API
async function editImage(prompt, files, size, quality, format, compression, transparent) {
    try {
        // Create FormData
        const formData = new FormData();
        formData.append('prompt', prompt);
        
        if (size !== 'auto') formData.append('size', size);
        if (quality !== 'auto') formData.append('quality', quality);
        formData.append('format', format);
        if (compression !== null) formData.append('compression', compression);
        formData.append('transparent', transparent);
        
        // Append all image files
        files.forEach(file => {
            formData.append('images', file);
        });
        
        const response = await fetch('/api/images/edit', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            let errorMessage = 'Failed to edit image';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (parseError) {
                // If the response is not valid JSON, try to get the text
                try {
                    const errorText = await response.text();
                    errorMessage = errorText || errorMessage;
                } catch (textError) {
                    console.error('Error parsing error response:', textError);
                }
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        return data.data;
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
