import admin from "firebase-admin";

import dotenv from "dotenv";
import { google } from "googleapis";
import oauth2Client from "../utils/passport.js"; // Ensure shared OAuth client is imported
import db from "../utils/firestoreClient.js"; // Ensure shared Firestore client is imported
import { encrypt, decrypt } from '../utils/encrypt.js';


dotenv.config();

// Function to get user profile information from Google People API
export async function getUserProfile(accessToken) {
  try {
    oauth2Client.setCredentials(accessToken);
    const people = google.people({ version: "v1", auth: oauth2Client });
    const response = await people.people.get({
      resourceName: "people/me",
      personFields: "names,emailAddresses,photos",
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      // Handle token expiration and refresh token logic here
      console.error("Access token expired. Refreshing token...");
      try {
        const newTokens = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(newTokens.credentials);
        const people = google.people({ version: "v1", auth: oauth2Client });
        const response = await people.people.get({
          resourceName: "people/me",
          personFields: "names,emailAddresses,photos",
        });
        return response.data;
      } catch (refreshError) {
        console.error("Error refreshing access token:", refreshError);
        throw new Error("Error refreshing access token");
      }
    } else {
      console.error("Error fetching user profile:", error);
      throw new Error("Error fetching user profile from Google People API");
    }
  }
}

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
        disabled: userData.disabled || false,
    };
  } catch (error) {
    console.error("Error getting user by email:", error);
    throw new Error("Error getting user by email");
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
          disabled: userData.disabled || false,
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
  userData.disabled = disabled;

  await userDoc.ref.update(userData);
  return true;
}
catch (error) {
  console.error("Error updating user role:", error);
  throw new Error("Error updating user role");
}
}

export async function getLogs(){
  try {
    const logs = await db.collection("logs").get();
    if (logs.empty) {
        return [];
    }

    return logs.docs.map((doc) => {
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



export default {

  getUserProfile,
  getUserByEmail,
getAllUsers,
updateUser,
getLogs,
logAction,

};
