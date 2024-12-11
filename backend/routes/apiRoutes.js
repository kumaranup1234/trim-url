const express = require('express');
const router = express.Router();
const {
    createShortUrl,
    getShortUrlDetails,
    getAnalytics,
    deleteShortUrl,
    updateShortUrl,
} = require('../controllers/apiController');
const { authenticateApiKey } = require('../middleware/authenticate');

// Create Short URL
//router.post('/shorten', authenticateApiKey, createShortUrl);

// Get Short URL Details
//router.get('/details/:shortUrlId', authenticateApiKey, getShortUrlDetails);

// Get Clicks Analytics for a URL
//router.get('/analytics/:shortUrlId', authenticateApiKey, getAnalytics);

// Update a Short URL
//router.put('/update/:shortUrlId', authenticateApiKey, updateShortUrl);

// Delete Short URL
//router.delete('/delete/:shortUrlId', authenticateApiKey, deleteShortUrl);

module.exports = router;
