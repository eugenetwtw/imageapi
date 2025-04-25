const express = require('express');
const router = express.Router();
const multer = require('multer');
const imageController = require('../controllers/imageController');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 5 // Max 5 files at once
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

/**
 * @route POST /api/images/generate
 * @desc Generate an image from a text prompt
 * @access Public
 */
router.post('/generate', imageController.generateImage);

/**
 * @route POST /api/images/edit
 * @desc Edit images using AI
 * @access Public
 */
router.post('/edit', upload.array('images', 5), imageController.editImage);

module.exports = router;
