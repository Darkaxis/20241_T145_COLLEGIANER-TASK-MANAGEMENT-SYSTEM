
const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

app.post('/user/login', (req, res) => {
    //handle user login
}); 

app.post('/user/logout', (req, res) => {
    //handle user logout
}); 

app.get('/user/:id', (req, res) => {
    //handle getting user ID
}); 
