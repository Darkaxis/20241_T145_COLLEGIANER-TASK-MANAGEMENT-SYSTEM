import express from 'express';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import eicServices from '../services/eicServices.js'; // Import the admin services
import oauth2Client from '../utils/oauthClient.js'; // Import the shared OAuth client
import { setTempAdminData } from '../utils/tempData.js'; // Import temp data functions
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import googleMailServices from '../services/google/googleMailServices.js';
import taskRoutes from './taskRoutes.js';
import cookieParser from 'cookie-parser';



const eicRoutes = express.Router();
eicRoutes.use('/tasks', taskRoutes);
eicRoutes.use(bodyParser.json());
eicRoutes.use(bodyParser.urlencoded({ extended: true }));
eicRoutes.use(cookieParser());
dotenv.config();

// Initiate the OAuth flow
eicRoutes.post('/add', (req, res) => {
    const { email, role } = req.body;

    console.log(`Adding ${role} with email ${email} and role ${role}`);
    const state = `user-${uuidv4()}`; // Generate a unique state with type
    setTempAdminData(state, {email, role}); // Store the email, role, and type temporarily

    const scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        state: state // Pass the state parameter
    });

    console.log(`OAuth URL for ${role} with email ${email}: ${url}`);

    const status = googleMailServices.sendOAuthLink(email, url);

    res.status(200).json({
        message: 'OAuth link sent successfully',
        status: status
    });
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
    
        res.status(200).json({
            name: userProfile.name,
            email: userProfile.email,
            profileImage: userProfile.profile // Return the profile image
        });
    } catch (error) {
        res.status(401).json({
            message: 'Invalid token',
            error: error.message
        });
    }
});



eicRoutes.get('/users', async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            message: 'No token provided'
        });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const users = await eicServices.getAllUsers(decoded.email);
        res.status(200).json({
            message: 'Users retrieved successfully',
            data: users
        });
    } catch (error) {
        res.status(404).json({
            message: 'Users not found',
            error: error.message
        });
    }
});




export default eicRoutes;