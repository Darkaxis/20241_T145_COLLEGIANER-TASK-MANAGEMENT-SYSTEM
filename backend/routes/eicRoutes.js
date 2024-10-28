import express from 'express';
import bodyParser from 'body-parser'
import eicServices from '../services/eicServices.js'; // Import the admin services

const eicRoutes = express.Router();
eicRoutes.use(bodyParser.json());
eicRoutes.use(bodyParser.urlencoded({ extended: true }));


eicRoutes.post('/login', async (req, res) => {
    //handle admin login
    const { username, password } = req.body;
    const admin = await eicServices.authenticateAdmin(username, password);
    if (admin) {
        res.status(200).json({
            message: 'Admin authenticated successfully',
            token: admin
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


// Add admin
eicRoutes.post('/add/admin', async (req, res) => {   
    try {
        const adminData = req.body;
        console.log('Received adminData:', adminData); // Log the admin data for debugging
        const result = await eicServices.createAdmin(adminData); // Use await to handle the promise
        console.log('Result:', result); // Log the result for debugging
        res.status(result.status).json({ message: result.message });
    } catch (error) {
        res.status(400).json({
            message: 'Error adding admin',
            error: error.message
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