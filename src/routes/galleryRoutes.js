const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');

/**
 * @route GET /api/gallery
 * @desc Get all images from the gallery
 * @access Public
 */
router.get('/', galleryController.getAllImages);

/**
 * @route POST /api/gallery
 * @desc Save an image to the gallery
 * @access Public
 */
router.post('/', galleryController.saveImage);

/**
 * @route GET /api/gallery/:id
 * @desc Get a specific image by ID
 * @access Public
 */
router.get('/:id', galleryController.getImageById);

/**
 * @route DELETE /api/gallery/:id
 * @desc Delete an image from the gallery
 * @access Public
 */
router.delete('/:id', galleryController.deleteImage);

module.exports = router;
