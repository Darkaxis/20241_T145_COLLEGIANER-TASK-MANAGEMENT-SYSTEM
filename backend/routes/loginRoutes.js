import express from 'express';
import loginServices from '../services/loginServices.js';
import cookieParser from 'cookie-parser';
import { compareSync } from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const loginRoutes = express.Router();
loginRoutes.use(cookieParser());
loginRoutes.post('/',  async (req, res) => {
    const { email, password } = req.body;
    // Authenticate user and generate toke
    const token = await loginServices.authenticateUser(email,password) // Replace with your token generation logic
    // Set the token in an HTTP-only cookie
    res.cookie('token', token, {
        httpOnly: true,
        secure: true, // Set to true if using HTTPS
        sameSite: 'Strict' // Adjust based on your requirements
    });
    res.status(200).json({ message: 'Login successful' ,});
});


loginRoutes.get('/verify-token', (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    try {
        console.log('Token:', token);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded:', decoded);
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