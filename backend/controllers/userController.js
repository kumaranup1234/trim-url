const User = require('../models/User');
const ApiKey = require('../models/ApiKey');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Url = require('../models/Url');
const { v4: UUIDv4} = require("uuid")
const cloudinary = require('../config/cloudinaryConfig');
const upload = require('../utils/multerConfig');
const {sendEmail} = require("../utils/sendEmail");

// Do I need a new array? → Likely map or filter.
// Do I need just one element? → Likely find.
// Do I need one value (sum, max, etc.)? → Likely reduce.

// Signup Handler
async function handleSignup(req, res) {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username) {
        return res.status(400).json({
            error: true,
            message: 'Username is required',
        });
    }
    if (!email) {
        return res.status(400).json({
            error: true,
            message: 'Email is required',
        });
    }
    if (!password) {
        return res.status(400).json({
            error: true,
            message: 'Password is required',
        });
    }

    try {
        // Check if user already exists
        const isUser = await User.findOne({ email });
        if (isUser) {
            return res.status(400).json({
                error: true,
                message: 'User already exists',
            });
        }


        // Generate a new API key
        const apiKey = UUIDv4();
        // Create new user
        const newUser = new User({
            username,
            email,
            password,
            apiKey: apiKey,
        });

        await newUser.save();
        // Create a new API key document
        const newApiKey = new ApiKey({
            user: newUser.id,
            key: apiKey,
            expiresAt: new Date(Date.now() + 360 * 24 * 60 * 60 * 1000), // 360 days from now
        });

        // Save the new API key document
        await newApiKey.save();
        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '12h' });

        // Set the token as a cookie
        res.cookie('authToken', token, {
            httpOnly: true,   // Prevents JavaScript access on the client side
            secure: process.env.NODE_ENV === 'production', // Ensure cookie is sent over HTTPS only in production
            maxAge: 30 * 24 * 60 * 60 * 1000,  // 30 days expiration time
            sameSite: 'none' // 'none' for cross-domain, 'strict' for same-site
            // strict for localHost
        });

        return res.status(201).json({
            success: true,
            user: {
                username,
                email
            },
            message: 'User created successfully',
        });
    } catch (error) {
        console.error('Signup Error:', error);
        return res.status(500).json({
            error: true,
            message: 'Server error during signup',
        });
    }
}

// Login Handler
async function handleLogin(req, res) {
    const { email, password } = req.body;

    // Validate required fields
    if (!email) {
        return res.status(400).json({
            error: true,
            message: 'Email is required',
        });
    }
    if (!password) {
        return res.status(400).json({
            error: true,
            message: 'Password is required',
        });
    }

    try {
        // Find user by email
        const user = await User.findOne({ email });
        console.log('User found:', user);
        if (!user) {
            return res.status(401).json({
                error: true,
                message: 'Invalid credentials',
            });
        }

        // Validate password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                error: true,
                message: 'Invalid credentials',
            });
        }

        // Generate JWT token
        console.log(process.env.JWT_SECRET)
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '12h' });

        // Set the token as a cookie
        res.cookie('authToken', token, {
            httpOnly: true,   // Prevents JavaScript access on the client side
            secure: process.env.NODE_ENV === 'production', // Ensure cookie is sent over HTTPS only in production
            maxAge: 30 * 24 * 60 * 60 * 1000,  // 30 days expiration time
            sameSite: 'none' // 'none' for cross-domain, 'strict' for same-site
            // strict for localHost
        });

        return res.json({
            success: true,
            user: {
                username: user.username,
                email: user.email,
                profileImage: user.profileImageUrl
            },
            message: 'Login successful',
        });
    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({
            error: true,
            message: 'Server error during login',
        });
    }
}

// Update Profile Image
async function updateProfileImage(req, res) {
    const userId = req.user._id;

    upload.single('profileImage')(req, res, async (err) => {
        if (err) {
            //console.log('Multer error:', err);
            return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
            //console.log('No file received in the request.');
            return res.status(400).json({ error: 'No image file provided.' });
        }

        try {
            // Log the incoming file details
            //console.log('File received:', req.file.originalname);

            const uploadImage = () => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        {
                            folder: 'profile-images',
                            public_id: `${Date.now()}_${req.file.originalname}`,
                        },
                        (error, result) => {
                            if (error) {
                                //console.log('Cloudinary upload error:', error);
                                reject(error);
                            } else {
                                //console.log('Cloudinary upload result:', result);
                                resolve(result);
                            }
                        }
                    );
                    stream.end(req.file.buffer);
                });
            };

            const result = await uploadImage();

            // Log the Cloudinary URL
            //console.log('Cloudinary URL:', result.secure_url);

            const user = await User.findById(userId);
            if (!user) {
                //console.log('User not found:', userId);
                return res.status(404).json({ error: 'User not found.' });
            }

            // Log if user exists and before updating
            //console.log('User found, updating profileImageUrl');

            user.profileImageUrl = result.secure_url;
            await user.save();

            //console.log('Profile image updated successfully for user:', userId);

            return res.json({
                success: true,
                message: 'Profile image updated successfully!',
                imageUrl: result.secure_url,
            });

        } catch (error) {
            //console.error('Error in updateProfileImage:', error);
            return res.status(500).json({ error: 'Server error while uploading profile image.' });
        }
    });
}



async function handleLogout(req, res) {
    // Clear the authToken cookie
    res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
    });

    res.status(200).json({ success: true, message: 'Logged out successfully' });
}

async function handleStatus(req, res) {
    if (req.user) {
        try {
            const isUser = await User.findById(req.user.userId);
            if (!isUser) {
                return res.status(404).json({ isLoggedIn: false, user: null });
            }

            const user = {
                username: isUser.username,
                email: isUser.email,
                profileImage: isUser.profileImageUrl || null,
            };

            return res.status(200).json({ isLoggedIn: true, user: user });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    } else {
        return res.status(200).json({ isLoggedIn: false, user: null });
    }
}

async function getUserProfile(req, res){
    try {
        const userId = req.user._id;
        //console.log(userId);

        const user = await User.findById(userId).populate({
            path: 'urls',
            select: 'originalUrl shortUrl totalClicks createdAt',
        });

        //console.log(user);

        if (!user){
            return res.status(404).json({ error: true, message: 'User not found' });
        }

        return res.status(200).json({
            error: false,
            data: {
                username: user.username,
                email: user.email,
                createdAt: user.createdAt,
                apiKey: user.apiKey,
                urls: user.urls
            }
        })
    } catch (error){
        console.log(error);
        return res.status(500).json({
            error: true,
            message: "Internal Server Error"
        })
    }
}

// resetPassword

async function resetPassword(req, res) {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;
    try {

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: true, message: 'User not found' });
        }

        const isValid = await user.validatePassword(currentPassword);

        if(!isValid){
            return res.status(400).json({
                error: true,
                message: 'Invalid password',
            })
        }

       user.password = newPassword;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Password updated successfully',
        });

    } catch (error){
        console.log(error);
        return res.status(500).json({
            error: true,
            message: "Internal Server Error"
        })
    }
}

async function updateUserProfile(req, res){
    const userId = req.user._id;
    const updates = req.body;

    if (!updates) {
        return res.status(400).json({
            error: true,
            message: "No data provided"
        })
    }

    if (updates.email){
        const email = updates.email;
        const isPresent = await User.findOne({email});
        if (isPresent) {
            return res.status(400).json({
                error: true,
                message: 'Email already exists',
            })
        }
    }

    try {
        // Find the user and update with only the fields provided in the request body
        const updatedUser = await User.findByIdAndUpdate(userId, updates, {
            new: true, // Return the updated document
            runValidators: true, // Run validation on the updated fields
            select: '-password -urls' // exclude the password and urls no need as of now
        });

        if (!updatedUser){
            return res.status(404).json({
                error: true,
                message: "User already exist"
            })
        }

        return res.status(200).json({
            error: false,
            data: updatedUser
        })
    } catch (error) {
        console.log("Error updating profile", error);
        return res.status(500).json({
            error: true,
            message: 'Internal server error',
        })

    }
}

async function getApiKey(req, res) {
    const userId = req.user._id;

    // check if the user exists
    const isUser = await User.findById(userId);
    if (!isUser) {
        return res.status(404).json({
            error: true,
            message: 'User not found',
        });
    }

    try {
        const apiKey = isUser.apiKey;
        return res.status(200).json({
            error: false,
            apiKey: apiKey,
        });
    } catch (error) {
        console.log('Error generating API key', error);
        return res.status(500).json({
            error: true,
            message: 'Internal server error',
        });
    }
}

async function regenerateApiKey(req, res) {
    const userId = req.user._id;

    // Check if the user exists
    const isUser = await User.findById(userId);
    if (!isUser) {
        return res.status(404).json({
            error: true,
            message: 'User not found',
        });
    }

    try {
        // Generate a new API key
        const newApiKey = UUIDv4();

        // Find the user's API key record and update it
        const updatedApiKey = await ApiKey.findOneAndUpdate(
            { user: userId },
            { $set: { key: newApiKey, expiresAt: new Date(Date.now() + 360 * 24 * 60 * 60 * 1000) } },
            { new: true }
        );

        if (!updatedApiKey) {
            return res.status(404).json({
                error: true,
                message: 'API key not found',
            });
        }

        // Update the user's API key reference
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { apiKey: newApiKey } },
            { new: true }
        );

        return res.status(200).json({
            error: false,
            data: {
                apiKey: updatedApiKey.key,
                expiresAt: updatedApiKey.expiresAt,
            },
        });
    } catch (error) {
        console.log('Error regenerating API key', error);
        return res.status(500).json({
            error: true,
            message: 'Internal server error',
        });
    }
}

async function getAllCount(req, res) {
    const userId = req.user._id;

    try {
        const user = await User.findById(userId).populate('urls');

        if (!user) {
            return res.status(404).json({
                error: true,
                message: 'User not found',
            });
        }

        const totalUrls = user.urls.length;

        const totalClicks = await Url.find({ user: userId }).select('totalClicks');
        const urls = await Url.find({user : userId});
        const topUrl = urls.reduce((maxDoc, currentDoc) => {
            return currentDoc.totalClicks > (maxDoc?.totalClicks || 0) ? currentDoc : maxDoc;
        }, null);


        const totalClicksArray = totalClicks.map((doc) => doc.totalClicks);
        const totalClicksSum = totalClicksArray.reduce((acc, clicks) => acc + clicks, 0);

        return res.status(200).json({
            error: false,
            totalUrls,
            totalClicksSum,
            topUrl
        });
    } catch (error) {
        console.log('Error getting data', error);
        return res.status(500).json({
            error: true,
            message: 'Internal server error',
        });
    }
}

async function forgotPassword(req, res) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            error: true,
            message: 'Email is required',
        });
    }

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(400).json({
            error: true,
            message: 'Email not registered',
        });
    }

    const resetToken = await user.generatePasswordResetToken();
    await user.save();

    const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const subject = 'Reset Password';
    const message = `You can reset your password by clicking <a href="${resetPasswordUrl}" target="_blank">Reset your password</a>\nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordUrl}.\n If you have not requested this, kindly ignore.`;

    try {
        await sendEmail(email, subject, message);

        res.status(200).json({
            success: true,
            message: `Reset password token has been sent to ${email} successfully`,
        });
    } catch (error) {
        user.forgotPasswordToken = undefined;
        user.forgotPasswordExpiry = undefined;
        await user.save();

        return res.status(500).json({
            error: true,
            message: 'Something wrong try again',
        });
    }
}


async function forgotPasswordReset(req, res) {
    const { resetToken } = req.params;
    const { password } = req.body;

    const forgotPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    if (!password) {
        return res.status(400).json({
            error: true,
            message: 'Password is required',
        });
    }

    const user = await User.findOne({
        forgotPasswordToken,
        forgotPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
        return res.status(400).json({
            error: true,
            message: 'Token is invalid or expired Please try again!',
        });
    }

    user.password = password;
    user.forgotPasswordExpiry = undefined;
    user.forgotPasswordToken = undefined;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Password changed successfully',
    });
}


module.exports = {
    handleSignup,
    handleLogin,
    handleLogout,
    getUserProfile,
    updateUserProfile,
    getApiKey,
    regenerateApiKey,
    getAllCount,
    handleStatus,
    updateProfileImage,
    resetPassword,
    forgotPassword,
    forgotPasswordReset
};
