import express from 'express';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import taskRoutes from './taskRoutes.js';
import editorialServices from '../services/editorialServices.js';
dotenv.config();


const editorialRoutes = express.Router();
editorialRoutes.use('/tasks', taskRoutes);
editorialRoutes.use(bodyParser.json());
editorialRoutes.use(bodyParser.urlencoded({ extended: true }));
editorialRoutes.use(cookieParser());
editorialRoutes.get('/users', async (req, res) => {
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
export default editorialRoutes;
