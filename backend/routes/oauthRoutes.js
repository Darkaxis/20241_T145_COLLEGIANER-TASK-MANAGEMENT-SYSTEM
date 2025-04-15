import express from 'express';
import dotenv from 'dotenv';
import { getTempAdminData, deleteTempAdminData, setTempAdminData } from '../utils/tempData.js';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import googleMailServices from '../services/google/googleMailServices.js';
import db from '../utils/firestoreClient.js';
import  passport  from '../utils/passport.js';
import admin from 'firebase-admin';


import loginServices from '../services/loginServices.js';

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
    accessType: 'offline'
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
    

    try {
        
     const accessToken = req.user.accessToken;
    const refreshToken = req.user.refreshToken;

        const name = userProfile.displayName;
        const email = userProfile.emails[0].value;
        const profile = userProfile.photos[0].value;
        
        if (state.startsWith('user')) {
            // Encode user data for URL
            const registrationToken = uuidv4();
            const userData = {
                email: email,
                name: name,
                role: tempData.role,
                token: accessToken,
                refreshToken: refreshToken,
                accessToken: accessToken,
                profile: profile,
                state: state,
                registrationToken: registrationToken
        
            };
        
            const encodedData = jwt.sign(userData, process.env.JWT_SECRET, {expiresIn: '3d'});
            await db.collection('registrationTokens').doc(registrationToken).set({
                used: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                email: email
            });
            res.redirect(`https://localhost:4000/register?data=${encodedData}&name=${name}`);

        } else if (state.startsWith('login')) {
            // Handle login callback
            const user = await loginServices.getUser(email);
        
        
                
                
            
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
        console.log("Error during OAuth2 callback:", error);
        if (error.message === "User not found") {
            
            res.redirect(`https://localhost:4000/user_not_found`);
        }
        res.status(500).json({
            message: 'Error during OAuth2 callback',
            error: error.message
        });
    }
});

export default oauthRoutes;