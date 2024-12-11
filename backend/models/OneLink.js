import mongoose from "mongoose";

const OneLinkSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    profilePhoto: { type: String },
    bio: { type: String },
    theme: { type: String, default: 'default-theme' },
    links: [
        {
            title: { type: String, required: true },
            shortUrl: { type: String, required: true },
            destinationUrl: { type: String, required: true },
            icon: { type: String },
            order: { type: Number }
        }
    ],
    pageViews: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

OneLinkSchema.index({ username: 1 });

const OneLink = mongoose.model('OneLink', OneLinkSchema);

module.exports = OneLink;
