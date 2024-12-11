const mongoose = require("mongoose");

const ClickSchema = new mongoose.Schema({
    url: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Url",
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    ipAddress: {
        type: String,
    },
    userAgent: {
        type: String,
    },
    deviceType: {
        type: String, // 'mobile', 'desktop', 'tablet', etc.
    },
    browser: {
        type: String, // E.g., 'Chrome', 'Firefox'
    },
    os: {
        type: String, // Operating system, e.g., 'Windows', 'iOS'
    },
    location: {
        country: { type: String },
        city: { type: String },
        lat: { type: Number },
        lng: { type: Number },
    },
    referrer: {
        type: String,
    },
});

const Click = mongoose.model("Click", ClickSchema);

module.exports = Click;
