import express from 'express';
import staffServices from '../services/staffServices.js';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import taskRoutes from './taskRoutes.js';
import adviserServices from '../services/adviserServices.js';
dotenv.config();


const adviserRoutes = express.Router();
adviserRoutes.use('/tasks', taskRoutes);
adviserRoutes.use(bodyParser.json());
adviserRoutes.use(bodyParser.urlencoded({ extended: true }));
adviserRoutes.use(cookieParser());
adviserRoutes.get('/users', async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            message: 'No token provided'
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'Staff') {
            return res.status(403).json({
                message: 'Unauthorized'
            });
        }
        const users = await adviserServices.getAllUsers();
        res.status(200).json({
            message: 'Users retrieved successfully',
            data: users
        });
    } catch (error) {
        res.status(404).json({
            message: 'Users not found',
            error: error.message
        });
    }
});
export default adviserRoutes;
