function getDeviceType(userAgent) {
    if (/mobile/i.test(userAgent)) {
        return 'Mobile';
    } else if (/tablet/i.test(userAgent)) {
        return 'Tablet';
    } else {
        return 'Desktop';
    }
}

module.exports = {
    getDeviceType,
};
