import express from 'express';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import eicServices from '../services/eicServices.js'; // Import the admin services
import oauthRoutes from './oauthRoutes.js'; // Import the OAuth routes
import oauth2Client from '../utils/oauthClient.js'; // Import the shared OAuth client
import { setTempAdminData } from '../utils/tempData.js'; // Import temp data functions
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';


const eicRoutes = express.Router();
eicRoutes.use(bodyParser.json());
eicRoutes.use(bodyParser.urlencoded({ extended: true }));
dotenv.config();
// Initiate the OAuth flow
eicRoutes.post('/add/admin', (req, res) => {
    const adminData = req.body;
    const state = `admin-${uuidv4()}`; // Generate a unique key
    setTempAdminData(state, adminData); // Store the admin data temporarily
    const scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
    ];
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        state: state // Pass the state parameter
    });

    res.status(200).json({
        message: 'Redirecting to Google OAuth',
        url: url
    });
});

// Use the OAuth routes
eicRoutes.use('/oauth', oauthRoutes);

// Existing Routes
eicRoutes.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const token = await eicServices.authenticateAdmin(username, password);
        res.status(200).json({
            message: 'Admin authenticated successfully',
            token: token // Return the token in the response
        });
    } catch (error) {
        res.status(401).json({
            message: 'Invalid username or password',
            error: error.message
        });
    }
});

// User profile route
eicRoutes.get('/profile', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({
            message: 'Authorization header missing'
        });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userProfile = await eicServices.getAdminDetails(decoded.id);
        const googleProfile = await eicServices.getUserProfile(userProfile.accessToken);
        res.status(200).json({
            name: userProfile.name,
            email: userProfile.email,
            profileImage: googleProfile.photos[0].url 
        });
    } catch (error) {
        res.status(401).json({
            message: 'Invalid token',
            error: error.message
        });
    }
});

eicRoutes.post('/logout', (req, res) => { 
    eicServices.logoutAdmin();
    res.status(200).json({
        message: 'Admin logged out successfully'
    });
});

eicRoutes.get('/:id', async (req, res) => {
    const adminId = req.params.id;
    try {
        const admin = await eicServices.getAdminDetails(adminId);
        res.status(200).json({
            message: 'Admin details retrieved successfully',
            data: admin
        });
    } catch (error) {
        res.status(404).json({
            message: 'Admin not found',
            error: error.message
        });
    }
});

// Example additional route
eicRoutes.post('/add/user', (req, res) => {
    const { email, role } = req.body;
   
    const state = `user-${uuidv4()}`; // Generate a unique key
    setTempAdminData(state, { email, role }); // Store the email temporarily

    const scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        state: state // Pass the state parameter
    });

    console.log(`OAuth URL for user with email ${email}: ${url}`);

    res.status(200).json({
        message: 'OAuth URL generated. Check the console for the URL.',
        url: url
    });
});


export default eicRoutes;