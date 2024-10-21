

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

// Route to sync the task in Google
app.post('/tasks/sync/google', (req, res) => {
    //Handle Tasks Sync Google
});

// Route to sync the task in Calendar
app.post('/tasks/sync/calendar', (req, res) => {
    //Handle Tasks Sync Calendar
});

