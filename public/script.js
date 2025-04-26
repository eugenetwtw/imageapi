// Global variables
let selectedFiles = [];
let generatedImage = null;
let generatedImages = []; // Array to store multiple generated images
let lastGenerationDuration = 0;
let isEditOperation = false;
let currentUser = null; // Current authenticated user

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
    
    // Load gallery images
    loadGallery();
});

// Initialize auth UI elements
function initializeAuthUI() {
    signInBtn = document.getElementById('signInBtn');
    signOutBtn = document.getElementById('signOutBtn');
    userInfo = document.getElementById('userInfo');
    userAvatar = document.getElementById('userAvatar');
    userName = document.getElementById('userName');
    
    // Set up event listeners
    if (signInBtn) signInBtn.addEventListener('click', signInWithGoogle);
    if (signOutBtn) signOutBtn.addEventListener('click', signOut);
}

// Sign in with Google
function signInWithGoogle() {
    if (!window.supabase) {
        showError('Supabase client not initialized');
        return;
    }
    
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
    if (!window.supabase) {
        showError('Supabase client not initialized');
        return;
    }
    
    window.supabase.auth.signOut();
}

// Handle authentication state
function handleAuth(session) {
    if (session) {
        // User is signed in
        currentUser = session.user;
        currentUser.session = session;
        
        // Update UI
        if (signInBtn) signInBtn.style.display = 'none';
        if (signOutBtn) signOutBtn.style.display = 'inline';
        if (userInfo) userInfo.style.display = 'flex';
        
        // Display user info
        if (userAvatar) userAvatar.src = session.user.user_metadata.avatar_url || '';
        if (userName) userName.textContent = session.user.user_metadata.full_name || session.user.email;
        
        console.log('User signed in:', currentUser.id);
        
        // Reload gallery to show user's images
        loadGallery();
    } else {
        // User is signed out
        currentUser = null;
        
        // Update UI
        if (signInBtn) signInBtn.style.display = 'inline';
        if (signOutBtn) signOutBtn.style.display = 'none';
        if (userInfo) userInfo.style.display = 'none';
        
        console.log('User signed out');
        
        // Reload gallery to show public images
        loadGallery();
    }
}

// Initialize Supabase client
function initializeSupabase() {
    try {
        // Load Supabase script if not already loaded
        if (typeof supabase === 'undefined') {
            console.warn('Supabase client not loaded. Adding script tag.');
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = () => {
                console.log('Supabase script loaded');
                initializeSupabaseClient();
            };
            document.head.appendChild(script);
        } else {
            initializeSupabaseClient();
        }
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
    }
}

// Initialize Supabase client
function initializeSupabaseClient() {
    try {
        // Get Supabase URL and key from environment variables
        const SUPABASE_URL = 'https://cluafbfcguzeglnliykr.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsdWFmYmZjZ3V6ZWdsbmxpeWtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMzU2OTAsImV4cCI6MjA2MDcxMTY5MH0.R7v1TtyOdJp4iY0ZeAN5CYZyN2n-GGDNvAGj8nuOOD0';
        
        if (!SUPABASE_URL || !SUPABASE_KEY) {
            console.error('Supabase configuration is missing');
            return;
        }
        
        // Initialize Supabase client
        window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        
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
        console.error('Failed to initialize Supabase client:', error);
    }
}

// Initialize UI elements and event listeners
function initializeUI() {
    // Initialize prompt buttons
    const promptButtons = document.querySelectorAll('.prompt-btn');
    promptButtons.forEach(button => {
        button.addEventListener('click', () => {
            const promptText = button.getAttribute('data-prompt');
            const promptInput = document.getElementById('prompt-input');
            
            // If the prompt input already has text, add the new prompt with a space
            if (promptInput.value.trim() !== '') {
                promptInput.value += ' ' + promptText;
            } else {
                promptInput.value = promptText;
            }
            
            // Focus the prompt input and scroll to the end
            promptInput.focus();
            promptInput.scrollTop = promptInput.scrollHeight;
        });
    });
    
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
    
    // Trigger file input on drop area click
    dropArea.addEventListener('click', () => {
        fileInput.click();
    }, false);
    
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
    
    // Save functionality is now automatic after generation, so no button is needed
    const saveBtn = document.getElementById('save-btn');
    saveBtn.style.display = 'none'; // Hide the save button
    
    // Add history button to the header
    let header = document.querySelector('header');
    if (!header) {
        // Fallback if header is not found, create a container or use body
        header = document.body;
        console.warn('Header element not found, appending history button to body.');
    }
    const historyBtn = document.createElement('button');
    historyBtn.className = 'primary-btn';
    historyBtn.style.marginTop = '1rem';
    historyBtn.style.width = 'auto';
    historyBtn.textContent = 'View History';
    historyBtn.addEventListener('click', showHistory);
    header.appendChild(historyBtn);
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
async function handleFiles(e) {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        showError('Please select valid image files.');
        return;
    }
    
    // Process files, converting HEIC to JPEG if necessary
    const processedFiles = [];
    for (const file of imageFiles) {
        if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
            try {
                showSuccess(`Converting ${file.name} to JPEG...`);
                const blob = await heic2any({
                    blob: file,
                    toType: 'image/jpeg'
                });
                const convertedFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
                    type: 'image/jpeg'
                });
                processedFiles.push(convertedFile);
                showSuccess(`${file.name} converted successfully.`);
            } catch (error) {
                console.error('Error converting HEIC file:', error);
                showError(`Failed to convert ${file.name}. Please convert manually to JPEG or PNG.`);
            }
        } else {
            processedFiles.push(file);
        }
    }
    
    // Add processed files to selectedFiles array
    selectedFiles = [...selectedFiles, ...processedFiles];
    
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
    const compression = format !== 'png' ? parseInt(document.getElementById('compression-range').value, 10) : null;
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
    
    // Set edit operation flag
    isEditOperation = selectedFiles.length > 0;
    
    // Start timer
    const startTime = new Date().getTime();
    const loadingText = document.querySelector('#loading p');
    const originalText = loadingText.textContent;
    const timerInterval = setInterval(() => {
        const elapsedTime = Math.floor((new Date().getTime() - startTime) / 1000);
        loadingText.textContent = `${originalText} (${elapsedTime}s)`;
    }, 1000);
    
    try {
        let result;
        
        // If files are selected, use image edit endpoint and process images one by one
        if (isEditOperation) {
            // Process each image individually to avoid payload too large errors and display results incrementally
            generatedImages = []; // Reset generatedImages array for multiple saves
            generatedImage = null; // Reset generatedImage for download/save of first image
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                loadingText.textContent = `Processing image ${i + 1} of ${selectedFiles.length}...`;
                result = await editImage(prompt, [file], size, quality, format, compression, transparent);
                if (result && result.data) {
                    const res = {
                        data: result.data.b64_json || result.data.url,
                        format: format,
                        prompt: prompt,
                        isUrl: !!result.data.url
                    };
                    generatedImages.push(res);
                    
                    // Display the result immediately
                    const img = document.createElement('img');
                    if (res.isUrl) {
                        img.src = res.data;
                        img.crossOrigin = "anonymous";
                        img.onload = function() {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            const dataURL = canvas.toDataURL(`image/${format}`);
                            const base64Data = dataURL.split(',')[1];
                            generatedImages[i].data = base64Data;
                            if (i === 0) {
                                generatedImage.data = base64Data;
                            }
                        };
                    } else {
                        img.src = `data:image/${format};base64,${res.data}`;
                    }
                    img.alt = prompt;
                    img.style.margin = '5px';
                    resultContainer.appendChild(img);
                    
                    // Set the first image as the one for download/save
                    if (i === 0) {
                        generatedImage = res;
                    }
                } else {
                    showError(`Failed to process image ${i + 1}. Continuing with remaining images.`);
                }
            }
            
            if (generatedImages.length > 0) {
                downloadBtn.classList.remove('hidden');
                // Automatically save to gallery after generation
                saveToGallery();
            } else {
                throw new Error('Failed to generate any images. Please try again.');
            }
        } else {
            // Otherwise use image generation endpoint
            result = await createImage(prompt, size, quality, format, compression, transparent);
            
            // Display the result
            if (result && result.data) {
                if (result.data.b64_json) {
                    generatedImage = {
                        data: result.data.b64_json,
                        format: format,
                        prompt: prompt
                    };
                    
                    const img = document.createElement('img');
                    img.src = `data:image/${format};base64,${result.data.b64_json}`;
                    img.alt = prompt;
                    
                    resultContainer.appendChild(img);
                    downloadBtn.classList.remove('hidden');
                    // Automatically save to gallery after generation
                    saveToGallery();
                } else if (result.data.url) {
                    // Handle URL response
                    const img = document.createElement('img');
                    img.src = result.data.url;
                    img.alt = prompt;
                    img.crossOrigin = "anonymous";
                    
                    // Convert image URL to base64 when loaded
                    img.onload = function() {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        const dataURL = canvas.toDataURL(`image/${format}`);
                        const base64Data = dataURL.split(',')[1];
                        
                        generatedImage = {
                            data: base64Data,
                            format: format,
                            prompt: prompt
                        };
                        
                        downloadBtn.classList.remove('hidden');
                        saveBtn.classList.remove('hidden');
                    };
                    
                    resultContainer.appendChild(img);
                } else {
                    throw new Error('Failed to generate image. Please try again.');
                }
            } else {
                throw new Error('Failed to generate image. Please try again.');
            }
        }
    } catch (error) {
        console.error('Error generating image:', error);
        resultContainer.innerHTML = `<div class="error">${error.message || 'Failed to generate image. Please try again.'}</div>`;
    } finally {
        // Stop timer and show total time
        clearInterval(timerInterval);
        const endTime = new Date().getTime();
        const totalTime = Math.floor((endTime - startTime) / 1000);
        lastGenerationDuration = totalTime;
        
        // Create time display element
        const timeDisplay = document.createElement('div');
        timeDisplay.className = 'success';
        timeDisplay.textContent = `Image generated in ${totalTime} seconds`;
        resultContainer.insertAdjacentElement('beforebegin', timeDisplay);
        
        // Hide loading spinner
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
            const error = await response.json();
            throw new Error(error.message || 'Failed to generate image');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error in createImage:', error);
        throw error;
    }
}

// Edit image using API
async function editImage(prompt, files, size, quality, format, compression, transparent) {
    try {
        const formData = new FormData();
        formData.append('prompt', prompt);
        
        if (size !== 'auto') formData.append('size', size);
        if (quality !== 'auto') formData.append('quality', quality);
        formData.append('format', format);
        // Temporarily omit compression due to type mismatch issue with FormData
        // Compression value is logged for debugging, but not sent to server
        if (compression !== null) {
            console.log('Compression value before sending (not included in request):', compression, typeof compression);
            // formData.append('compression', compression.toString()); // Commented out to avoid type error
        }
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
            const error = await response.json();
            throw new Error(error.message || 'Failed to edit image');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error in editImage:', error);
        throw error;
    }
}

// Download generated images
function downloadImage() {
    if (generatedImages.length > 0) {
        generatedImages.forEach((img, index) => {
            const link = document.createElement('a');
            link.href = `data:image/${img.format};base64,${img.data}`;
            link.download = `generated-image-${index + 1}-${Date.now()}.${img.format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    } else if (generatedImage) {
        const link = document.createElement('a');
        link.href = `data:image/${generatedImage.format};base64,${generatedImage.data}`;
        link.download = `generated-image-${Date.now()}.${generatedImage.format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Save image to gallery
async function saveToGallery() {
    if (!generatedImage && generatedImages.length === 0) return;
    
    try {
        let savedCount = 0;
        // If there are multiple images, save each one
        if (generatedImages.length > 0) {
            for (let i = 0; i < generatedImages.length; i++) {
                const img = generatedImages[i];
                const response = await fetch('/api/gallery', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': currentUser ? `Bearer ${currentUser.session?.access_token}` : ''
                    },
                    body: JSON.stringify({
                        prompt: img.prompt,
                        imageData: img.data,
                        format: img.format,
                        duration: lastGenerationDuration,
                        isEdit: isEditOperation === true,
                        sourceType: isEditOperation ? 'edit' : 'text',
                        user_id: currentUser ? currentUser.id : null
                    })
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    showError(`Failed to save image ${i + 1} to gallery. Continuing with others.`);
                } else {
                    savedCount++;
                }
            }
            if (savedCount > 0) {
                showSuccess(`${savedCount} image(s) saved to gallery successfully!`);
            } else {
                showError('Failed to save any images to gallery.');
            }
        } else {
            // Single image case
            const response = await fetch('/api/gallery', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': currentUser ? `Bearer ${currentUser.session?.access_token}` : ''
                },
                body: JSON.stringify({
                    prompt: generatedImage.prompt,
                    imageData: generatedImage.data,
                    format: generatedImage.format,
                    duration: lastGenerationDuration,
                    isEdit: isEditOperation === true,
                    sourceType: isEditOperation ? 'edit' : 'text',
                    user_id: currentUser ? currentUser.id : null
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save image to gallery');
            }
            
            showSuccess('Image saved to gallery successfully!');
            savedCount = 1;
        }
        
        // Reload gallery only once after all saves
        if (savedCount > 0) {
            loadGallery();
        }
    } catch (error) {
        console.error('Error saving to gallery:', error);
        showError('Failed to save image(s) to gallery. Please try again.');
    }
}

// Load gallery images
async function loadGallery() {
    try {
        // Add user ID to query params if user is logged in
        const userId = currentUser ? currentUser.id : null;
        const url = userId ? `/api/gallery?userId=${userId}` : '/api/gallery';
        
        const response = await fetch(url, {
            headers: {
                'Authorization': currentUser ? `Bearer ${currentUser.session?.access_token}` : ''
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to load gallery');
        }
        
        const data = await response.json();
        const images = data.data || [];
        
        const galleryContainer = document.getElementById('gallery-container');
        
        // Check if gallery container exists
        if (!galleryContainer) {
            console.error('Gallery container not found');
            return;
        }
        
        // Clear existing gallery
        galleryContainer.innerHTML = '';
        
        const emptyMessage = document.getElementById('gallery-empty-message');
        
        if (images && images.length > 0) {
            // Only update emptyMessage if it exists
            if (emptyMessage) {
                emptyMessage.style.display = 'none';
            }
            
            // Add each image to gallery
            images.forEach(item => {
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
        } else if (emptyMessage) {
            // Only update emptyMessage if it exists
            emptyMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading gallery:', error);
        const galleryContainer = document.getElementById('gallery-container');
        if (galleryContainer) {
            galleryContainer.innerHTML = `<div class="error">Failed to load gallery. Please try again.</div>`;
        } else {
            console.error('Gallery container not found for error display');
        }
    }
}

// Show history in a new tab
function showHistory() {
    window.open('/history.html', '_blank');
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
        if (!currentUser) {
            showError('You must be logged in to delete images');
            return;
        }
        
        const response = await fetch(`/api/gallery/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentUser.session?.access_token}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete image');
        }
        
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
