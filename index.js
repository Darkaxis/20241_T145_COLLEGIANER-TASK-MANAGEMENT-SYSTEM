const express = require('express');
const app = express();

app.use(express.json());

// Route to sync the task in Google
app.post('/tasks/sync/google', (req, res) => {
    //Handle Tasks Sync Google
});

// Route to sync the task in Calendar
app.post('/tasks/sync/calendar', (req, res) => {
    //Handle Tasks Sync Calendar
});