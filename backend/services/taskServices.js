import admin from "firebase-admin"; // Ensure shared OAuth client is imported
import db from "../utils/firestoreClient.js";
import oauth2Client from "../utils/oauthClient.js";
import addTaskToGoogleTasks from "./google/googleTaskServices.js";


// Function to create a new task
async function createTask(taskData) {
  try {
    // Validate taskData
   

    const newTask = {
      ...taskData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const taskRef = await db.collection("tasks").add(newTask);
    await addTaskToGoogleTasks(taskData);
    return {
      status: 201,
      message: "Task created successfully",
      taskId: taskRef.id,
    };
  } catch (error) {
    console.error("Error creating task:", error);
    throw new Error("Error creating task");
  }
}
async function getAllTasks() {
  try {
    const tasksSnapshot = await db.collection("tasks").get();
    const tasks = [];
    tasksSnapshot.forEach((doc) => tasks.push({ id: doc.id, ...doc.data() }));
    return { status: 200, message: "Tasks retrieved successfully", tasks };
  } catch (error) {
    console.error("Error getting tasks:", error);
    throw new Error("Error getting tasks");
  }
}

// Function to get tasks for a specific user
async function getTasksForUser(email) {
  try {
    // Check visible and assigned tasks
    const visibleTasksSnapshot = await db
      .collection("tasks")
      .where("visibleTo", "array-contains", email)
      .get();
    const assignedTasksSnapshot = await db
      .collection("tasks")
      .where("assignedTo", "==", email)
      .get();

    // Use a Set to avoid duplicate tasks
    const taskSet = new Set();

    visibleTasksSnapshot.forEach((doc) => taskSet.add(doc.id));
    assignedTasksSnapshot.forEach((doc) => taskSet.add(doc.id));

    // Convert the Set to an array of task data
    const tasks = [];
    for (const taskId of taskSet) {
      const taskDoc = await db.collection("tasks").doc(taskId).get();
      if (taskDoc.exists) {
        tasks.push({ id: taskDoc.id, ...taskDoc.data() });
      }
    }

    return { status: 200, message: "Tasks retrieved successfully", tasks };
  } catch (error) {
    console.error("Error getting tasks for user:", error);
    throw new Error("Error getting tasks for user");
  }
}
async function editTask(taskId, taskData) {
  try {


    const updatedTask = {
      ...taskData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("tasks").doc(taskId).update(updatedTask);
    return { status: 200, message: "Task updated successfully" };
  } catch (error) {
    console.error("Error updating task:", error);
    throw new Error("Error updating task");
  }
}
async function deleteTask(taskId) {
  try {
    await db.collection("tasks").doc(taskId).delete();
    return { status: 200, message: "Task deleted successfully" };
  } catch (error) {
    console.error("Error deleting task:", error);
    throw new Error("Error deleting task");
  }
}

async function getTask(taskId) {
  try {
    const taskDoc = await db.collection("tasks").doc(taskId).get();
    if (taskDoc.exists) {
      return {
        status: 200,
        message: "Task retrieved successfully",
        task: { id: taskDoc.id, ...taskDoc.data() },
      };
    } else {
      return { status: 404, message: "Task not found" };
    }
  } catch (error) {
    console.error("Error getting task:", error);
    throw new Error("Error getting task");
  }
}

export default {
  createTask,
  getAllTasks,
  getTasksForUser,
  editTask,
  deleteTask,
  getTask,
};
