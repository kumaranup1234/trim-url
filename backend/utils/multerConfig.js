const multer = require('multer');

// Configure multer to store files in memory
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Limit file size to 2MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true); // Accept the file
        } else {
            cb(new Error('Not an image! Please upload an image.'), false); // Reject non-image files
        }
    },
});

module.exports = upload;
