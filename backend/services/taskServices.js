import admin from "firebase-admin"; // Ensure shared OAuth client is imported
import db from "../utils/firestoreClient.js";
import googleTaskServices from "./google/googleTaskServices.js";
import googleCalendarServices from "./google/googleCalendarServices.js";


function formatDeadline(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

async function createTask(taskData, userEmail) {
  try {
    const deadline = new Date(taskData.deadline);
deadline.setHours(23, 59, 59, 999); // Set to end of day

// Convert to Manila timezone RFC 3339 format for Google APIs
const manilaOffset = '+08:00'; // Manila timezone offset
const isoDeadline = new Date(deadline.toLocaleString('en-US', {
    timeZone: 'Asia/Manila'
})).toISOString()
    .replace(/\.\d{3}Z$/, manilaOffset);

    const newTask = {
      ...taskData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      deadline: isoDeadline,
      version: 1,
    };

    // Use transaction to handle all operations
    const result = await db.runTransaction(async (transaction) => {
      // Create Firestore document
      const taskRef = db.collection("tasks").doc();
      console.log(userEmail);
      try {
        // Add to Google Tasks
        const googleTask = await googleTaskServices.addTaskToGoogleTasks(newTask, userEmail);
        
        // Add to Google Calendar
        const calendarEvent = await googleCalendarServices.addEventToGoogleCalendar(newTask, userEmail);

        // Add external IDs to task data
        const taskWithIds = {
          ...newTask,
          googleTaskId: googleTask.googleTaskId,
          googleCalendarEventId: calendarEvent.googleCalendarEventId
        };

        // Save to Firestore with external IDs
        transaction.set(taskRef, taskWithIds);

      } catch (error) {
        console.error("Error in external services:", error);
        throw new Error("Failed to create task in external services");
      }
    });

    return {
      status: 201,
      message: "Task created successfully",
      ...result
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
    tasksSnapshot.forEach((doc) => {
      const taskData = doc.data();
      tasks.push({ 
        id: doc.id,
        ...taskData,
        deadline: formatDeadline(taskData.deadline)
      });
    });
    return { status: 200, message: "Tasks retrieved successfully", tasks };
  } catch (error) {
    console.error("Error getting tasks:", error);
    throw new Error("Error getting tasks");
  }
}

async function getTasksForUser(name) {
  try {
    const tasks = await db.runTransaction(async (transaction) => {
      const visibleTasksSnapshot = await transaction.get(
        db.collection("tasks").where("visibleTo", "array-contains", name)
      );
      const assignedTasksSnapshot = await transaction.get(
        db.collection("tasks").where("assignedTo", "==", name)
      );

      const visibleTasks = [];
      const assignedTasks = [];

      visibleTasksSnapshot.forEach((doc) => {
        const taskData = doc.data();
        visibleTasks.push({
          id: doc.id,
          ...taskData,
          deadline: formatDeadline(taskData.deadline)
        });
      });

      assignedTasksSnapshot.forEach((doc) => {
        const taskData = doc.data();
        assignedTasks.push({
          id: doc.id,
          ...taskData,
          deadline: formatDeadline(taskData.deadline)
        });
      });

      return [...new Set([...visibleTasks, ...assignedTasks])];
    });

    return { status: 200, message: "Tasks retrieved successfully", tasks };
  } catch (error) {
    console.error("Error getting tasks:", error);
    throw new Error("Error getting tasks");
  }
}
// Function to edit a task
async function editTask(taskId, taskData) {
  const deadline = new Date(taskData.deadline);
  deadline.setHours(23, 59, 59, 999); // Set to end of day
  const isoDeadline = deadline.toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/(\d+)\/(\d+)\/(\d+),/, '$3-$1-$2T');
  try {
    // Use Firestore transaction to ensure concurrency control
    await db.runTransaction(async (transaction) => {
      const taskRef = db.collection("tasks").doc(taskId);
      const taskDoc = await transaction.get(taskRef);
      if (!taskDoc.exists) {
        throw new Error("Task not found");
      }

      const currentVersion = taskDoc.data().version; // Get the current version number

      const taskDataVersion = parseInt(taskData.version, 10);
      // Check if the task has been updated since the transaction started
      if (taskDataVersion && taskDataVersion != currentVersion) {
        console.log("Task has been updated by another transaction");
        throw new Error("Task has been updated by another transaction");

      }

      const updatedTask = {
        ...taskData,
        deadline: isoDeadline,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        version: currentVersion + 1, // Increment the version number
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
export async function archiveTask(taskId) {
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
      if (taskData.status !== "To Do") {
        throw new Error("Task is not pending approval");
      }
      transaction.update(taskRef, { status: "Checking" });
    });

    return { status: 200, message: "Task Submitted successfully" };
  } catch (error) {
    console.error("Error approving task:", error);
    throw new Error("Error approving task");
  }

}
export async function transferTask(taskId, user) {
  try {
    await db.runTransaction(async (transaction) => {
      const taskRef = db.collection("tasks").doc(taskId);
      const taskDoc = await transaction.get(taskRef);
      if (!taskDoc.exists) {
        throw new Error("Task not found");
      }
      const taskData = taskDoc.data();
      taskData.assignedTo = user;
      transaction.update(taskRef, taskData);
    }
    );
    return { status: 200, message: "Task transferred successfully" };
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
