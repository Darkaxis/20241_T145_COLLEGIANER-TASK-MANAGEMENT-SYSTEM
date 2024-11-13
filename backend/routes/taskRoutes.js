import express from 'express';
import taskService from '../services/taskServices.js';

const taskRoutes = express.Router();

taskRoutes.post('/create', async (req, res) => {
    try {
        const taskData = req.body;
        const newTask = await taskService.createTask(taskData);
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
        const email = req.body.email;
        console.log(email);
        const tasks = await taskService.getTasksForUser(email);
        res.status(200).send(tasks);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

taskRoutes.put('/edit/:id', async (req, res) => {
    try {
        const taskId = req.params.id;
        const taskData = req.body;
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

taskRoutes.post('/submit', async (req, res) => {
    try {
        const taskId = req.body.taskId;
        const submittedTask = await taskService.submitTask(taskId, submission);
        res.status(200).send(submittedTask);
    } catch (error) {
        res.status(400).send(error.message);
    }
});



export default taskRoutes;
