const mongoose = require("mongoose");

const OneLinkSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    profilePhoto: { type: String },
    bio: { type: String },
    theme: { type: String, default: 'default-theme' },
    links: [
        {
            urlId: { type: mongoose.Schema.Types.ObjectId, ref: 'Url' },
            order: { type: Number, required: true },
        },
    ],
    pageViews: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const OneLink = mongoose.model('OneLink', OneLinkSchema);

module.exports = OneLink;
