
const express = require('express');
const editorialRoutes = express().Router();
const editorialServices = require('../services/editoralServices');
const taskServices = require('../services/taskServices');

 editorialRoutes.post('/login', (req, res) => {
    //handle user login


});
 editorialRoutes.post('/logout', (req, res) => {
    //handle user logout
    try {
        editorialServices.logoutUser();
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
 editorialRoutes.get('/:id', (req, res) => {
    //handle getting user ID
    try {
        const userId = req.params.id;
        const user =  editorialServices.getUserDetails(userId);
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
 editorialRoutes.get('/tasks/:id', (req, res) => {
    //handle getting user tasks
    try {
        const userId = req.params.id;
        const tasks = taskServices.getAllTasks(userId);
        res.status(200).json(tasks);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }

});

 editorialRoutes.post('/tasks/:taskId/submit', async (req, res) => {
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
editorialRoutes.post('/tasks/create', async (req, res) => {
    //handle creating a task
    try {
        const taskData = req.body;
        const newTask = await taskServices.createTask(taskData);
        res.status(201).send(newTask);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

module.exports = editorialRoutes;
