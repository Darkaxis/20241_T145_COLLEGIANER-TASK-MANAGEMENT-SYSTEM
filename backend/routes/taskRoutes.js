import express from 'express';
import taskService from '../services/taskServices.js';
import jwt from 'jsonwebtoken';

import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { logAction } from '../services/eicServices.js';
const taskRoutes = express.Router();
taskRoutes.use(cookieParser());
dotenv.config();

taskRoutes.post('/create', async (req, res) => {
        const token = req.cookies.token;  
        
        if(!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.role !== 'Editor in Charge' && decoded.role !== 'Editorial Board') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
    try {
        const taskData = req.body;
        taskData.assignedBy = decoded.name;
        const newTask = await taskService.createTask(taskData, taskData.assignedTo);
        logAction('Task created', decoded.name, "create");
        res.status(201).send(newTask);

    } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }
});



taskRoutes.get('/all', async (req, res) => {
    const token = req.cookies.token;
    if(!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const name = decoded.name;
    
    try {
        const tasks = await taskService.getAllTask(name);
        console.log(tasks);
        res.status(200).send(tasks);
    } catch (error) {
        res.status(400).send(error.message);
    }
}); 
taskRoutes.get('/get/user', async (req, res) => {
    const token = req.cookies.token;  
        
    if(!token) {
        return res.status(401).json({ message: 'No token provided' });
    }


    try {
        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const name = decoded.name;
        const tasks = await taskService.getTasksForUser(name);

        res.status(200).send(tasks);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

taskRoutes.put('/edit/:id', async (req, res) => {
    
    const token = req.cookies.token;
    
    if(!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'Editor in Charge' && decoded.role !== 'Editorial Board') {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    try {
        const taskId = req.params.id;
        const taskData = req.body;
        
        const updatedTask = await taskService.editTask(taskId, taskData);
        
        logAction('Task updated', decoded.name, "update");
        res.status(200).send(updatedTask);
    } catch (error) {
        res.status(400).send(error.message);
    }
});     

taskRoutes.delete('/delete/:id', async (req, res) => {
    
    const token = req.cookies.token;  
        
    if(!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'Editor in Charge' && decoded.role !== 'Editorial Board') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
   
    try {
        const taskId = req.params.id;
        const deletedTask = await taskService.deleteTask(taskId);
        logAction('Task deleted', decoded.name, "delete");
        res.status(200).send(deletedTask);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

taskRoutes.get('/get/:id', async (req, res) => {
    const token = req.cookies.token;  
        
    if(!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    try {
        const taskId = req.params.id;
        const task = await taskService.getTask(taskId);
        res.status(200).send(task);
    } catch (error) {
        res.status(404).send(error.message);
    }
});

taskRoutes.patch('/approve/:id', async (req, res) => {
    const token = req.cookies.token;  
        
    if(!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'Editor in Charge') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    try {
        const taskId = req.params.id;
        const task = await taskService.approveTask(taskId);
        logAction('Task approved', decoded.name, "update");
        res.status(200).send(task);
    } catch (error) {
        res.status(404).send(error.message);
    }
}
);


// Get all archived tasks for user
taskRoutes.get('/archives', async (req, res) => {
    const token = req.cookies.token; 
        
    if(!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
   

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded);
        const archivedTasks = await taskService.getAllArchivedTasks(decoded.name);
        
        res.status(200).json({
            message: 'Archived tasks retrieved successfully',
            tasks: archivedTasks
        });

    } catch (error) {
        console.error('Get archived tasks error:', error);
        res.status(500).json({ 
            message: 'Error retrieving archived tasks',
            error: error.message 
        });
    }
});

taskRoutes.patch('/archive/:id', async (req, res) => {
    const token = req.cookies.token;
    
    // Token validation
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const taskId = req.params.id;
        
        // Pass user ID from token
        const result = await taskService.archiveTask(taskId, decoded.name);
        
        // Log action
        logAction('Task archived', decoded.name, "update");
        
        // Return success response
        res.status(200).json({
            message: 'Task archived successfully',
            taskId: taskId
        });

    } catch (error) {
        console.error('Archive task error:', error);
        
        if (error.message === 'Task not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Task already archived by user') {
            return res.status(400).json({ message: error.message });
        }
        
        res.status(500).json({ 
            message: 'Error archiving task',
            error: error.message 
        });
    }
});
taskRoutes.patch('/unarchive/:id', async (req, res) => {
    const token = req.cookies.token;
    
    // Token validation
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const taskId = req.params.id;
        console.log(taskId);
        
        // Pass user ID from token
        const result = await taskService.unarchiveTask(taskId, decoded.name);
        
        // Log action
        logAction('Task unarchived', decoded.name, "update");
        
        // Return success response
        res.status(200).json({
            message: 'Task unarchived successfully',
            taskId: taskId
        });

    } catch (error) {
        console.error('Unarchive task error:', error);
        
        if (error.message === 'Task not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Task not archived by user') {
            return res.status(400).json({ message: error.message });
        }
        
        res.status(500).json({ 
            message: 'Error unarchiving task',
            error: error.message 
        });
    }
});

taskRoutes.patch('/submit/:taskId', async (req, res) => {
    //handle submitting assigned task
    const token = req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    try {
        const taskId = req.params.taskId;
        
        const result = await taskService.submitTask(taskId, decoded.name);
        logAction('Task submitted', decoded.name, "update");
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

taskRoutes.post('/transfer/:taskId', async (req, res) => {
    const token = req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    try {
        const taskId = req.params.taskId;
        const user = req.body.user;
        const result = await taskService.transferTask(taskId, user);
        logAction('Task transferred', decoded.name, "update");
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});




export default taskRoutes;

