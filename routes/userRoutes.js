
const express = require('express');
const userRoutes = express().Router();


userRoutes.post('/login', (req, res) => {
    //handle user login


});

userRoutes.post('/logout', (req, res) => {
    //handle user logout
    try {
        userServices.logoutUser();
        res.status(200).json({
            message: 'User logged out successfully'
        });
    });

userRoutes.get('/:id', (req, res) => {
    //handle getting user ID
    try {
        const userId = req.params.id;
        const user = await userServices.getUserDetails(userId);
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

userRoutes.get('/tasks/:id', (req, res) => {
    //handle getting user tasks
    try {
        const userId = req.params.id;
        const tasks = await taskServices.getAllTasks(userId);
        res.status(200).json(tasks);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }

});


userRoutes.post('/tasks/:taskId/submit', async (req, res) => {
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

module.exports = userRoutes;
module.exports = app;
