import express from 'express';
import dotenv from 'dotenv';
import oauth2Client from '../utils/oauthClient.js';
import eicServices from '../services/eicServices.js';
import { getTempAdminData, deleteTempAdminData, setTempAdminData } from '../utils/tempData.js';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import googleMailServices from '../services/google/googleMailServices.js';


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
        
        

            if (state.startsWith('user')) {
            //generate a random password 
            const password = Math.random().toString(36).slice(-8);
            console.log('   Password:', password);
        
            const status = googleMailServices.sendPass(email, password);
            console.log(`Password sent to ${email} with status: ${status.status}`); 
            
            // Handle user callback
            const role = tempData.role;
            const combinedUserData = {
                email: email,
                name: name,
                role: role,
                password: password,
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
            if (user.role === 'eic'){
            // Redirect to the dashboard with the token
            res.redirect(`https://localhost:4000/eic/dashboard?token=${token}`);
            }
            else if (user.role === 'eb'){
                // Redirect to the dashboard with the token
                res.redirect(`https://localhost:4000/eb/dashboard?token=${token}`);
                }
            else if (user.role === 'staff'){
                    // Redirect to the dashboard with the token
                    res.redirect(`https://localhost:4000/staff/dashboard?token=${token}`);
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