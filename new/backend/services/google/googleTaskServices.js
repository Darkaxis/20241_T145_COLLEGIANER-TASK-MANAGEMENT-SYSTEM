import { google } from "googleapis";
import oauth2Client from "../../utils/oauthClient.js";


async function addTaskToGoogleTasks(taskData) {
    const tasks = google.tasks({ version: 'v1', auth: oauth2Client });
    const task = {
      title: taskData.title,
      notes: taskData.description,
      due: taskData.deadline,
    };
  
    try {
      const response = await tasks.tasks.insert({
        tasklist: '@default',
        requestBody: task,
      });
      return response.data;
    } catch (error) {
      console.error('Error adding task to Google Tasks:', error);
      throw new Error('Error adding task to Google Tasks');
    }
  }

  export default addTaskToGoogleTasks;