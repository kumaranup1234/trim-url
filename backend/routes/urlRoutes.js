const express = require('express');
const router = express.Router();
const {
    createShortUrl,
    getUrlDetails,
    deleteUrl,
    getUserUrls,
    getClicksAnalytics,
    UpdateUrl,
    createShortUrlAnon
} = require('../controllers/urlController');
const { authenticateUser } = require('../middleware/authenticate');

// Create Short URL ANon
router.post('/anon/shorten', createShortUrlAnon);

// Create Short URL
router.post('/shorten', authenticateUser, createShortUrl);

// Get URL Details
router.get('/details/:shortUrlId', authenticateUser, getUrlDetails);

// Update URL
router.post('/update/:shortUrlId', authenticateUser, UpdateUrl);

// Delete URL
router.delete('/delete/:shortUrlId', authenticateUser, deleteUrl);

// Get User's URLs
router.get('/user-urls', authenticateUser, getUserUrls);

// Get Total Clicks for a URL
router.get('/total-clicks/:shortUrlId', authenticateUser, getClicksAnalytics);

module.exports = router;
