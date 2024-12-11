const shortid = require('shortid');
const Url = require("../models/Url");
const User = require("../models/User");
const AnonymousUrl = require("../models/AnonymousUrl");
const { generateQRCodeForUrl } = require("../utils/generateQrCode");
const { extractData } = require("../utils/extractMetaData");




async function createShortUrlAnon(req, res){
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: true, message: 'URL is required' });
    }
    const shortId = shortid.generate(); // Generate a short ID

    try {
        const existingUrl = await Url.findOne({ originalUrl: url});
        if (existingUrl) {
            return res.status(200).json({
                success: true,
                message: 'URL already shortened',
                data: {
                    originalUrl: existingUrl.originalUrl,
                    shortUrl: existingUrl.shortUrl,
                }
            });
        }

        const newUrl = new AnonymousUrl({
            originalUrl: url,
            shortUrl: shortId,
        })

        await newUrl.save();
        return res.status(200).json({
            success: true,
            message: 'URL shortened successfully',
            originalUrl: newUrl.originalUrl,
            shortUrl: newUrl.shortUrl,
        })
    } catch (error){
        console.error('Error creating shortened URL:', error);
        return res.status(500).json({
            error: true,
            message: 'Internal server error',
        });
    }
}

async function createShortUrl(req, res) {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: true, message: 'URL is required' });
    }
    const shortId = shortid.generate();

    try {
        // Check if the URL already exists for the user
        const existingUrl = await Url.findOne({ originalUrl: url, user: req.user._id });
        if (existingUrl) {
            return res.status(200).json({
                success: true,
                message: 'URL already shortened',
                data: {
                    originalUrl: existingUrl.originalUrl,
                    shortUrl: existingUrl.shortUrl,
                }
            });
        }

        const qrCode = await generateQRCodeForUrl(shortId);
        const { title, logo } = await extractData(url);

        // Create a new shortened URL entry
        const newUrl = new Url({
            originalUrl: url,
            shortUrl: shortId,
            user: req.user._id,
            qrCode: qrCode,
            title: title,
            logo: logo,
        });

        // Save the URL to the database
        await newUrl.save();

        // Update the user's URLs array with the new URL ID
        await User.findByIdAndUpdate(
            req.user._id,
            { $push: { urls: newUrl._id } },
            { new: true } // Return the updated user document
        );

        // Respond with the shortened URL
        return res.status(201).json({
            success: true,
            message: 'URL shortened successfully',
            originalUrl: newUrl.originalUrl,
            shortUrl: newUrl.shortUrl,
        });
    } catch (error) {
        console.error('Error creating shortened URL:', error);
        return res.status(500).json({
            error: true,
            message: 'Internal server error',
        });
    }
}

async function getUrlDetails(req, res) {
    const shortId = req.params.shortUrlId;

    try {
        const details = await Url.findOne({ shortUrl: shortId });

        return res.status(200).json({
            error: false,
            details
        })

    } catch (error){
        console.error('Error getting URL details:', error);
        return res.status(500).json({
            error: true,
            message: 'Internal server error',
        });
    }
}

async function UpdateUrl(req, res) {
    const shortId = req.params.shortUrlId;

    const { newUrl } = req.body;

    try {
        const updateUrl = await Url.updateOne(
            {shortUrl: shortId,},
            {$set: {originalUrl: newUrl}},
        );

        if (updateUrl.nModified === 0){
            return res.status(404).json({
                error: true,
                message: 'URL not found or no changes made',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'URL updated successfully',
        });
    } catch (error){
        console.log("Error updating the URL:", error);
        return res.status(500).json({
            error: true,
            message: 'Internal server error',
        });
    }
}


async function deleteUrl(req, res){
    const shortId = req.params.shortUrlId;
    const userId = req.user._id;

    try {
        const urlToDelete = await Url.findOne({ shortUrl: shortId });

        // Delete the URL document
        await Url.deleteOne({ shortUrl: shortId });

        // delete the url from the user url array
        await User.updateOne(
            { _id: userId },
            { $pull: { urls: urlToDelete._id } },
        )
        return res.status(200).json({
            success: true,
            message: "URL deleted successfully",
        })

    } catch (error){
        console.error('Error getting URL details:', error);
        return res.status(500).json({
            error: true,
            message: 'Internal server error',
        });
    }
}

async function getUserUrls(req, res){
    const userId = req.user._id;

    try {
        // Fetch all URLs associated with the user
        const userUrls = await Url.find({ user: userId });

        // If no URLs found
        if (!userUrls || userUrls.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'No URLs found for this user',
            });
        }
        //console.log(userUrls)
        return res.status(200).json({
            error: false,
            userUrls
        })
    } catch (error){
        console.error('Error getting URLs:', error);
        return res.status(500).json({
            error: true,
            message: 'Internal server error',
        });
    }
}

async function getClicksAnalytics(req, res) {
    const shortId = req.params.shortUrlId;

    try {

        const urlData = await Url.findOne({
            shortUrl: shortId,
        }).select('totalClicks');

        return res.status(200).json({
            error:false,
            urlData
        })

    }catch (error){
        console.error('Error getting URL total clicks details:', error);
        return res.status(500).json({
            error: true,
            message: 'Internal server error',
        });
    }

}

module.exports = {
    createShortUrlAnon,
    createShortUrl,
    getUrlDetails,
    deleteUrl,
    getUserUrls,
    getClicksAnalytics,
    UpdateUrl
};
