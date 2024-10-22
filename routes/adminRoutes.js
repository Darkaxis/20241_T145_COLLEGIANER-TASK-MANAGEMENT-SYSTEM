const express = require('express');
const adminRoutes = express.Router();  
const adminServices = require('../services/adminServices'); // Import the admin services

adminRoutes.post('/login', (req, res) => {
    //handle admin login
    const { username, password } = req.body;
    const admin = adminServices.authenticateAdmin(username, password);
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

adminRoutes.post('/logout', (req, res) => { 
    //handle admin logout
    adminServices.logoutAdmin();
    res.status(200).json({
        message: 'Admin logged out successfully'
    });
});
adminRoutes.get('/:id', (req, res) => {
    //handle getting admin ID
    const adminId = req.params.id;
    const admin = adminServices.getAdminDetails(adminId);
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
adminRoutes.add('/add', (req, res) => {   
    //handle adding user
    const userData = req.body;
    adminServices.addUser(userData);
    res.status(201).json({
        message: 'User added successfully'
    }); 
    
    
});

module.exports = adminRoutes;