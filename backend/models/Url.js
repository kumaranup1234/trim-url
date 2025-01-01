const mongoose = require("mongoose");

const UrlSchema = new mongoose.Schema({
    originalUrl: {
        type: String,
        required: true,
        trim: true,
        match: /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/,
    },
    shortUrl: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    title: {
        type: String,
        required: true,
    },
    logo: {
        type: String,
    },
    qrCode: {
        type: String,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    totalClicks: {
        type: Number,
        default: 0,
    },
    lastAccessed: {
        type: Date,
        default: null,
    },
    isOneLink: {
        type: Boolean,
        default: false
    },
});

UrlSchema.methods.incrementClick = async function () {
    this.totalClicks += 1;
    this.lastAccessed = new Date();
    await this.save();
};

const Url = mongoose.model("Url", UrlSchema);

module.exports = Url;
