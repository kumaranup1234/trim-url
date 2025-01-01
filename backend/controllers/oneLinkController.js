const Url = require("../models/Url");
const User = require("../models/User");
const OneLink = require("../models/OneLink");
const {generate} = require("shortid");
const {generateQRCodeForUrl} = require("../utils/generateQrCode");
const {extractData} = require("../utils/extractMetaData");


const createOneLink = async (req, res) => {
    const userId = req.user._id;
    const { username, profilePhoto, bio, theme, links } = req.body;

    try {
        const user = await User.findById(userId);
        if (user.oneLinkPage) {
            return res.status(400).json({ error: true, message: 'User already has a OneLink page.' });
        }

        // username check
        const existingOneLink = await OneLink.findOne({ username });
        if (existingOneLink) {
            return res.status(400).json({ error: true, message: 'Username is already taken.' });
        }

        const orderedLinks = [];
        if (links && Array.isArray(links)) {
            for (const { url, order } of links) {
                // validate
                if (!url || !/^https?:\/\/.+$/.test(url)) {
                    return res.status(400).json({ error: true, message: `Invalid URL provided: ${url}` });
                }
                    // Create a new shortened URL
                    const shortId = generate();
                    const qrCode = await generateQRCodeForUrl(shortId);
                    const { title, logo } = await extractData(url);

                    const newUrl = new Url({
                        originalUrl: url,
                        shortUrl: shortId,
                        user: userId,
                        qrCode: qrCode,
                        title: title,
                        logo: logo,
                        isOneLink: true,
                    });

                    await newUrl.save();
                    orderedLinks.push({ url: newUrl._id, order: order || 0 });
            }
        }

        // sort links by order before saving
        orderedLinks.sort((a, b) => a.order - b.order);

        const oneLink = new OneLink({
            username,
            profilePhoto,
            bio,
            theme,
            links: orderedLinks,
        });

        await oneLink.save();

        // update the user OneLink page reference
        user.oneLinkPage = oneLink._id;
        await user.save();

        return res.status(201).json({
            success: true,
            message: 'OneLink page created successfully.',
            data: oneLink,
        });
    } catch (error) {
        console.error('Error creating OneLink page:', error);
        return res.status(500).json({ error: true, message: 'Internal server error.' });
    }
};

const deleteOneLink = async (req, res) => {
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);
        if (!user.oneLinkPage) {
            return res.status(400).json({ error: true, message: 'No OneLink page to delete.' });
        }

        const oneLinkID = user.oneLinkPage;

        user.oneLinkPage = null;
        await user.save();

        await OneLink.findByIdAndDelete(oneLinkID);

        return res.status(200).json({
            success: true,
            message: 'OneLink page deleted successfully.',
        });
    } catch (error) {
        console.error('Error deleting OneLink page:', error);
        return res.status(500).json({ error: true, message: 'Internal server error.' });
    }
};

const updateOneLink = async (req, res) => {
    const userId = req.user._id;
    const { username, bio, theme, profilePhoto, links } = req.body;

    try {

        const user = await User.findById(userId).populate('oneLinkPage');
        if (!user || !user.oneLinkPage) {
            return res.status(400).json({ error: true, message: 'No OneLink page found to update.' });
        }
        const oneLink = await OneLink.findById(user.oneLinkPage);

        if (username) {
            const existingUsername = await OneLink.findOne({ username });
            if (existingUsername && existingUsername._id.toString() !== oneLink._id.toString()) {
                return res.status(400).json({ error: true, message: 'Username is already taken.' });
            }
            oneLink.username = username;
        }

        if (bio) oneLink.bio = bio;
        if (theme) oneLink.theme = theme;
        if (profilePhoto) oneLink.profilePhoto = profilePhoto;

        if (links)
            for (const link of links) {
                if (link.action === 'add'){
                    const { url, order } = link;
                    if (!url || !/^https?:\/\/.+$/.test(url)) {
                        return res.status(400).json({ error: true, message: `Invalid URL provided: ${url}` });
                    }

                    if (order < 0 || order > oneLink.links.length) {
                        return res.status(400).json({ error: true, message: `Invalid order: ${order}` });
                    }

                    const shortId = generate();
                    const qrCode = await generateQRCodeForUrl(shortId);
                    const { title, logo } = await extractData(url);

                    const newUrl = new Url({
                        originalUrl: url,
                        shortUrl: shortId,
                        user: userId,
                        qrCode: qrCode,
                        title: title,
                        logo: logo,
                        isOneLink: true,
                    });

                    await newUrl.save();
                    oneLink.links.splice(order, 0, newUrl.id);
                }else if (link.action === 'update') {
                    // Update an existing link
                    const { id, url } = link;
                    const existingLink = await Url.findById(id);
                    if (existingLink) {
                        existingLink.originalUrl = url;
                        await existingLink.save();
                    }
                } else if (link.action === 'delete') {
                    // Remove a link
                    const { id } = link;
                    oneLink.links = oneLink.links.filter(linkId => linkId.toString() !== id);
                }
            }


        await oneLink.save();

        return res.status(200).json({
            success: true,
            message: 'OneLink page updated successfully.',
            data: oneLink,
        });

    } catch (error) {
        console.error('Error updating OneLink page:', error);
        return res.status(500).json({ error: true, message: 'Internal server error.' });
    }
}

const getOneLink = async (req, res) => {
    const { username } = req.params;

    try {
        const oneLink = await OneLink.findOne({ username }).populate('links');
        if (!oneLink) {
            return res.status(404).json({ error: true, message: 'OneLink page not found.' });
        }

        return res.status(200).json({ success: true, data: oneLink });
    } catch (error) {
        console.error('Error fetching OneLink page:', error);
        return res.status(500).json({ error: true, message: 'Internal server error.' });
    }
};

const trackPageView = async (req, res) => {
    const { username } = req.params;

    try {
        const oneLink = await OneLink.findOneAndUpdate(
            { username },
            { $inc: { pageViews: 1 } },
            { new: true }
        );

        if (!oneLink) {
            return res.status(404).json({ error: true, message: 'OneLink page not found.' });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error tracking page view:', error);
        return res.status(500).json({ error: true, message: 'Internal server error.' });
    }
};


const checkUserName = async (req, res) => {
    const { username } = req.body;

    try {
        const check = await OneLink.findOne({ username});
        if (check) {
            return res.status(400).json({ error: true, message: 'Username is already taken.' });
        }

        return res.status(200).json({ success: true, message: 'Username is available' });

    } catch (error){
        console.error('Error tracking page view:', error);
        return res.status(500).json({ error: true, message: 'Internal server error.' });
    }
}

module.exports = {
    getOneLink,
    trackPageView,
    updateOneLink,
    createOneLink,
    deleteOneLink,
    checkUserName
}


