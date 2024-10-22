const express = require('express');
const adminRoutes = express.Router();  

adminRoutes.post('/login', (req, res) => {
    //handle admin login
});

adminRoutes.post('/logout', (req, res) => { 
    //handle admin logout
});



module.exports = adminRoutes;