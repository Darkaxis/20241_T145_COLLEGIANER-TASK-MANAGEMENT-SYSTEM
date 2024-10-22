
const  express = require('express');
const userRoutes = express().Router();


userRoutes.post('/login', (req, res) => {
    //handle user login

}); 

userRoutes.post('/logout', (req, res) => {
    //handle user logout
}); 

userRoutes.get('/:id', (req, res) => {
    //handle getting user ID
}); 


module.exports = app;
