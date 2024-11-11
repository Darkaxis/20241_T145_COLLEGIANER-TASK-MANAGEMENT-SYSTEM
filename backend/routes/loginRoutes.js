import express from 'express';
import loginServices from '../services/loginServices.js';

const loginRoutes = express.Router();
loginRoutes.post('/login', async (req, res) => {
    const { email, password } = req.body;
    // Authenticate user and generate token
    const token = loginServices.authenticateUser(email,password) // Replace with your token generation logic

    // Set the token in an HTTP-only cookie
    res.cookie('token', token, {
        httpOnly: true,
        secure: true, // Set to true if using HTTPS
        sameSite: 'Strict' // Adjust based on your requirements
    });

    res.status(200).json({ message: 'Login successful' });
});

export default loginRoutes;