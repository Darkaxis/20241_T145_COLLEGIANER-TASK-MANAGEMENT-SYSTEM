import express from 'express';
import dotenv from 'dotenv';
import oauth2Client from '../utils/oauthClient.js';
import eicServices from '../services/eicServices.js';
import { getTempAdminData, deleteTempAdminData, setTempAdminData } from '../utils/tempData.js';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

dotenv.config();

const oauthRoutes = express.Router();

// Generate the URL for the Google OAuth2 consent page
oauthRoutes.get('/auth', (req, res) => {
    const state = `login-${uuidv4()}`; // Generate a unique state
    setTempAdminData(state, { type: 'login' }); // Store the state temporarily

    const scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        state: state // Pass the state parameter
    });
    res.redirect(url);
});

// Generate the URL for adding a user via Google OAuth2 consent page
oauthRoutes.post('/add/user', (req, res) => {
    const { email, role } = req.body;
    let state = '';

    if (role === "eic") {
         state = `admin-${uuidv4()}`; // Generate a unique state
    }
    else if (role === "staff" || role === "eb") {
         state = `user-${uuidv4()}`; // Generate a unique state
    }

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ],
        state: state // Pass the state parameter
    });

    res.status(200).json({
        message: 'OAuth URL generated. Check the console for the URL.',
        url: url
    });
});

// Handle the OAuth callback
oauthRoutes.get('/callback', async (req, res) => {
    const code = req.query.code;
    const state = req.query.state; // Retrieve the state parameter

    if (!state) {
        return res.status(400).json({
            message: 'Missing state parameter'
        });
    }

    const tempData = getTempAdminData(state);

    if (!tempData) {
        return res.status(400).json({
            message: 'Invalid or expired state parameter'
        });
    }

    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Fetch user profile information
        const userProfile = await eicServices.getUserProfile(tokens);
        // Extract user information
        const name = userProfile.names && userProfile.names[0] ? userProfile.names[0].displayName : 'No Name';
        const email = userProfile.emailAddresses && userProfile.emailAddresses[0] ? userProfile.emailAddresses[0].value : 'No Email';
        const profile = userProfile.photos && userProfile.photos[0] ? userProfile.photos[0].url : 'No Profile';
        
        // Determine if the callback is for admin, user, or login
        if (state.startsWith('admin')) {
            // Handle admin callback
            const combinedAdminData = {
                email: email,
                name: name,
                profile: profile,
                //accessToken: tokens.accessToken,
                password: tempData.password,
               
            };
            

            // Call createAdmin function from eicServices
            const createAdminResponse = await eicServices.createAdmin(combinedAdminData);

            // Clean up temporary data
            deleteTempAdminData(state);

            res.status(createAdminResponse.status).json({
                message: createAdminResponse.message,
               
            });
        } else if (state.startsWith('user')) {
            // Handle user callback
            const role = tempData.role;
            const combinedUserData = {
                email: email,
                name: name,
                role: role,
                profile: profile,
            };

            // Call addUser function from eicServices
            const addUserResponse = await eicServices.addUser(combinedUserData);

            // Clean up temporary data
            deleteTempAdminData(state);

            res.status(addUserResponse.status).json({
                message: addUserResponse.message,
            });
        } else if (state.startsWith('login')) {
            // Handle login callback
            const user = await eicServices.getUserByEmail(email);
            if (!user) {
                return res.status(401).json({
                    message: 'User not found. Please sign up first.'
                });
            }
            
            // Generate tokens
            const token = jwt.sign(
                {name: user.name, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
            console.log('Token:', token);
            // Clean up temporary data
            deleteTempAdminData(state);
            if (user.role === 'eb'){
            // Redirect to the dashboard with the token
            res.redirect(`https://localhost:4000/eb/dashboard?token=${token}`);
            }
            
        } else {
            res.status(400).json({
                message: 'Invalid state parameter'
            });
        }
    } catch (error) {
        console.error('Error during OAuth2 callback:', error);
        res.status(500).json({
            message: 'Error during OAuth2 callback',
            error: error.message
        });
    }
});

export default oauthRoutes;