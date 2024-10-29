import express from 'express';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import eicServices from '../services/eicServices.js'; // Import the admin services
import oauthRoutes from './oauthRoutes.js'; // Import the OAuth routes
import oauth2Client from '../utils/oauthClient.js'; // Import the shared OAuth client
import { setTempAdminData } from '../utils/tempData.js'; // Import temp data functions

const eicRoutes = express.Router();
eicRoutes.use(bodyParser.json());
eicRoutes.use(bodyParser.urlencoded({ extended: true }));

// Initiate the OAuth flow
eicRoutes.post('/add/admin', (req, res) => {
    const adminData = req.body;
    const state = uuidv4(); // Generate a unique key
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
            token: token
        });
    } catch (error) {
        res.status(401).json({
            message: 'Invalid username or password',
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
eicRoutes.post('/add', (req, res) => {   
    const userData = req.body;
    eicServices.addUser(userData);
    res.status(201).json({
        message: 'User added successfully'
    }); 
});

export default eicRoutes;