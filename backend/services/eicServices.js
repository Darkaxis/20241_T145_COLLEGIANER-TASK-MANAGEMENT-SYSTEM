import admin from "firebase-admin";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { google } from "googleapis";
import oauth2Client from "../utils/passport.js"; // Ensure shared OAuth client is imported
import db from "../utils/firestoreClient.js"; // Ensure shared Firestore client is imported


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
    // Use Firestore transaction to ensure concurrency control
    const user = await db.runTransaction(async (transaction) => {
      const userSnapshot = await transaction.get(
        db.collection("users").where("email", "==", email)
      );
      if (userSnapshot.empty) {
        throw new Error("User not found");
      }
      const userDoc = userSnapshot.docs[0];
      return { id: userDoc.id, ...userDoc.data() };
    });

    return user;
  } catch (error) {
    console.error("Error getting user by email:", error);
    throw new Error("Error getting user by email");
  }
}

export async function addUser(userData) {
  const { email, name, role, profile, password, token, refreshToken } = userData;

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Use Firestore transaction to ensure concurrency control
  try {
    await db.runTransaction(async (transaction) => {
      // Check if the email already exists
      const existingUserSnapshot = await transaction.get(
        db.collection("users").where("email", "==", email)
      );
      
      if (!existingUserSnapshot.empty) {
        throw new Error("Email already exists");
      }

      const newUser = {
        email,
        name,
        role,
        token,
        refreshToken,
        password: hashedPassword,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        profile,
      };

      const userRef = db.collection("users").doc();
      transaction.set(userRef, newUser);
    });

    return { status: 201, message: "User added successfully" };
  } catch (error) {
    console.error("Error adding user:", error);
    if (error.message === "Email already exists") {
      return { status: 400, message: "Email already exists" };
    }
    throw new Error("Error adding user");
  }
}

// Function to get all users
export async function getAllUsers() {
  try {
    // Use Firestore transaction to ensure concurrency control
    const users = await db.runTransaction(async (transaction) => {
      const usersSnapshot = await transaction.get(db.collection("users"));
      if (usersSnapshot.empty) {
        return [];
      }

      // Exclude password from the response
      return usersSnapshot.docs.map((doc) => {
        const user = doc.data();
        delete user.password;
        return { id: doc.id, ...user };
      });
    });

    return users;
  } catch (error) {
    console.error("Error getting users:", error);
    throw new Error("Error getting users");
  }
}

async function updateUserRole(email, role) {
  try {
    await db.runTransaction(async (transaction) => {
      const userSnapshot = await transaction.get(
        db.collection("users").where("email", "==", email)
      );
      if (userSnapshot.empty) {
        throw new Error("User not found");
      }

      const userDoc = userSnapshot.docs[0];
      transaction.update(userDoc.ref, { role });
    });


    return true;
  } catch (error) {
    console.error("Error updating user role:", error);
    return false;
  }
}

export async function getLogs(){
    try {
        const logs = await db.collection("logs").get();
        if (logs.empty) {
            throw new Error("No logs found");
        }
        return logs.docs.map((doc) => doc.data());
    } catch (error) {
        console.error("Error getting logs:", error);
        throw new Error("Error getting logs");
    }
}



export default {

  getUserProfile,
  getUserByEmail,
  addUser,
getAllUsers,
updateUserRole,

};
