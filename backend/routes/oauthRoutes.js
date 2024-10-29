import express from 'express';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import eicServices from '../services/eicServices.js';
import oauth2Client from '../utils/oauthClient.js'; // Import the shared OAuth client
import { getTempAdminData, deleteTempAdminData } from '../utils/tempData.js'; // Import temp data functions

dotenv.config();

const oauthRoutes = express.Router();

// Initialize OAuth2 client


// Generate the URL for the Google OAuth2 consent page
oauthRoutes.get('/auth', (req, res) => {
    const scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes
    });

    res.redirect(url);
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

    const adminData = getTempAdminData(state);

    if (!adminData) {
        return res.status(400).json({
            message: 'Invalid or expired state parameter'
        });
    }

    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Fetch user profile information
        const userProfile = await eicServices.getUserProfile(tokens.access_token);
        console.log('User Profile:', userProfile); // Debugging: Log the user profile

        // Extract user information
        const name = userProfile.names[0].displayName;

        // Combine the temporary admin data with the fetched user profile
        const combinedAdminData = {
            ...adminData,
            name: name,
            accessToken: tokens.access_token
        };

        // Validate combinedAdminData to ensure no properties are undefined
        for (const key in combinedAdminData) {
            if (combinedAdminData[key] === undefined) {
                return res.status(400).json({
                    message: `Invalid data: ${key} is undefined`
                });
            }
        }

        // Call createAdmin function from eicServices
        const createAdminResponse = await eicServices.createAdmin(combinedAdminData);

        // Clean up temporary data
        deleteTempAdminData(state);

        res.status(createAdminResponse.status).json({
            message: createAdminResponse.message,
            data: combinedAdminData
        });
    } catch (error) {
        console.error('Error during OAuth2 callback:', error);
        res.status(500).json({
            message: 'Error during OAuth2 callback',
            error: error.message
        });
    }
});

export default oauthRoutes;