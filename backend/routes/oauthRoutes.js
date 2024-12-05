import express from 'express';
import dotenv from 'dotenv';
import eicServices from '../services/eicServices.js';
import { getTempAdminData, deleteTempAdminData, setTempAdminData } from '../utils/tempData.js';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import googleMailServices from '../services/google/googleMailServices.js';
import  passport  from '../utils/passport.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const oauthRoutes = express.Router();

// Generate the URL for the Google OAuth2 consent page

// Generate the URL for the Google OAuth2 consent page
oauthRoutes.get('/auth', (req, res, next) => {
  const state = 'login-' + uuidv4(); // Generate a unique state parameter
  setTempAdminData(state, { /* any data you want to store temporarily */ });
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: state, // Pass the state parameter
    accessType: 'offline',
    prompt: 'consent'
  })(req, res, next);
});

// Handle the OAuth callback
oauthRoutes.get('/callback', passport.authenticate('google', { failureRedirect: '/' }), async (req, res) => {
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
    const userProfile = req.user.profile;
    console.log('User profile:', userProfile);

    try {
        
     const accessToken = req.user.accessToken;
    const refreshToken = req.user.refreshToken;
    
    //     // Store the refresh token in the .env file
    // if (refreshToken) {
    //     const envPath = path.resolve(__dirname, '../.env'); 
    //     fs.appendFile(envPath, `\nGOOGLE_REFRESH_TOKEN=${refreshToken}`, (err) => {
    //       if (err) {
    //         console.error('Error writing to .env file', err);
    //       } else {
    //         console.log('Refresh token stored in .env file');
    //       }
    //     });
    //   }

        const name = userProfile.displayName;
        const email = userProfile.emails[0].value;
        const profile = userProfile.photos[0].value;
        
        

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
                token: accessToken,
                refreshToken: refreshToken,
                password: password,
                profile: profile,
            };
            
            // Call addUser function from eicServices
            const addUserResponse = await eicServices.addUser(combinedUserData);

            // Clean up temporary data
            deleteTempAdminData(state);

            res.status(200).json({
                message: 'OAuth callback handled successfully',
                name,
                email,
                profile
              });
        } else if (state.startsWith('login')) {
            // Handle login callback
            const user = await eicServices.getUserByEmail(email);
        
            if (!user) {
                return res.status(401).json({
                    message: 'User not found. Please sign up first.'
                });
            }
            const token = jwt.sign(
                {
                    userId: user.id, 
                    name: user.name,
                    email: user.email,
                    profile: user.profile,
                    role: user.role
        
                },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            res.cookie('token', token, {
                httpOnly: true,
                secure: true, // Set to true if using HTTPS
                sameSite: 'Strict' // Adjust based on your requirements
            });
            // Clean up temporary data
            deleteTempAdminData(state);
            if (user.role === 'Editor in Charge') {
                // Redirect to the dashboard without the token in the URL
                res.redirect('https://localhost:4000/eic/dashboard');
            } else if (user.role === 'Editorial Board') {
                // Redirect to the dashboard without the token in the URL
                res.redirect('https://localhost:4000/eb/dashboard');
            } else if (user.role === 'Staff') {
                // Redirect to the dashboard without the token in the URL
                res.redirect('https://localhost:4000/staff/dashboard');
            }
            else if (user.role === 'Adviser') {
                // Redirect to the dashboard without the token in the URL
                res.redirect('https://localhost:4000/adviser/dashboard');
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