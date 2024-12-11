const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateUser = async (req, res, next) => {
    try {
        // Get the token from the cookies
        const token = req.cookies.authToken;
        if (!token) {
            return res.status(401).json({
                error: true,
                message: 'Authentication required',
            });
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                error: true,
                message: 'Invalid token',
            });
        }

        // Attach user information to the request
        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication Error:', error);
        return res.status(401).json({
            error: true,
            message: 'Authentication failed',
        });
    }
};

module.exports = {
    authenticateUser
}
