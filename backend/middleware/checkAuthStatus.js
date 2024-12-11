const {verifyToken} = require("../utils/verifyToken");
const checkAuthStatus = (req, res, next) => {
    const token = req.cookies.authToken;
    console.log(token);
    if (token) {
        const user = verifyToken(token);
        console.log(user);
        if (user) {
            req.user = user;
        } else {
            console.log("Invalid token");
        }
    }
    next();
};

module.exports = {
    checkAuthStatus,
}
