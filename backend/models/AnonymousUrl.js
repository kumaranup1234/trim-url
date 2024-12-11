const mongoose = require('mongoose');

const AnonymousUrlSchema = new mongoose.Schema({
    originalUrl: {
        type: String,
        required: true,
    },
    shortUrl: {
        type: String,
        unique: true,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const AnonymousUrl = mongoose.model('AnonymousUrl', AnonymousUrlSchema);

module.exports = AnonymousUrl;
