import express from 'express';
import loginServices from '../services/loginServices.js';
import cookieParser from 'cookie-parser';

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
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
            body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`
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


loginRoutes.get('/verify-token', (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    //CHECK FOR invAlid token



    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        res.status(200).json({ user: decoded });
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
});


loginRoutes.post('/logout', (req, res) => {
    // Clear the token from the cookie
    res.clearCookie('token');
    res.status(200).json({ message: 'Logout successful' });
});

export default loginRoutes;