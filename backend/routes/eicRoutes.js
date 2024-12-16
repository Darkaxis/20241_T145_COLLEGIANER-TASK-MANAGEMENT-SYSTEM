import express from 'express';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import eicServices, { logAction } from '../services/eicServices.js'; // Import the admin services
import { setTempAdminData } from '../utils/tempData.js'; // Import temp data functions
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import googleMailServices from '../services/google/googleMailServices.js';
import taskRoutes from './taskRoutes.js';
import cookieParser from 'cookie-parser';


const eicRoutes = express.Router();
eicRoutes.use('/tasks', taskRoutes);
eicRoutes.use(bodyParser.json());
eicRoutes.use(bodyParser.urlencoded({ extended: true }));
eicRoutes.use(cookieParser());
dotenv.config();

// Initiate the OAuth flow
eicRoutes.post('/add', async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            message: 'No token provided'
        });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'Editor in Charge') {
            return res.status(403).json({
                message: 'Unauthorized'
            });
        }
    const { email, role } = req.body;

        // Check if user already exists
    try {
        const user = await eicServices.getUserByEmail(email);
        if (user) {
            return res.status(409).json({
                success: false,
                message: "User already exists. Operation cancelled."
            });
        }
    
        console.log(`Adding ${role} with email ${email} and role ${role}`);
        const state = `user-${uuidv4()}`; // Generate a unique state with type
        setTempAdminData(state, {email, role}); // Store the email, role, and type temporarily
    
        const scopes = [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/tasks', // Add the Google Tasks scope
             'https://www.googleapis.com/auth/calendar'
    
          ];
    
          const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URL}&response_type=code&scope=${scopes.join(' ')}&access_type=offline&prompt=consent&state=${state}`;
        
        eicServices.logAction('User added', decoded.name, 'add');
        const status = await googleMailServices.sendOAuthLink(email, authUrl);
        if (!status) {
            return res.status(500).json({
                message: 'Failed to send OAuth link'
            });
        }
        
        if (status === 400) {
            return res.status(400).json({
                message: 'Invalid email address'
            })};
    
        logAction('Added user',decoded.name, 'create' )
        res.status(200).json({
            message: 'OAuth link sent successfully'
        });
    } catch (error) {
        console.error("Error checking user:", error);
        return res.status(500).json({
            success: false,
            message: "Error checking user existence"
        });
    }
        








   
});



eicRoutes.get('/users', async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            message: 'No token provided'
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'Editor in Charge') {
            return res.status(403).json({
                message: 'Unauthorized'
            });
        }
        const users = await eicServices.getAllUsers();
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

eicRoutes.patch('/edit', async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(403).json({
            message: 'No token provided'
        });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'Editor in Charge') {
        return res.status(403).json({
            message: 'Unauthorized'
        });
    }

    const { email, role, disabled } = req.body;
    console.log(`Updating user ${email} with role ${role} and disabled ${disabled}`);
    const status = await eicServices.updateUser(email, role, disabled);
    if (!status) {
        return res.status(500).json({
            message: 'Failed to update user role'
        });
    }
    eicServices.logAction('User role updated', decoded.name, 'update');
    res.status(200).json({
        message: 'User role updated successfully'
    });
});

//logs
eicRoutes.get('/logs', async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(403).json({
            message: 'No token provided'
        });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'Editor in Charge') {
        return res.status(403).json({
            message: 'Unauthorized'
        });
    }
    const logs = await eicServices.getLogs();
    res.status(200).json({
        message: 'Logs retrieved successfully',
        data: logs
    });
});

eicRoutes.get('/editors', async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(403).json({
            message: 'No token provided'
        });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'Editor in Charge') {
        return res.status(403).json({
            message: 'Unauthorized'
        });
    }
    const editors = await eicServices.getEditors();
    res.status(200).json({
        message: 'Editors retrieved successfully',
        data: editors
    });
});



export default eicRoutes;