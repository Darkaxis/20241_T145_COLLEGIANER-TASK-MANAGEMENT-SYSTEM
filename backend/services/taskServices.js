import admin from "firebase-admin"; // Ensure shared OAuth client is imported
import db from "../utils/firestoreClient.js";
import googleTaskServices from "./google/googleTaskServices.js";
import googleCalendarServices from "./google/googleCalendarServices.js";
import {encrypt, decrypt} from "../utils/encrypt.js";
import { assign } from "nodemailer/lib/shared/index.js";

async function getUser(email){
  
    const userSnapshot = await db
        .collection("users")
        .where("emailSearch", "==", email.toLowerCase())
        .get();
  
    if (userSnapshot.empty) {
        throw new Error("User not found");
    }
  
    const userData = userSnapshot.docs[0].data();
    return decrypt(userData.name)

}


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
    deadline.setHours(23, 59, 59, 999);

    const isoDeadline = new Date(deadline.toLocaleString('en-US', {
      timeZone: 'Asia/Manila'
    })).toISOString().replace(/\.\d{3}Z$/, '+08:00');

    // Encrypt sensitive data
    taskData.deadline = isoDeadline;
    const encryptedTask = {
      taskName: encrypt(taskData.taskName),
      description: encrypt(taskData.description),
      assignedTo: encrypt(taskData.assignedTo),
      assignedBy: encrypt(taskData.assignedBy),
      category: encrypt(taskData.category),
      status: encrypt(taskData.status),
      privacy: encrypt(taskData.privacy),
      link: encrypt(taskData.link || ''),
      deadline: encrypt(isoDeadline),
      // Non-encrypted metadata
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      version: 1,
    };

    const result = await db.runTransaction(async (transaction) => {
      const taskRef = db.collection("tasks").doc();

      try {
        const googleTask = await googleTaskServices.addTaskToGoogleTasks(taskData, userEmail);
        const calendarEvent = await googleCalendarServices.addEventToGoogleCalendar(taskData, userEmail);

        const taskWithIds = {
          ...encryptedTask,
          googleTaskId: googleTask.googleTaskId,
          googleCalendarEventId: calendarEvent.googleCalendarEventId
        };

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
    
  
        // Map over tasks and wait for all promises to resolve
    const tasks = await Promise.all(
        tasksSnapshot.docs.map(async (doc) => {
            const taskData = doc.data();
            const assignedTo = await getUser(decrypt(taskData.assignedTo));  
 
            return {
                id: doc.id,
                taskName: decrypt(taskData.taskName),
                description: decrypt(taskData.description),
                assignedTo: assignedTo,
                category: decrypt(taskData.category),
                status: decrypt(taskData.status),
                privacy: decrypt(taskData.privacy),
                link: decrypt(taskData.link),
                deadline: formatDeadline(decrypt(taskData.deadline)),
                // Non-encrypted fields
                createdAt: taskData.createdAt,
                updatedAt: taskData.updatedAt,
                version: taskData.version,
                googleTaskId: taskData.googleTaskId,
                googleCalendarEventId: taskData.googleCalendarEventId
            };
        })
    );
    
    return { 
      status: 200, 
      message: "Tasks retrieved successfully", 
      tasks 
    };
  } catch (error) {
    console.error("Error getting tasks:", error);
    throw new Error("Error getting tasks");
  }
}

async function getTasksForUser(email) {
  try {
    // Get all tasks since we can't query encrypted fields
    const tasksSnapshot = await db.collection("tasks").get();
    const tasks = [];

    // Iterate through tasks and decrypt
    for (const doc of tasksSnapshot.docs) {
      const taskData = doc.data();
      const decryptedAssignedTo = decrypt(taskData.assignedTo);
      const assignedTo = await getUser(decrypt(taskData.assignedTo));  
      
      // Only include tasks assigned to this user
      if (decryptedAssignedTo.toLowerCase() === email.toLowerCase()) {
        tasks.push({
          id: doc.id,
          taskName: decrypt(taskData.taskName),
          description: decrypt(taskData.description),
          assignedTo: assignedTo,
          category: decrypt(taskData.category),
          status: decrypt(taskData.status),
          privacy: decrypt(taskData.privacy),
          link: decrypt(taskData.link),
          deadline: formatDeadline(decrypt(taskData.deadline)),
          // Non-encrypted fields
          createdAt: taskData.createdAt,
          updatedAt: taskData.updatedAt,
          version: taskData.version,
          googleTaskId: taskData.googleTaskId,
          googleCalendarEventId: taskData.googleCalendarEventId
        });
      }
    }

    return {
      status: 200,
      message: "Tasks retrieved successfully",
      tasks
    };

  } catch (error) {
    console.error("Error getting tasks:", error);
    throw new Error("Error getting tasks");
  }
}
// Function to edit a task
async function editTask(taskId, taskData) {
  const deadline = new Date(taskData.deadline);

  deadline.setHours(23, 59, 59, 999); // Set to end of day
  // Convert to Manila timezone RFC 3339 format for Google APIs
  const manilaOffset = '+08:00'; // Manila timezone offset
  const isoDeadline = new Date(deadline.toLocaleString('en-US', {
      timeZone: 'Asia/Manila'
  })).toISOString()
      .replace(/\.\d{3}Z$/, manilaOffset);
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
      console.log(updatedTask);
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

    googleTaskServices.googleTaskStatusDone(taskId);

    return { status: 200, message: "Task approved successfully" };
  } catch (error) {
    console.error("Error approving task:", error);
    throw new Error("Error approving task");
  }
}
export async function archiveTask(taskId, userId) {
  try {
    // Use Firestore transaction
    await db.runTransaction(async (transaction) => {
      const taskRef = db.collection("tasks").doc(taskId);
      const taskDoc = await transaction.get(taskRef);

      if (!taskDoc.exists) {
        throw new Error("Task not found");
      }

      const taskData = taskDoc.data();
      
      // Get current archived users array or create new one
      const archivedBy = taskData.archivedBy || [];

      // Check if user already archived
      if (archivedBy.includes(userId)) {
        throw new Error("Task already archived by user");
      }

      // Add user to archived array
      transaction.update(taskRef, {
        archivedBy: [...archivedBy, userId],
        lastArchivedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    return { status: 200, message: "Task archived successfully" };
  } catch (error) {
    console.error("Error archiving task:", error);
    throw new Error("Error archiving task");
  }
}
export async function getArchivedTask(taskId, userId) {
  try {
    const taskRef = db.collection("tasks").doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      throw new Error("Task not found");
    }

    const taskData = taskDoc.data();
    const archivedBy = taskData.archivedBy || [];

    // Check if task is archived by this user
    if (!archivedBy.includes(userId)) {
      throw new Error("Task not archived by user");
    }

    return {
      id: taskId,
      ...taskData,
      isArchived: true,
      archivedAt: taskData.lastArchivedAt
    };

  } catch (error) {
    console.error("Error getting archived task:", error);
    throw error;
  }
}

export async function getAllArchivedTasks(userId) {
  try {
    const tasksSnapshot = await db.collection("tasks")
      .where("archivedBy", "array-contains", userId)
      .orderBy("lastArchivedAt", "desc")
      .get();

    const archivedTasks = [];
    tasksSnapshot.forEach(doc => {
      archivedTasks.push({
        id: doc.id,
        ...doc.data(),
        isArchived: true
      });
    });

    return archivedTasks;

  } catch (error) {
    console.error("Error getting archived tasks:", error);
    throw new Error("Error getting archived tasks");
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
  archiveTask,

};
