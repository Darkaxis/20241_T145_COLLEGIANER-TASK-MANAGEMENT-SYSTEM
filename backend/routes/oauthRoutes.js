import express from 'express';
//import { google } from 'googleapis';
import dotenv from 'dotenv';
import eicServices from '../services/eicServices.js';
import oauth2Client  from '../utils/oauthClient.js';
import { getTempAdminData, deleteTempAdminData, setTempAdminData } from '../utils/tempData.js';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

dotenv.config();

const oauthRoutes = express.Router();

// Initialize OAuth2 client

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
    const state = `user-${uuidv4()}`; // Generate a unique state
    setTempAdminData(state, { email, role }); // Store the email and role temporarily

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
        const userProfile = await eicServices.getUserProfile(tokens.access_token);
        

        // Extract user information
        const name = userProfile.names && userProfile.names[0] ? userProfile.names[0].displayName : 'No Name';
        const email = userProfile.emailAddresses && userProfile.emailAddresses[0] ? userProfile.emailAddresses[0].value : 'No Email';

        // Determine if the callback is for admin or user
        if (state.startsWith('admin')) {
            // Handle admin callback
            const combinedAdminData = {
                email: email,
                name: name,
                password: tempData.password,
                accessToken: tokens.access_token,
            };

            // Call createAdmin function from eicServices
            const createAdminResponse = await eicServices.createAdmin(combinedAdminData);

            // Clean up temporary data
            deleteTempAdminData(state);

            res.status(createAdminResponse.status).json({
                message: createAdminResponse.message,
                data: combinedAdminData
            });
        } else if (state.startsWith('user')) {
            // Handle user callback
            const role = tempData.role;
            const combinedUserData = {
                email: email,
                name: name,
                role: role,
                accessToken: tokens.access_token,
            };

            // Call addUser function from eicServices
            const addUserResponse = await eicServices.addUser(combinedUserData);

            // Clean up temporary data
            deleteTempAdminData(state);

            res.status(addUserResponse.status).json({
                message: addUserResponse.message,
                data: combinedUserData
            });
        } else if (state.startsWith('login')){
             // Handle login callback
             const user = await eicServices.getUserByEmail(email);
             
             if (!user) {
                 return res.status(401).json({
                     message: 'User not found. Please sign up first.'
                 });
             }
 
             // Generate tokens
             const token = jwt.sign(
                 tokens,
                 process.env.JWT_SECRET,
                 { expiresIn: '7d' }
             );
             // Clean up temporary data
             deleteTempAdminData(state);
            if (user.role == 'eb'){
             //redirect to dashboard 
            
             res.redirect(`https://localhost:4000/eb/dashboard?token=${token}`);
            }
            else if(user.role == 'staff'){
                res.redirect(`https://localhost:4000/staff/dashboard?token=${token}`);

            }
        }
        else {
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