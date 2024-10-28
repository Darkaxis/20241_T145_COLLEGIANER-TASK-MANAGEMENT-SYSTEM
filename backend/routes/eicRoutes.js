import express from 'express';
import eicServices from '../services/eicServices.js'; // Import the admin services

const eicRoutes = express.Router();

eicRoutes.post('/login', (req, res) => {
    //handle admin login
    const { username, password } = req.body;
    const admin = eicServices.authenticateAdmin(username, password);
    if (admin) {
        res.status(200).json({
            message: 'Admin authenticated successfully',
            data: admin
        });
    } else {
        res.status(401).json({
            message: 'Invalid username or password'
        });
    }
});

eicRoutes.post('/logout', (req, res) => { 
    //handle admin logout
    eicServices.logoutAdmin();
    res.status(200).json({
        message: 'Admin logged out successfully'
    });
});

eicRoutes.get('/:id', (req, res) => {
    //handle getting admin ID
    const adminId = req.params.id;
    const admin = eicServices.getAdminDetails(adminId);
    if (admin) {
        res.status(200).json({
            message: 'Admin details retrieved successfully',
            data: admin
        });
    } else {
        res.status(404).json({
            message: 'Admin not found'
        });
    }
});

eicRoutes.post('/add', (req, res) => {   
    //handle adding user
    const userData = req.body;
    eicServices.addUser(userData);
    res.status(201).json({
        message: 'User added successfully'
    }); 
});

export default eicRoutes;