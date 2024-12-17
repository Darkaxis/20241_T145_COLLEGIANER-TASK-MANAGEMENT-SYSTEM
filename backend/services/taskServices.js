import admin from "firebase-admin"; // Ensure shared OAuth client is imported
import db from "../utils/firestoreClient.js";
import googleTaskServices from "./google/googleTaskServices.js";
import googleCalendarServices from "./google/googleCalendarServices.js";
import {encrypt, decrypt} from "../utils/encrypt.js";

async function getUser(name){
  const userSnapshot = await db.collection('users').get();
  if (userSnapshot.empty) {
      return null;
  }

  for (const doc of userSnapshot.docs) {
      const userData = doc.data();
      const decryptedName = decrypt(userData.name);
      if (decryptedName === name) {
          return decrypt(userData.email);
      }
  }

  return null;
  
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

async function createTask(taskData) {
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
      archived: false,
      // Non-encrypted metadata
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      version: 1,
    };

    const result = await db.runTransaction(async (transaction) => {
    const taskRef = db.collection("tasks").doc();

      const userEmail = await getUser(taskData.assignedTo);
      console.log(userEmail);

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

async function getAllTask(name) {
  try {
    const tasksSnapshot = await db.collection("tasks").get();

    const tasks = await Promise.all(
      tasksSnapshot.docs.map(async (doc) => {
        const taskData = doc.data();

        // Exclude task if archived by user
        if (taskData.archivedBy && taskData.archivedBy.includes(name)) {
          return null;
        }

        return {
          id: doc.id,
          taskName: decrypt(taskData.taskName),
          description: decrypt(taskData.description),
          assignedTo: decrypt(taskData.assignedTo),
          category: decrypt(taskData.category),
          status: decrypt(taskData.status),
          privacy: decrypt(taskData.privacy),
          link: decrypt(taskData.link),
          deadline: formatDeadline(decrypt(taskData.deadline)),
          createdAt: taskData.createdAt,
          updatedAt: taskData.updatedAt,
          version: taskData.version,
          googleTaskId: taskData.googleTaskId,
          googleCalendarEventId: taskData.googleCalendarEventId
        };
      })
    );

    const filteredTasks = tasks.filter(task => task !== null);

    return {
      status: 200,
      message: "Tasks retrieved successfully",
      tasks: filteredTasks
    };
  } catch (error) {
    console.error("Error getting tasks:", error);
    throw new Error("Error getting tasks");
  }
}

async function getTasksForUser(name) {
  try {
    // Get all tasks since we can't query encrypted fields
    const tasksSnapshot = await db.collection("tasks").get();
    const tasks = [];
    for (const doc of tasksSnapshot.docs) {
      const taskData = doc.data();
      const decryptedAssignedTo = decrypt(taskData.assignedTo);

      // Exclude task if archived by user
      const isArchivedByUser = taskData.archivedBy && taskData.archivedBy.includes(name);

      if (decryptedAssignedTo === name && !isArchivedByUser) {
        tasks.push({
          id: doc.id,
          taskName: decrypt(taskData.taskName),
          description: decrypt(taskData.description),
          assignedTo: decryptedAssignedTo,
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
    
      if (taskDataVersion && taskDataVersion != currentVersion) {
        console.log("Task has been updated by another transaction");
        throw new Error("Task has been updated by another transaction");
      }

      const updatedTask = {
        ...taskData,
        taskName: encrypt(taskData.taskName),
        description: encrypt(taskData.description),
        assignedTo: encrypt(taskData.assignedTo),
        category: encrypt(taskData.category),
        status: encrypt(taskData.status),
        privacy: encrypt(taskData.privacy),
        link: encrypt(taskData.link),
        deadline: encrypt(isoDeadline),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        version: currentVersion + 1, // Increment the version number
      };

      transaction.update(taskRef, updatedTask);
      console.log(updatedTask);
    });
    const taskDoc = await db.collection("tasks").doc(taskId).get();
    const task = taskDoc.data();
    const googleTaskId = task.googleTaskId;
    const googleCalendarEventId = task.googleCalendarEventId;
    
    const email = await getUser(decrypt(task.assignedTo));
      
      googleTaskServices.updateTaskInGoogleTasks(googleTaskId, taskData, email);
      //googleCalendarServices.updateEventInGoogleCalendars(googleCalendarEventId, taskData, email);
      

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
      //decrypting the task data
      const taskData = taskDoc.data();
      return {
        id: taskDoc.id,
        taskName: decrypt(taskData.taskName),
        description: decrypt(taskData.description),
        assignedTo: decrypt(taskData.assignedTo),
        assignedBy: decrypt(taskData.assignedBy),
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
  let taskData = null;
  try {
    // Use Firestore transaction to ensure concurrency control
    await db.runTransaction(async (transaction) => {
      const taskRef = db.collection("tasks").doc(taskId);
      const taskDoc = await transaction.get(taskRef);
      if (!taskDoc.exists) {
        throw new Error("Task not found");
      }
       taskData = taskDoc.data();
      // if (taskData.status !== "Checking") {
      //   throw new Error("Task is not pending approval");
      // }
      transaction.update(taskRef, { status: "Done", version: taskData.version + 1 });
    });
    
    const email = await getUser(decrypt(taskData.assignedTo));
    await googleTaskServices.googleTaskStatusDone(taskData.googleTaskId, email);
    return { status: 200, message: "Task approved successfully" };
  } catch (error) {
    console.error("Error approving task:", error);
    throw new Error("Error approving task");
  }
}
export async function archiveTask(taskId, name) {
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
      if (archivedBy.includes(name)) {
        throw new Error("Task already archived by user");
      }

      // Add user to archived array
      transaction.update(taskRef, {
        archivedBy: [...archivedBy, name],
        lastArchivedAt: admin.firestore.FieldValue.serverTimestamp(),
        version: taskData.version + 1
      });
    });

    return { status: 200, message: "Task archived successfully" };
  } catch (error) {
    console.error("Error archiving task:", error);
    throw new Error("Error archiving task");
  }
}
export async function getArchivedTask(taskId, name) {
  try {
    const taskRef = db.collection("tasks").doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      throw new Error("Task not found");
    }

    const taskData = taskDoc.data();
    const archivedBy = taskData.archivedBy || [];

    // Check if task is archived by this user
    if (!archivedBy.includes(name)) {
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

export async function getAllArchivedTasks(name) {
  try {
    const tasksSnapshot = await db.collection("tasks")
      .where("archivedBy", "array-contains", name)
      .orderBy("lastArchivedAt", "desc")
      .get();

    const archivedTasks = tasksSnapshot.docs.map(doc => {
      const taskData = doc.data();

      return {
        id: doc.id,
        taskName: decrypt(taskData.taskName),
        description: decrypt(taskData.description),
        assignedTo: decrypt(taskData.assignedTo),
        assignedBy: decrypt(taskData.assignedBy),
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
        googleCalendarEventId: taskData.googleCalendarEventId,
        isArchived: true,
        archivedAt: taskData.lastArchivedAt
      };
    });

    return archivedTasks;

  } catch (error) {
    console.error("Error getting archived tasks:", error);
    throw new Error("Error getting archived tasks");
  }
}
export async function submitTask(taskId, name) {
  try {
    // Use Firestore transaction to ensure concurrency control
    await db.runTransaction(async (transaction) => {
      const taskRef = db.collection("tasks").doc(taskId);
      const taskDoc = await transaction.get(taskRef);
      if (!taskDoc.exists) {
        throw new Error("Task not found");
      }
      const taskData = taskDoc.data();
      // if (decrypt(taskData.status) !== "In Progress") {
      //   console.log(decrypt(taskData.status));
      //   throw new Error("Task is not pending approval");
      // }
      if (decrypt(taskData.assignedTo) !== name) {
        throw new Error("Task is not assigned to user");
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
export async function unarchiveTask(taskId, name){
try{
  await db.runTransaction(async (transaction) => {
    const taskRef = db.collection("tasks").doc(taskId);
    const taskDoc = await transaction.get(taskRef);
    if (!taskDoc.exists) {
      throw new Error("Task not found");
    }
    const taskData = taskDoc.data();
    const archivedBy = taskData.archivedBy || [];
    const index = archivedBy.indexOf(name);
    if (index === -1) {
      throw new Error("Task not archived by user");
    }
    archivedBy.splice(index, 1);
    transaction.update(taskRef, {
      archivedBy,
      version: taskData.version + 1
    });
  } );
  return { status: 200, message: "Task unarchived successfully" };
}
catch (error) {
  console.error("Error approving task:", error);
  throw new Error("Error approving task");
}
}
export async function moveToInProgress(taskId, name) {
  try {
    const taskRef = db.collection('tasks').doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      throw new Error('Task not found');
    }
    const taskData = taskDoc.data();
    if (decrypt(taskData.status) !== 'To Do') {
      return { status: 400, message: 'Task status is not "To Do". Cannot move to "In Progress".' };
    }
    if (decrypt(taskData.assignedTo) !== name) {
      return { status: 400, message: 'Task is not assigned to user. Cannot move to "In Progress".' };
    }
    await taskRef.update({
      status: encrypt('In Progress')
    });

    return { status: 200, message: 'Task moved to In Progress successfully' };
  } catch (error) {
    console.error('Error moving task to In Progress:', error);
    return { status: 500, message: 'Error moving task to In Progress' };
  }
}

export default {
  createTask,
  getAllTask,
  getTasksForUser,
  editTask,
  deleteTask,
  getTask,
  approveTask,
  submitTask,
  transferTask,
  getArchivedTask,
  archiveTask,
  getAllArchivedTasks,
  unarchiveTask,
  moveToInProgress
};
