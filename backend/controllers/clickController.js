const Url = require("../models/Url");
const Click = require("../models/Click");
const { getName } = require('country-list');
const User = require("../models/User");

async function getAllClicks(req, res) {
    const shortUrlId = req.params.shortUrlId;
    console.log("getAllClicks")

    try {
        // Find the URL document to get the ObjectId
        const urlDoc = await Url.findOne({ shortUrl: shortUrlId }).select('_id totalClicks');

        if (!urlDoc) {
            return res.status(404).json({
                error: true,
                message: 'URL not found',
            });
        }

        const totalClicks = urlDoc.totalClicks;
        let maxClick = 0;
        let maxClicksDate = 0;

        // Get today's date and calculate the date 10 days ago
        const today = new Date();
        const tenDaysAgo = new Date(today);
        tenDaysAgo.setDate(today.getDate() - 9);

        // Aggregate clicks for the past 7 days
        const clicks = await Click.aggregate([
            {
                $match: {
                    url: urlDoc._id,
                    timestamp: { $gte: tenDaysAgo }
                }
            },
            {
                $project: {
                    date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }
                }
            },
            {
                $group: {
                    _id: "$date",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Prepare data for the last 7 days
        const dateCounts = {};
        for (let i = 9; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            dateCounts[dateString] = 0; // Default count is 0
        }

        // Fill the counts from the aggregation result
        clicks.forEach(click => {
            dateCounts[click._id] = click.count;
        });

        // Create an array of objects with dates and counts for the frontend
        const clicksByDate = Object.keys(dateCounts).map((date) => {
            const totalClicks = dateCounts[date];
            if (totalClicks > maxClick){
                maxClick = totalClicks;
                maxClicksDate = date;
            }

            return{
                date,
                count: totalClicks
            }
        });

        return res.status(200).json({
            error: false,
            totalClicks,
            maxClick,
            maxClicksDate,
            clicksByDate
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: true,
            message: 'Internal server error',
        });
    }
}

// get All clicks for a user in a span of 10 days
async function getUserClicks (req, res) {
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: true,
                message: 'User not found',
            })
        }
        const urlArray = user.urls;

        const totalClicks = await Click.countDocuments({ url: { $in: urlArray } });
        let maxClick = 0;
        let maxClicksDate = 0;

        // Get today's date and calculate the date 10 days ago
        const today = new Date();
        const tenDaysAgo = new Date(today);
        tenDaysAgo.setDate(today.getDate() - 9);

        // Aggregate clicks for the past 7 days
        const clicks = await Click.aggregate([
            {
                $match: {
                    timestamp: { $gte: tenDaysAgo },
                    url: { $in: urlArray },
                }
            },
            {
                $project: {
                    date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }
                }
            },
            {
                $group: {
                    _id: "$date",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Prepare data for the last 7 days
        const dateCounts = {};
        for (let i = 9; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            dateCounts[dateString] = 0; // Default count is 0
        }

        // Fill the counts from the aggregation result
        clicks.forEach(click => {
            dateCounts[click._id] = click.count;
        });

        // Create an array of objects with dates and counts for the frontend
        const clicksByDate = Object.keys(dateCounts).map((date) => {
            const totalClicks = dateCounts[date];
            if (totalClicks > maxClick){
                maxClick = totalClicks;
                maxClicksDate = date;
            }

            return{
                date,
                count: totalClicks
            }
        });

        return res.status(200).json({
            error: false,
            totalClicks,
            maxClick,
            maxClicksDate,
            clicksByDate
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: true,
            message: 'Internal server error',
        });
    }
}

async function getClicksByDevice(req, res) {
    const shortUrlId = req.params.shortUrlId;

    try {
        const urlDoc = await Url.findOne({ shortUrl: shortUrlId }).select('_id');
        if (!urlDoc) {
            return res.status(404).json({
                error: true,
                message: 'URL not found',
            });
        }

        const objectId = urlDoc._id;
        const clicks = await Click.find({ url: objectId });

        // Count the occurrences of each deviceType
        const deviceTypeCounts = clicks.reduce((acc, click) => {
            const deviceType = click.deviceType || 'Unknown'; // Default to 'Unknown' if deviceType is missing
            acc[deviceType] = (acc[deviceType] || 0) + 1;
            return acc;
        }, {});

        return res.status(200).json({
            error: false,
            deviceTypeCounts
        });
    } catch (error) {
        console.log("Error fetching the clicks:", error);
        return res.status(500).json({
            error: true,
            message: 'Internal server error',
        });
    }
}

async function getUserDeviceClicks(req, res) {
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: true,
                message: 'User not found',
            });
        }

        const urlArray = user.urls;

        // Check if user has any URLs
        if (urlArray.length === 0) {
            return res.status(200).json({
                error: false,
                deviceTypeCounts: {}, // No URLs, so return empty result
            });
        }

        const clicks = await Click.find({ url: { $in: urlArray } });

        // Count the occurrences of each deviceType
        const deviceTypeCounts = clicks.reduce((acc, click) => {
            const deviceType = click.deviceType || 'Unknown';
            acc[deviceType] = (acc[deviceType] || 0) + 1;
            return acc;
        }, {});

        return res.status(200).json({
            error: false,
            deviceTypeCounts
        });
    } catch (error) {
        console.log("Error fetching the clicks:", error);
        return res.status(500).json({
            error: true,
            message: 'Internal server error',
            details: error.message
        });
    }
}


async function getClicksByBrowser(req, res){
    const shortUrlId = req.params.shortUrlId;

    try {
        // Find the URL document to get the ObjectId
        const urlDoc = await Url.findOne({ shortUrl: shortUrlId }).select('_id');

        if (!urlDoc) {
            return res.status(404).json({
                error: true,
                message: 'URL not found',
            });
        }

        const objectId = urlDoc._id;
        const clicks = await Click.find({ url: objectId });


        // Count the occurrences of each deviceType
        const browserTypeCounts = clicks.reduce((acc, click) => {
            const deviceType = click.browser || 'Unknown'; // Default to 'Unknown' if browser is missing
            acc[deviceType] = (acc[deviceType] || 0) + 1;
            return acc;
        }, {});

        return res.status(200).json({
            error: false,
            browserTypeCounts
        });
    } catch (error) {
        console.log("Error fetching the clicks:", error);
        return res.status(500).json({
            error: true,
            message: 'Internal server error',
        });
    }
}

// Get clicks by browser For all urls


async function getUserClicksByBrowser(req, res){
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: true,
                message: 'User not found',
            });
        }

        const urlArray = user.urls;
        // Check if user has any URLs
        if (urlArray.length === 0) {
            return res.status(200).json({
                error: false,
                browserTypeCounts: {}, // No URLs, so return empty result
            });
        }

        const clicks = await Click.find({ url: { $in: urlArray }});


        // Count the occurrences of each deviceType
        const browserTypeCounts = clicks.reduce((acc, click) => {
            const deviceType = click.browser || 'Unknown'; // Default to 'Unknown' if browser is missing
            acc[deviceType] = (acc[deviceType] || 0) + 1;
            return acc;
        }, {});

        return res.status(200).json({
            error: false,
            browserTypeCounts
        });
    } catch (error) {
        console.log("Error fetching the clicks:", error);
        return res.status(500).json({
            error: true,
            message: 'Internal server error',
        });
    }
}


async function getClicksByLocation(req, res) {
    const shortUrlId = req.params.shortUrlId;

    try {
        // Find the URL document to get the ObjectId
        const urlDoc = await Url.findOne({ shortUrl: shortUrlId }).select('_id');

        if (!urlDoc) {
            return res.status(404).json({
                error: true,
                message: 'URL not found',
            });
        }

        const objectId = urlDoc._id;
        const clicks = await Click.find({ url: objectId });

        // Aggregate the locations by country and city
        const locationCounts = clicks.reduce((acc, click) => {
            const country = getName(click.location?.country) || 'Unknown Country';
            const city = click.location?.city || 'Unknown City';

            const locationKey = `${country}, ${city}`;

            if (!acc[locationKey]) {
                acc[locationKey] = 0;
            }

            acc[locationKey]++;
            return acc;
        }, {});

        // Check if any clicks are found
        if (Object.keys(locationCounts).length === 0) {
            return res.status(404).json({
                error: true,
                message: 'No clicks found for the given URL',
            });
        }

        return res.status(200).json({
            error: false,
            locationCounts
        });
    } catch (error) {
        console.log("Error fetching the clicks:", error);
        return res.status(500).json({
            error: true,
            message: 'Internal server error',
        });
    }
}

// Get country clicks for map
async function getClicksByCountry (req, res){
    const shortUrlId = req.params.shortUrlId;

    try {
        // Find the URL document to get the ObjectId
        const urlDoc = await Url.findOne({ shortUrl: shortUrlId }).select('_id');

        if (!urlDoc) {
            return res.status(404).json({
                error: true,
                message: 'URL not found',
            });
        }

        const objectId = urlDoc._id;
        const clicks = await Click.find({ url: objectId });

        // Aggregate the locations by country and city
        const countryCounts = clicks.reduce((acc, click) => {
            const country = click.location?.country || 'Unknown Country';

            const locationKey = `${country}`;

            if (!acc[locationKey]) {
                acc[locationKey] = 0;
            }

            acc[locationKey]++;
            return acc;
        }, {});

        // Check if any clicks are found
        if (Object.keys(countryCounts).length === 0) {
            return res.status(404).json({
                message: 'No clicks found for the given URL',
            });
        }

        return res.status(200).json({
            error: false,
            countryCounts
        });
    } catch (error) {
        console.log("Error fetching the clicks:", error);
        return res.status(500).json({
            error: true,
            message: 'Internal server error',
        });
    }
}

// Get all users clicks for country for map

async function getUserClicksByCountry (req, res) {

    const userId = req.user._id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: true,
                message: 'User not found',
            });
        }

        const urlArray = user.urls;

        // Check if user has any URLs
        if (urlArray.length === 0) {
            return res.status(200).json({
                error: false,
                countryCounts: {}, // No URLs, so return empty result
            });
        }

        const clicks = await Click.find({ url: { $in: urlArray }});

        // Aggregate the locations by country
        const countryCounts = clicks.reduce((acc, click) => {
            const country = click.location?.country || 'Unknown Country';

            const locationKey = `${country}`;

            if (!acc[locationKey]) {
                acc[locationKey] = 0;
            }

            acc[locationKey]++;
            return acc;
        }, {});

        // Check if any clicks are found
        if (Object.keys(countryCounts).length === 0) {
            return res.status(404).json({
                error: true,
                message: 'No clicks found for the given URL',
            });
        }

        return res.status(200).json({
            error: false,
            countryCounts
        });

    } catch (error) {
        console.log("Error fetching the clicks:", error);
        return res.status(500).json({
            error: true,
            message: 'Internal server error',
        });
    }
}


// Get all clicks by location for a user
async function getUserClicksByLocation(req, res) {
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: true,
                message: 'User not found',
            });
        }

        const urlArray = user.urls;
        // Check if user has any URLs
        if (urlArray.length === 0) {
            return res.status(200).json({
                error: false,
                locationCounts: {}, // No URLs, so return empty result
            });
        }

        const clicks = await Click.find({ url: {$in : urlArray }});

        // Aggregate the locations by country and city
        const locationCounts = clicks.reduce((acc, click) => {
            const country = getName(click.location?.country) || 'Unknown Country';
            const city = click.location?.city || 'Unknown City';

            const locationKey = `${country}, ${city}`;

            if (!acc[locationKey]) {
                acc[locationKey] = 0;
            }

            acc[locationKey]++;
            return acc;
        }, {});

        // Check if any clicks are found
        if (Object.keys(locationCounts).length === 0) {
            return res.status(404).json({
                error: true,
                message: 'No clicks found for the given URL',
            });
        }

        return res.status(200).json({
            error: false,
            locationCounts
        });
    } catch (error) {
        console.log("Error fetching the clicks:", error);
        return res.status(500).json({
            error: true,
            message: 'Internal server error',
        });
    }
}




async function getClicksByReferrer(req, res){
    const shortUrlId = req.params.shortUrlId;

    try {
        // Find the URL document to get the ObjectId
        const urlDoc = await Url.findOne({ shortUrl: shortUrlId }).select('_id');

        if (!urlDoc) {
            return res.status(404).json({
                error: true,
                message: 'URL not found',
            });
        }

        const objectId = urlDoc._id;
        const clicks = await Click.find({ url: objectId });

        // Count the occurrences of each deviceType
        const referrerCounts = clicks.reduce((acc, click) => {
            const deviceType = click.referrer || 'Unknown'; // Default to 'Unknown' if browser is missing
            acc[deviceType] = (acc[deviceType] || 0) + 1;
            return acc;
        }, {});

        // console.log("Retrieved clicks:", referrerCounts);

        return res.status(200).json({
            error: false,
            referrerCounts
        });
    } catch (error) {
        console.log("Error fetching the clicks:", error);
        return res.status(500).json({
            error: true,
            message: 'Internal server error',
        });
    }
}

// Get all clicks by referrer for a user
async function getUserClicksByReferrer(req, res){
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: true,
                message: 'User not found',
            });
        }

        const urlArray = user.urls;
        // Check if user has any URLs
        if (urlArray.length === 0) {
            return res.status(200).json({
                error: false,
                referrerCounts: {}, // No URLs, so return empty result
            });
        }

        const clicks = await Click.find({ url: {$in : urlArray }});

        // Count the occurrences of each deviceType
        const referrerCounts = clicks.reduce((acc, click) => {
            const deviceType = click.referrer || 'Unknown'; // Default to 'Unknown' if browser is missing
            acc[deviceType] = (acc[deviceType] || 0) + 1;
            return acc;
        }, {});

        // console.log("Retrieved clicks:", referrerCounts);

        return res.status(200).json({
            error: false,
            referrerCounts
        });
    } catch (error) {
        console.log("Error fetching the clicks:", error);
        return res.status(500).json({
            error: true,
            message: 'Internal server error',
        });
    }
}

async function getClicksByOs(req, res) {
    const shortUrlId = req.params.shortUrlId;

    try {
        // Find the URL document to get the ObjectId
        const urlDoc = await Url.findOne({ shortUrl: shortUrlId }).select('_id');

        if (!urlDoc) {
            return res.status(404).json({
                error: true,
                message: 'URL not found',
            });
        }

        const objectId = urlDoc._id;
        const clicks = await Click.find({ url: objectId });

        // Count the occurrences of each deviceType
        const osCounts = clicks.reduce((acc, click) => {
            const osType = click.os || 'Unknown'; // Default to 'Unknown' if os is missing
            acc[osType] = (acc[osType] || 0) + 1;
            return acc;
        }, {});

        // console.log("Retrieved clicks:", osCounts);

        return res.status(200).json({
            error: false,
            osCounts
        });
    } catch (error) {
        console.log("Error fetching the clicks:", error);
        return res.status(500).json({
            error: true,
            message: 'Internal server error',
        });
    }
}

// Get all clicks by os for a user

async function getUserClicksByOs(req, res) {
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: true,
                message: 'User not found',
            });
        }

        const urlArray = user.urls;
        // Check if user has any URLs
        if (urlArray.length === 0) {
            return res.status(200).json({
                error: false,
                osCounts: {}, // No URLs, so return empty result
            });
        }

        const clicks = await Click.find({ url: {$in : urlArray }});

        // Count the occurrences of each deviceType
        const osCounts = clicks.reduce((acc, click) => {
            const osType = click.os || 'Unknown'; // Default to 'Unknown' if os is missing
            acc[osType] = (acc[osType] || 0) + 1;
            return acc;
        }, {});

        return res.status(200).json({
            error: false,
            osCounts
        });
    } catch (error) {
        console.log("Error fetching the clicks:", error);
        return res.status(500).json({
            error: true,
            message: 'Internal server error',
        });
    }
}






module.exports = {
    getAllClicks,
    getClicksByDevice,
    getClicksByBrowser,
    getClicksByLocation,
    getClicksByReferrer,
    getClicksByOs,
    getUserClicks,
    getUserDeviceClicks,
    getUserClicksByOs,
    getUserClicksByReferrer,
    getUserClicksByLocation,
    getUserClicksByBrowser,
    getClicksByCountry,
    getUserClicksByCountry
}