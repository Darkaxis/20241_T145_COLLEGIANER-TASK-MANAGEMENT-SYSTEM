import express from 'express';
import taskService from '../services/taskServices.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

const taskRoutes = express.Router();
taskRoutes.use(cookieParser());
dotenv.config();

taskRoutes.post('/create', async (req, res) => {
        // const token = req.cookies.token;  
        // if(!token) {
        //     return res.status(401).json({ message: 'No token provided' });
        // }
        // const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // if (decoded.role !== 'Editor in Chief' || decoded.role !== 'Editorial Board') {
        //     return res.status(403).json({ message: 'Unauthorized' });
        // }
    try {
        const taskData = req.body;
        const newTask = await taskService.createTask(taskData, taskData.assignedTo);
        res.status(201).send(newTask);
    } catch (error) {
        res.status(400).send(error.message);
    }
});



taskRoutes.get('/get/all', async (req, res) => {
    try {
        const tasks = await taskService.getAllTasks();
        res.status(200).send(tasks);
    } catch (error) {
        res.status(400).send(error.message);
    }
}); 
//get task by user email
taskRoutes.get('/get/user', async (req, res) => {


    try {
        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const name = decoded.name;
        console.log(name);
        const tasks = await taskService.getTasksForUser(name);
        res.status(200).send(tasks);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

taskRoutes.put('/edit/:id', async (req, res) => {
    
    const token = req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const assignee = decoded.email;
    try {
        const taskId = req.params.id;
        const taskData = req.body;
        taskData.assignee = assignee;
        console.log(taskData);
        const updatedTask = await taskService.editTask(taskId, taskData);
        res.status(200).send(updatedTask);
    } catch (error) {
        res.status(400).send(error.message);
    }
});     

taskRoutes.delete('/delete/:id', async (req, res) => {
    try {
        const taskId = req.params.id;
        const deletedTask = await taskService.deleteTask(taskId);
        res.status(200).send(deletedTask);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

taskRoutes.get('/get/:id', async (req, res) => {
    try {
        const taskId = req.params.id;
        const task = await taskService.getTask(taskId);
        res.status(200).send(task);
    } catch (error) {
        res.status(404).send(error.message);
    }
});

taskRoutes.post('/approve/:id', async (req, res) => {
    try {
        const taskId = req.params.id;
        const task = await taskService.approveTask(taskId);
        res.status(200).send(task);
    } catch (error) {
        res.status(404).send(error.message);
    }
}
);
taskRoutes.post('/archive/:id', async (req, res) => {
    try {
        const taskId = req.params.id;
        const task = await taskService.archiveTask(taskId);
        res.status(200).send(task);
    } catch (error) {
        res.status(404).send(error.message);
    }
}
);

taskRoutes.post('submit/:taskId/', async (req, res) => {
    //handle submitting assigned task
    try {
        const taskId = req.params.taskId;
        const submissionData = req.body; // Data related to the task submission
        const result = await taskService.submitTask(taskId, submissionData);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

export default taskRoutes;

