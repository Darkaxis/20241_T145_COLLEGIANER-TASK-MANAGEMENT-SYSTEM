
const express = require('express');
const staffRoutes = express().Router();
const staffServices = require('../services/staffServices');
const taskServices = require('../services/taskServices');


staffRoutes.post('/login', (req, res) => {
    //handle user login


});

staffRoutes.post('/logout', (req, res) => {
    //handle user logout
    try {
        staffServices.logoutUser();
        res.status(200).json({
            message: 'User logged out successfully'
        });
    }
    catch (error) {
        res.status(400).json({
            message: 'User logout failed'
        });
    }
}
);

staffRoutes.get('/:id', (req, res) => {
    //handle getting user ID
    try {
        const userId = req.params.id;
        const user =  staffServices.getUserDetails(userId);
        res.status(200).json({
            message: 'User details retrieved successfully',
            data: user
        });
    }
    catch (error) {
        res.status(404).json({
            message: 'User not found'
        });
    }
}
);

staffRoutes.get('/tasks/:id', (req, res) => {
    //handle getting user tasks
    try {
        const userId = req.params.id;
        const tasks = taskServices.getAllTasks(userId);
        res.status(200).json(tasks);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }

});


staffRoutes.post('/tasks/:taskId/submit', async (req, res) => {
    //handle submitting assigned task
    try {
        const taskId = req.params.taskId;
        const submissionData = req.body; // Data related to the task submission
        const result = await taskServices.submitTask(taskId, submissionData);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = staffRoutes;
module.exports = app;
