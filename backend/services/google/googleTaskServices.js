


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

async function updateGoogleTask(taskData, email) {
  if (!taskData.googleTaskId) {
    throw new Error('Google Task ID is required for update');
  }

  try {
    const tokens = await getUserTokens(email);
    oauth2Client.setCredentials(tokens);

    const tasks = google.tasks({ version: 'v1', auth: oauth2Client });
    
    const updatePayload = {
      id: taskData.googleTaskId,
      title: taskData.taskName,
      notes: taskData.description,
      due: taskData.deadline,
      status: taskData.status || 'needsAction'
    };

    const response = await tasks.tasks.update({
      tasklist: '@default',
      task: taskData.googleTaskId,
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

export default { addTaskToGoogleTasks, updateGoogleTask, deleteTaskFromGoogleTasks };