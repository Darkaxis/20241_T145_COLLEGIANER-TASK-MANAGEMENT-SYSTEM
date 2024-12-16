import { google } from 'googleapis';
import oauth2Client from '../../utils/oauth2Client.js';
import db from '../../utils/firestoreClient.js';



async function getUserTokens(email) {
  try {
    const userSnapshot = await db
      .collection('users')
      .where('emailSearch', '==', email.toLowerCase())
      .get();

    if (userSnapshot.empty) {
      throw new Error('User not found');
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    return {
      access_token: userData.token,
      refresh_token: userData.refreshToken
    };
  } catch (error) {
    console.error('Error getting user tokens:', error);
    throw new Error('Error getting user tokens');
  }
}

async function googleTaskStatusDone(googleTaskId, email) {
  if (!googleTaskId) {
    throw new Error('Missing Google Task ID');
  }

  const tokens = await getUserTokens(email);
  oauth2Client.setCredentials(tokens);


  try {
    const task = google.tasks({ version: 'v1', auth: oauth2Client });
    const response = await task.tasks.patch({
      tasklist: '@default',
      task: googleTaskId,
      resource: {
        status: 'completed'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
} 


async function addTaskToGoogleTasks(taskData, email) {
  try {
    const tokens = await getUserTokens(email);
    oauth2Client.setCredentials(tokens);

    const tasks = google.tasks({ version: 'v1', auth: oauth2Client });
    const task = {
      title: taskData.taskName,
      notes: taskData.description,
      due: taskData.deadline,
    };

    const response = await tasks.tasks.insert({
      tasklist: '@default',
      requestBody: task,
    });

    // Store task with Google Task ID
    const taskWithId = {
      ...taskData,
      googleTaskId: response.data.id
    };

    console.log('Task added with ID:', response.data.id);
    return taskWithId;
  } catch (error) {
    console.error('Error adding task:', error);
    throw error;
  }
}

async function updateTaskInGoogleTasks(googleTaskId,taskData, email) {
  if (!googleTaskId) {
    throw new Error('Google Task ID is required for update');
  }

  try {
    const tokens = await getUserTokens(email);
    oauth2Client.setCredentials(tokens);

    const tasks = google.tasks({ version: 'v1', auth: oauth2Client });
    
    const updatePayload = {
      id: googleTaskId,
      title: taskData.taskName,
      notes: taskData.description,
      due: taskData.deadline,
      status: taskData.status || 'needsAction'
    };

    const response = await tasks.tasks.update({
      tasklist: '@default',
      task: googleTaskId,
      requestBody: updatePayload
    });

    return {
      ...taskData,
      googleTaskId: response.data.id,
      status: response.data.status
    };
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

async function deleteTaskFromGoogleTasks(taskData, email) {
  if (!taskData.googleTaskId) {
    throw new Error('Google Task ID is required for deletion');
  }

  try {
    const tokens = await getUserTokens(email);
    oauth2Client.setCredentials(tokens);

    const tasks = google.tasks({ version: 'v1', auth: oauth2Client });
    
    await tasks.tasks.delete({
      tasklist: '@default',
      task: taskData.googleTaskId
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

export default { addTaskToGoogleTasks, updateTaskInGoogleTasks, deleteTaskFromGoogleTasks, googleTaskStatusDone };