// Function to get the client IP address
function getClientIp(req) {
    // Check the X-Forwarded-For header for IP address if behind a proxy
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
        // The forwarded-for header might be a comma-separated list of IPs
        return forwardedFor.split(',')[0].trim();
    }

    // Fallback to direct connection IP address
    return req.socket.remoteAddress || req.connection.remoteAddress;
}

module.exports = {
    getClientIp
}