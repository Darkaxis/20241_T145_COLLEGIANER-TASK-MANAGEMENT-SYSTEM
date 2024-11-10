import admin from "firebase-admin"; // Ensure shared OAuth client is imported
import db from "../utils/firestoreClient.js";

const db = admin.firestore();

// Function to create a new task
async function createTask(taskData) {
    try {
        const newTask = {
            ...taskData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        const taskRef = await db.collection('tasks').add(newTask);
        return { status: 201, message: 'Task created successfully', taskId: taskRef.id };
    } catch (error) {
        console.error('Error creating task:', error);
        throw new Error('Error creating task');
    }
}

// Function to get details of a task
async function getTask(taskId) {
    try {
        const taskDoc = await db.collection('tasks').doc(taskId).get();
        if (!taskDoc.exists) {
            throw new Error('Task not found');
        }
        return { status: 200, message: 'Task retrieved successfully', task: taskDoc.data() };
    } catch (error) {
        console.error('Error getting task:', error);
        throw new Error('Error getting task');
    }
}

// Function to get all tasks for a specific user
async function getAllTasks(userId) {
    try {
        const tasksSnapshot = await db.collection('tasks').where('userId', '==', userId).get();
        const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { status: 200, message: 'Tasks retrieved successfully', tasks: tasks };
    } catch (error) {
        console.error('Error getting tasks:', error);
        throw new Error('Error getting tasks');
    }
}

// Function to update a task
async function updateTask(taskId, taskData) {
    try {
        const updatedTask = {
            ...taskData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('tasks').doc(taskId).update(updatedTask);
        return { status: 200, message: 'Task updated successfully' };
    } catch (error) {
        console.error('Error updating task:', error);
        throw new Error('Error updating task');
    }
}

// Function to delete a task
async function deleteTask(taskId) {
    try {
        await db.collection('tasks').doc(taskId).delete();
        return { status: 200, message: 'Task deleted successfully' };
    } catch (error) {
        console.error('Error deleting task:', error);
        throw new Error('Error deleting task');
    }
}

export default { createTask, getTask, getAllTasks, updateTask, deleteTask };