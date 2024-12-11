const express = require('express');
const router = express.Router();
const {
    getAllClicks,
    getClicksByDevice,
    getClicksByBrowser,
    getClicksByLocation,
    getClicksByReferrer,
    getClicksByOs,
    getUserClicks,
    getUserDeviceClicks,
    getUserClicksByOs,
    getUserClicksByReferrer,
    getUserClicksByLocation,
    getClicksByCountry,
    getUserClicksByBrowser,
    getUserClicksByCountry
} = require('../controllers/clickController');
const { authenticateUser } = require('../middleware/authenticate');

 // To avoid this issue, always place more specific routes
 // (like /clicks/getUsersClicks) before the dynamic ones (like /clicks/:shortUrlId).

// Get all Clicks for user a span of 10 days along with the total overall clicks
router.get('/clicks/getUsersClicks', authenticateUser, getUserClicks);

// Get all Clicks for a user by device type
router.get('/clicks/getUserDeviceClicks', authenticateUser, getUserDeviceClicks);

// Get all clicks for a user by browser
router.get('/clicks/getUserClicksByBrowser', authenticateUser, getUserClicksByBrowser);

// Get all clicks for a user by locations
router.get('/clicks/getUserClicksByLocations', authenticateUser, getUserClicksByLocation);

// Get all clicks for a user by browser
router.get('/clicks/getUserClicksByReferrer', authenticateUser, getUserClicksByReferrer);

// Get all clicks for a user by Os
router.get('/clicks/getUserClicksByOs', authenticateUser, getUserClicksByOs);

// Get Clicks by Country for maps for all urls
router.get('/clicks/country', authenticateUser, getUserClicksByCountry);

// Get All Clicks for a URL for a span of 10 days
router.get('/clicks/:shortUrlId', authenticateUser, getAllClicks);

// Get Clicks by Device Type
router.get('/clicks/devices/:shortUrlId', authenticateUser, getClicksByDevice);

// Get Clicks by Browser
router.get('/clicks/browsers/:shortUrlId', authenticateUser, getClicksByBrowser);

// Get Clicks by Location
router.get('/clicks/locations/:shortUrlId', authenticateUser, getClicksByLocation);

// Get Clicks by Country for maps
router.get('/clicks/country/:shortUrlId', authenticateUser, getClicksByCountry);

// Get Clicks by Referrer
router.get('/clicks/referrers/:shortUrlId', authenticateUser, getClicksByReferrer);

// Get Clicks by OS
router.get('/clicks/os/:shortUrlId', authenticateUser, getClicksByOs);
module.exports = router;
