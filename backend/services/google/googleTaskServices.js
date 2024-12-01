import { google } from "googleapis";
import oauth2Client from "../../utils/oauth2Client.js";
import db from "../../utils/firestoreClient.js"; // Assuming you have a Firestore client to get user tokens


async function getUserTokens(email) {
  try {
    const userSnapshot = await db.collection('users').where('email', '==', email).get();
    if (userSnapshot.empty) {
      throw new Error('User not found');
    }
    const userDoc = userSnapshot.docs[0];
    return {
      access_token: userDoc.data().token,
      refresh_token: userDoc.data().refreshToken
    }; // Assuming tokens are stored in the user document
  } catch (error) {
    console.error('Error getting user tokens:', error);
    throw new Error('Error getting user tokens');
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
    console.log('Task added to Google Tasks:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding task to Google Tasks:', error);
    throw new Error('Error adding task to Google Tasks');
  }
}

export default addTaskToGoogleTasks;