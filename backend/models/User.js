const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const crypto = require("crypto");

const SALT_ROUNDS = 10;

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3, // Minimum length for security
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true, // Ensures email is stored in lowercase
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Basic email validation
    },
    password: {
        type: String,
        required: true,
        minlength: 6, // Minimum password length
    },
    profileImageUrl: {
        type: String,
        default: null, // Initially no profile image
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    apiKey: {
        type: String,
        unique: true,
        default: null,
    },
    urls: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Url",
        },
    ],
    oneLinkPage: { type: mongoose.Schema.Types.ObjectId, ref: 'OneLink', default: null },
});

UserSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

UserSchema.methods.validatePassword = async function (inputPassword) {
    return bcrypt.compare(inputPassword, this.password);
};

UserSchema.methods.generatePasswordResetToken = async function() {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.forgotPasswordToken = crypto.createHash('sha256')
        .update(resetToken)
        .digest('hex');
    this.forgotPasswordExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes from now
    return resetToken;
}

const User = mongoose.model("User", UserSchema);

module.exports = User;
