const express = require('express');
const router = express.Router();
const {
    createOneLink,
    deleteOneLink,
    updateOneLink,
    getOneLink,
    trackPageView,
    checkUserName
} = require('../controllers/oneLinkController');

const { authenticateUser } = require('../middleware/authenticate');

// create a new OneLink page
router.post('/create', authenticateUser, createOneLink);

// delete an existing OneLink page
router.delete('/delete', authenticateUser, deleteOneLink);

// update the user OneLink page
router.put('/update', authenticateUser, updateOneLink);

// fetch a OneLink page by username
router.get('/:username', getOneLink);

// track page views (increments the page view counter)
router.post('/:username/views', trackPageView);

// check for username
router.post('/check', authenticateUser, checkUserName);

module.exports = router;
