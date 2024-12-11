const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET

const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
};

module.exports = {
    verifyToken
}
