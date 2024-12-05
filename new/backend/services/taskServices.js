import admin from "firebase-admin"; // Ensure shared OAuth client is imported
import db from "../utils/firestoreClient.js";
import oauth2Client from "../utils/oauth2Client.js";
import addTaskToGoogleTasks from "./google/googleTaskServices.js";
import addEventToGoogleCalendar from "./google/googleCalendarServices.js";


// Function to create a new task
async function createTask(taskData, userEmail) {
  try {
    // Validate taskData

    const newTask = {
      ...taskData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Use Firestore transaction to ensure concurrency control
    const taskId = await db.runTransaction(async (transaction) => {
      const taskRef = db.collection("tasks").doc();
      transaction.set(taskRef, newTask);
      return taskRef.id;
    });

    // Add the task to Google Tasks for the specific user
    await addTaskToGoogleTasks(taskData, userEmail);
    await addEventToGoogleCalendar(taskData, userEmail);

    return {
      status: 201,
      message: "Task created successfully",
      taskId: taskId,
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
async function getTasksForUser(name) {
  try {
    // Use Firestore transaction to ensure concurrency control
    const tasks = await db.runTransaction(async (transaction) => {
      // Check visible and assigned tasks
      const visibleTasksSnapshot = await transaction.get(
        db.collection("tasks").where("visibleTo", "array-contains", name)
      );
      const assignedTasksSnapshot = await transaction.get(
        db.collection("tasks").where("assignedTo", "==", name)
      );

      // Use a Set to avoid duplicate tasks
      const taskSet = new Set();

      visibleTasksSnapshot.forEach((doc) => taskSet.add(doc.id));
      assignedTasksSnapshot.forEach((doc) => taskSet.add(doc.id));

      // Convert the Set to an array of task data
      const tasks = [];
      for (const taskId of taskSet) {
        const taskDoc = await transaction.get(db.collection("tasks").doc(taskId));
        if (taskDoc.exists) {
          tasks.push({ id: taskDoc.id, ...taskDoc.data() });
        }
      }

      return tasks;
    });

    return { status: 200, message: "Tasks retrieved successfully", tasks };
  } catch (error) {
    console.error("Error getting tasks for user:", error);
    throw new Error("Error getting tasks for user");
  }
}

// Function to edit a task
async function editTask(taskId, taskData) {
  try {
    // Use Firestore transaction to ensure concurrency control
    await db.runTransaction(async (transaction) => {
      const taskRef = db.collection("tasks").doc(taskId);
      const taskDoc = await transaction.get(taskRef);
      if (!taskDoc.exists) {
        throw new Error("Task not found");
      }

      const updatedTask = {
        ...taskData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      transaction.update(taskRef, updatedTask);
    });

    return { status: 200, message: "Task updated successfully" };
  } catch (error) {
    console.error("Error updating task:", error);
    throw new Error("Error updating task");
  }
}

// Function to get a specific task by ID
async function getTask(taskId) {
  try {
    // Use Firestore transaction to ensure concurrency control
    const task = await db.runTransaction(async (transaction) => {
      const taskRef = db.collection("tasks").doc(taskId);
      const taskDoc = await transaction.get(taskRef);
      if (!taskDoc.exists) {
        throw new Error("Task not found");
      }
      return { id: taskDoc.id, ...taskDoc.data() };
    });

    return { status: 200, message: "Task retrieved successfully", task };
  } catch (error) {
    console.error("Error getting task:", error);
    throw new Error("Error getting task");
  }
}

async function deleteTask(taskId) {
  try {
    // Use Firestore transaction to ensure concurrency control
    await db.runTransaction(async (transaction) => {
      const taskRef = db.collection("tasks").doc(taskId);
      const taskDoc = await transaction.get(taskRef);
      if (!taskDoc.exists) {
        throw new Error("Task not found");
      }
      transaction.delete(taskRef);
    });

    return { status: 200, message: "Task deleted successfully" };
  } catch (error) {
    console.error("Error deleting task:", error);
    throw new Error("Error deleting task");
  }
}

async function approveTask(taskId) { 
  try {
    // Use Firestore transaction to ensure concurrency control
    await db.runTransaction(async (transaction) => {
      const taskRef = db.collection("tasks").doc(taskId);
      const taskDoc = await transaction.get(taskRef);
      if (!taskDoc.exists) {
        throw new Error("Task not found");
      }
      const taskData = taskDoc.data();
      if (taskData.status !== "Checking") {
        throw new Error("Task is not pending approval");
      }
      transaction.update(taskRef, { status: "Done" });
    });

    return { status: 200, message: "Task approved successfully" };
  } catch (error) {
    console.error("Error approving task:", error);
    throw new Error("Error approving task");
  }
}
export async function archiveTask(taskId){
  try {
    // Use Firestore transaction to ensure concurrency control
    await db.runTransaction(async (transaction) => {
      const taskRef = db.collection("tasks").doc(taskId);
      const taskDoc = await transaction.get(taskRef);
      if (!taskDoc.exists) {
        throw new Error("Task not found");
      }
      const taskData = taskDoc.data();
      if (taskData.status !== "Checking") {
        throw new Error("Task is not pending approval");
      }
      transaction.update(taskRef, { archived: "True" });
    });

    return { status: 200, message: "Task approved successfully" };
  } catch (error) {
    console.error("Error approving task:", error);
    throw new Error("Error approving task");
  }

}
export async function submitTask(taskId) {
  try {
    // Use Firestore transaction to ensure concurrency control
    await db.runTransaction(async (transaction) => {
      const taskRef = db.collection("tasks").doc(taskId);
      const taskDoc = await transaction.get(taskRef);
      if (!taskDoc.exists) {
        throw new Error("Task not found");
      }
      const taskData = taskDoc.data();
      if (taskData.status !== "Checking") {
        throw new Error("Task is not pending approval");
      }
      transaction.update(taskRef, { status: "Submitted" });
    });

    return { status: 200, message: "Task Submitted successfully" };
  } catch (error) {
    console.error("Error approving task:", error);
    throw new Error("Error approving task");
  }
  
}


export default {
  createTask,
  getAllTasks,
  getTasksForUser,
  editTask,
  deleteTask,
  getTask,
  approveTask,
};