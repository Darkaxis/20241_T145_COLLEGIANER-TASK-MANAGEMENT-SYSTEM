import admin from "firebase-admin";

import dotenv from "dotenv";
import { google } from "googleapis";
import oauth2Client from "../utils/passport.js"; // Ensure shared OAuth client is imported
import db from "../utils/firestoreClient.js"; // Ensure shared Firestore client is imported
import { encrypt, decrypt } from '../utils/encrypt.js';


dotenv.config();

// Function to get user by email
export async function getUserByEmail(email) {
  try {
    const userSnapshot = await db
        .collection("users")
        .where("emailSearch", "==", email.toLowerCase())
        .get();

    if (userSnapshot.empty) {
        throw new Error("User not found");
    }

    const userData = userSnapshot.docs[0].data();
    
    return {
        id: userSnapshot.docs[0].id,
        name: decrypt(userData.name),
        email: decrypt(userData.email),
        profile: decrypt(userData.profile),
        role: decrypt(userData.role),
    
    };
  } catch (error) {
    return null;
  }
}


// Function to get all users
export async function getAllUsers() {
  try {
    const users = await db.runTransaction(async (transaction) => {
      const usersSnapshot = await transaction.get(db.collection("users"));
      if (usersSnapshot.empty) {
        return [];
      }

      return usersSnapshot.docs.map((doc) => {
        const userData = doc.data();
        
        // Remove sensitive data
        delete userData.password;
        
        // Decrypt fields
        return {
          id: doc.id,
          email: decrypt(userData.email),
          name: decrypt(userData.name),
          role: decrypt(userData.role),
          profile: decrypt(userData.profile),
          // Non-encrypted fields
          emailSearch: userData.emailSearch,
          refreshToken: userData.refreshToken,
          token: userData.token,
          createdAt: userData.createdAt,
      
          version: userData.version
        };
      });
    });

    return users;
  } catch (error) {
    console.error("Error getting users:", error);
    throw new Error("Error getting users");
  }
}

export async function updateUser(email, role, disabled) { 
 try {  
  const userSnapshot = await db
      .collection("users")
      .where("emailSearch", "==", email.toLowerCase())
      .get();

  if (userSnapshot.empty) {
      throw new Error("User not found");
  }

  const userDoc = userSnapshot.docs[0];
  const userData = userDoc.data();
  userData.role = encrypt(role);
  

  await userDoc.ref.update(userData);
  return true;
}
catch (error) {
  console.error("Error updating user role:", error);
  throw new Error("Error updating user role");
}
}

export async function getLogs() {
  try {
    const logsSnapshot = await db.collection("logs")
      .orderBy("timestamp", "desc")
      .get();

    if (logsSnapshot.empty) {
      return [];
    }

    return logsSnapshot.docs.map((doc) => {
      const logData = doc.data();
      return {
        id: doc.id,
        type: decrypt(logData.type),
        action: decrypt(logData.action),
        user: decrypt(logData.user),
        timestamp: logData.timestamp,
      };
    });
  } catch (error) {
    console.error("Error getting logs:", error);
    throw new Error("Error getting logs");
  }
}
export async function logAction(action, user, type) {
    try {
        const log = {
            type: encrypt(type),
            action: encrypt(action),
            user: encrypt(user),
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection("logs").add(log);
    } catch (error) {
        console.error("Error logging action:", error);
        throw new Error("Error logging action");
    }
}
export async function getEditors() {
    try {
        const usersSnapshot = await db.collection("users").get();
        
        if (usersSnapshot.empty) {
            return [];
        }

        return usersSnapshot.docs
            .map((doc) => {
                const userData = doc.data();
                return {
                    id: doc.id,
                    email: decrypt(userData.email),
                    name: decrypt(userData.name),
                    profile: decrypt(userData.profile),
                    role: decrypt(userData.role),
                
                };
            })
            .filter((user) => {
                const decryptedRole = user.role;
                return decryptedRole === "Editor in Charge" || decryptedRole === "Editorial Board";
            });
    } catch (error) {
        console.error("Error getting editors:", error);
        throw new Error("Error getting editors");
    }
}


export default {

  getUserByEmail,
getAllUsers,
updateUser,
getLogs,
logAction,
getEditors,
};
