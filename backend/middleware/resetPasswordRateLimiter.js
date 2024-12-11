const rateLimit = require('express-rate-limit');

// Create a rate limit rule for password reset requests
const resetPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per `windowMs`
    message: 'Too many password reset requests from this IP, please try again later',
});

module.exports = resetPasswordLimiter;
