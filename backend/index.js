require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/userRoutes');
const urlRoutes = require('./routes/urlRoutes');
const apiRoutes = require('./routes/apiRoutes'); // For public API
const clickRoutes = require('./routes/clickRoutes'); // For click analytics
const redirectRoutes = require('./routes/redirectRoutes'); // For URL redirection
const { authenticateUser } = require('./middleware/authenticate');
const { authenticateApiKey } = require('./middleware/authenticate'); // Middleware for API key authentication

const app = express();
app.set('trust proxy', 1)

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));


app.use(cors({
 origin: (origin, callback) => {
        const allowedOrigins = ["http://localhost:5173", "https://trimat.vercel.app",];
       if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
       } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
   methods: ["POST", "GET", "PUT", "DELETE"],
   credentials: true
}));

// Middleware for parsing JSON request bodies
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

// User-related routes (for internal use)
app.use('/api/users', userRoutes);

// URL-related routes (for internal use)
app.use('/api/urls/manage', urlRoutes);

// Public API routes (for external users using API key)
//app.use('/api', authenticateApiKey, apiRoutes);

// Click analytics routes (for internal use, nested under URL management routes)
app.use('/api/urls', authenticateUser, clickRoutes);

// URL redirection route (publicly accessible)
app.use('/', redirectRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
