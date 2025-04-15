import express from 'express';
import loginServices from '../services/loginServices.js';
import cookieParser from 'cookie-parser';
import db from '../utils/firestoreClient.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import googleMailService from '../services/google/googleMailServices.js';
import admin from 'firebase-admin';

dotenv.config();

const loginRoutes = express.Router();
loginRoutes.use(cookieParser());
loginRoutes.post('/', async(req, res) => {
    const { email, password, recaptchaToken } = req.body;
    console.log('Received recaptcha token:', recaptchaToken);

    // Verify reCAPTCHA first
    try {
        const recaptchaVerify = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `secret=${process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'}&response=${recaptchaToken}`
        });

        const recaptchaResult = await recaptchaVerify.json();
        console.log('reCAPTCHA verification result:', recaptchaResult);

        if (!recaptchaResult.success) {
            console.error('reCAPTCHA error:', recaptchaResult['error-codes']);
            return res.status(400).json({
                message: 'Please complete the reCAPTCHA verification',
                error: recaptchaResult['error-codes']
            });
        }

        // Continue with existing authentication logic
        const token = await loginServices.authenticateUser(email, password);
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict'
        });
        res.status(200).json({ message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        
        res.status(401).json({ message: error.message });
    }
});


loginRoutes.get('/verify-token', async(req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        //check if token data is updated if not clear token and return 401
        const user = await loginServices.getUser(decoded.email);

        if (user.role !== decoded.role) {
            res.clearCookie('token');
            return res.status(401).json({ message: 'Invalid token' });
        }

        res.status(200).json({ user: decoded });
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
});
loginRoutes.post('/register', async(req, res) => {
    const { encodedData, password } = req.body;

    const userData = jwt.verify(encodedData, process.env.JWT_SECRET);
    const tokenDoc = await db.collection('registrationTokens')
    .doc(userData.registrationToken).get();
    
    if (!tokenDoc.exists) {
    return res.status(400).json({
        success: false,
        message: 'Invalid registration link'
    });
    }
    const tokenData = tokenDoc.data();
        if (tokenData.used) {
            return res.status(400).json({
                success: false,
                message: 'This registration link has already been used'
            });
        }
        

        // Check if the email is already registered
        const existingUser = await db.collection('users')
            .where('emailSearch', '==', userData.email.toLowerCase())
            .get();
        if (!existingUser.empty) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }
        // Mark the token as used
        await db.collection('registrationTokens')
            .doc(userData.registrationToken)
            .update({ used: true, usedAt: admin.firestore.FieldValue.serverTimestamp() });
    try {

        const user = await loginServices.registerUser(userData, password);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
loginRoutes.post('/logout', (req, res) => {
    // Clear the token from the cookie
    res.clearCookie('token');
    res.status(200).json({ message: 'Logout successful' });
});

loginRoutes.post('/user', async(req, res) => {
    const token = req.body.encodedData;

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await loginServices.getUser(decoded.email);
        console.log(user);
        if (    user) {
            
            return res.status(409).json({ message: 'User already exists' });
        }
        res.status(200).json({ user });
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
}
);

loginRoutes.post('/forgot-password', async(req, res) => {
    const { email } = req.body;
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const link = `https://localhost:4000/new_password?token=${token}`;
    try {
        const verify = await loginServices.getUser(email);
        if (!verify) {
            return res.status(400).json({ message: 'User not found' });
        }
        
        const response = await googleMailService.forgotPassword(email, link);
        console.log('Email response:', response);
        res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
loginRoutes.put('/reset-password', async(req, res) => {
    const token = req.body.encodedData;
    const email = jwt.verify(token, process.env.JWT_SECRET).email;
    const password  = req.body.password;
    try {   
        await loginServices.resetPassword(email, password);
        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(400).json({ message: error.message });
    }
});


export default loginRoutes;