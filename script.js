// Global variables
let selectedFiles = [];
let generatedImage = null;
let lastGenerationDuration = 0;
let currentUser = null;

// Auth DOM Elements
let signInBtn;
let signOutBtn;
let userInfo;
let userAvatar;
let userName;

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI elements
    initializeUI();
    
    // Initialize auth UI elements
    initializeAuthUI();
    
    // Initialize Supabase
    initializeSupabase();
    
    // No need to load gallery anymore
});

// Fetch user's images from the gallery
async function fetchUserImages() {
    try {
        if (!currentUser) {
            console.log('No user logged in, cannot fetch user images');
            return [];
        }
        
        const response = await fetch(`/api/gallery?userId=${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${currentUser.session?.access_token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch user images');
        }
        
        const data = await response.json();
        console.log(`Fetched ${data.results} user images`);
        return data.data;
    } catch (error) {
        console.error('Error fetching user images:', error);
        showError('Failed to fetch your images. Please try again later.');
        return [];
    }
}

// Delete an image from the gallery
async function deleteImage(imageId) {
    try {
        if (!currentUser) {
            showError('You must be logged in to delete images');
            return false;
        }
        
        if (!imageId) {
            console.error('No image ID provided for deletion');
            return false;
        }
        
        const response = await fetch(`/api/gallery/${imageId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentUser.session?.access_token}`
            }
        });
        
        if (!response.ok) {
            let errorMessage = 'Failed to delete image';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (parseError) {
                console.error('Error parsing error response:', parseError);
            }
            throw new Error(errorMessage);
        }
        
        showSuccess('Image deleted successfully');
        return true;
    } catch (error) {
        console.error('Error deleting image:', error);
        showError(error.message || 'Failed to delete image. Please try again later.');
        return false;
    }
}

// Initialize auth UI elements
function initializeAuthUI() {
    signInBtn = document.getElementById('signInBtn');
    signOutBtn = document.getElementById('signOutBtn');
    userInfo = document.getElementById('userInfo');
    userAvatar = document.getElementById('userAvatar');
    userName = document.getElementById('userName');
    
    // Set up event listeners
    signInBtn.addEventListener('click', signInWithGoogle);
    signOutBtn.addEventListener('click', signOut);
}

// Sign in with Google
function signInWithGoogle() {
    window.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
            redirectTo: window.location.origin,
            queryParams: { prompt: 'select_account' }
        }
    });
}

// Sign out
function signOut() {
    window.supabase.auth.signOut();
}

// Handle authentication state
function handleAuth(session) {
    if (session) {
        // User is signed in
        currentUser = session.user;
        currentUser.session = session;
        
        // Update UI
        signInBtn.style.display = 'none';
        signOutBtn.style.display = 'inline';
        userInfo.style.display = 'flex';
        
        // Display user info
        userAvatar.src = session.user.user_metadata.avatar_url || '';
        userName.textContent = session.user.user_metadata.full_name || session.user.email;
        
        console.log('User signed in:', currentUser);
        
        // Fetch user's images
        fetchUserImages().then(images => {
            console.log(`User has ${images.length} images`);
            // You can display the user's images here if needed
        });
    } else {
        // User is signed out
        currentUser = null;
        
        // Update UI
        signInBtn.style.display = 'inline';
        signOutBtn.style.display = 'none';
        userInfo.style.display = 'none';
        
        console.log('User signed out');
    }
}

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
        if (!window.ENV.SUPABASE_URL || !window.ENV.SUPABASE_KEY) {
            console.error('Supabase configuration is missing. Please check your config.js file.');
            return;
        }
        
        // Initialize Supabase client
        window.supabase = supabase.createClient(
            window.ENV.SUPABASE_URL, 
            window.ENV.SUPABASE_KEY
        );
        
        // Set up auth state listener
        window.supabase.auth.onAuthStateChange((_event, session) => {
            handleAuth(session);
        });
        
        // Check current session
        window.supabase.auth.getSession().then(({ data: { session } }) => {
            handleAuth(session);
        });
        
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
    
    // Start timer for generation duration
    const startTime = new Date().getTime();
    
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
            
            // Automatically save to Supabase
            await saveToSupabase(generatedImage, selectedFiles.length > 0);
        } else {
            throw new Error('Failed to generate image. Please try again.');
        }
    } catch (error) {
        console.error('Error generating image:', error);
        resultContainer.innerHTML = `<div class="error">${error.message || 'Failed to generate image. Please try again.'}</div>`;
    } finally {
        // Calculate generation duration
        const endTime = new Date().getTime();
        lastGenerationDuration = Math.floor((endTime - startTime) / 1000);
        
        // Create time display element
        const timeDisplay = document.createElement('div');
        timeDisplay.className = 'success';
        timeDisplay.textContent = `Image generated in ${lastGenerationDuration} seconds`;
        resultContainer.insertAdjacentElement('beforebegin', timeDisplay);
        
        loading.classList.add('hidden');
    }
}

// Create image using API
async function createImage(prompt, size, quality, format, compression, transparent) {
    try {
        // Set a longer timeout for the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
        
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
                }),
                signal: controller.signal
            });
            
            // Clear the timeout
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                // Handle specific status codes
                if (response.status === 504) {
                    throw new Error('Server timeout. The image generation process is taking too long. Please try with a simpler prompt.');
                }
                
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
        } catch (fetchError) {
            // Handle abort error
            if (fetchError.name === 'AbortError') {
                throw new Error('Request timed out. The image generation process is taking too long. Please try with a simpler prompt.');
            }
            throw fetchError;
        } finally {
            clearTimeout(timeoutId);
        }
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
        
        // Set a longer timeout for the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
        
        try {
            const response = await fetch('/api/images/edit', {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });
            
            // Clear the timeout
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                // Handle specific status codes
                if (response.status === 504) {
                    throw new Error('Server timeout. The image editing process is taking too long. Please try with a smaller image or a simpler edit request.');
                }
                
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
        } catch (fetchError) {
            // Handle abort error
            if (fetchError.name === 'AbortError') {
                throw new Error('Request timed out. The image editing process is taking too long. Please try with a smaller image or a simpler edit request.');
            }
            throw fetchError;
        } finally {
            clearTimeout(timeoutId);
        }
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

// Save image to Supabase
async function saveToSupabase(image, isEdit = false) {
    if (!image) {
        console.error('No image data to save');
        return;
    }
    
    try {
        // Get user ID if user is logged in
        const userId = currentUser ? currentUser.id : null;
        
        console.log('Saving image to Supabase...', {
            prompt: image.prompt,
            format: image.format,
            isEdit: isEdit,
            dataLength: image.data ? image.data.length : 0,
            duration: lastGenerationDuration,
            userId: userId
        });
        
        // Check if Supabase is initialized
        if (!window.supabase) {
            console.error('Database connection not initialized');
            return;
        }
        
        // Save to gallery API endpoint with cache-busting
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/gallery?_=${timestamp}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': currentUser ? `Bearer ${currentUser.session?.access_token}` : ''
            },
            body: JSON.stringify({
                prompt: image.prompt,
                imageData: image.data,
                format: image.format,
                duration: lastGenerationDuration || 0,
                isEdit: isEdit === true,
                sourceType: isEdit ? 'edit' : 'text',
                user_id: userId
            })
        });
        
        if (!response.ok) {
            let errorMessage = 'Failed to save image to gallery';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
                console.error('Error saving to gallery:', errorData);
            } catch (parseError) {
                console.error('Error parsing error response:', parseError);
            }
            return;
        }
        
        const result = await response.json();
        console.log('Image saved to gallery successfully', result);
        
        // Show success message to user
        showSuccess('Image saved to gallery successfully!');
    } catch (error) {
        console.error('Error saving to gallery:', error);
    }
}
