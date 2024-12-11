const mongoose = require("mongoose");

const ApiKeySchema = new mongoose.Schema({
    key: {
        type: String,
        unique: true,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    usageCount: {
        type: Number,
        default: 0,
    },
    lastUsed: {
        type: Date,
        default: null,
    },
});

ApiKeySchema.methods.incrementUsage = async function () {
    this.usageCount += 1;
    this.lastUsed = new Date();
    await this.save();
};

const ApiKey = mongoose.model("ApiKey", ApiKeySchema);

module.exports = ApiKey;
