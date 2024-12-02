import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import editorialServices from '../services/editorialServices.js';
import jwt from 'jsonwebtoken';



dotenv.config();


const eicRoutes = express.Router();
eicRoutes.use(bodyParser.json());
eicRoutes.use(bodyParser.urlencoded({ extended: true }));

// User profile route
eicRoutes.get('/profile', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({
            message: 'Authorization header missing'
        });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const userProfile = await editorialServices.getUserByEmail(decoded.email);
        res.status(200).json({
            name: userProfile.name,
            email: userProfile.email,
            profileImage: userProfile.profile // Return the profile image
            
        });

    } catch (error) {
        res.status(401).json({
            message: 'Invalid token',
            error: error.message
        });
    }
});


eicRoutes.get('/:id', async (req, res) => {
    const editorId = req.params.id;
    try {
        const editor = await editorialServices.getEditorDetails(editorId);
        res.status(200).json({
            message: 'Editor details retrieved successfully',
            data: editor
        });
    } catch (error) {
        res.status(404).json({
            message: 'Editor not found',
            error: error.message
        });
    }
});

export default eicRoutes;