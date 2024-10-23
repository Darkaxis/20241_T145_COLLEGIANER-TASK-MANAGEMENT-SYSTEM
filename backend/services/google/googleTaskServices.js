
//add to google task

// const addTaskToGoogleTask = async (task) => {
//     try {
//         const task = {
//             title: task.title,
//             notes: task.description,
//             due: task.endTime,
//             status: 'needsAction',
//         };
//         const task = await getGoogleTask();
//         const response = await task.tasks.insert({
//             taskList: 'primary',
//             resource: task,
//         });
//         console.log('Task created: %s', response.data.htmlLink);
//         return response.data;
//     } catch (error) {
//         console.error('Error adding task to google task:', error);
//         return null;
//     }