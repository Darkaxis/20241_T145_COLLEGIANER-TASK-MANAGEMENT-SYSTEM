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

taskRoutes.get('/:id', async (req, res) => {    
    try {
        const taskId = req.params.id;
        const task = await taskService.getTask(taskId);
        res.status(200).send(task);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

taskRoutes.get('/', async (req, res) => {    
    try {
        const tasks = await taskService.getAllTasks();
        res.status(200).send(tasks);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

taskRoutes.put('/:id', async (req, res) => {
    try {
        const taskId = req.params.id;
        const taskData = req.body;
        const updatedTask = await taskService.updateTask(taskId, taskData);
        res.status(200).send(updatedTask);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

taskRoutes.delete('/:id', async (req, res) => {
    try {
        const taskId = req.params.id;
        await taskService.deleteTask(taskId);
        res.status(204).send();
    } catch (error) {
        res.status(400).send(error.message);
    }
});

export default taskRoutes;
