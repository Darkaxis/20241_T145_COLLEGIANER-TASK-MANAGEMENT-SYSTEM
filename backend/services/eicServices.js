import admin from "firebase-admin";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { google } from "googleapis";
import oauth2Client from "../utils/oauthClient.js"; // Ensure shared OAuth client is imported
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
      const people = google.people({ version: "v1", auth: oauth2Client });
      const response = await people.people.get({
        resourceName: "people/me",
        personFields: "names,emailAddresses,photos",
      });
      return response.data;
    } else {
      console.error("Error fetching user profile:", error);
      throw new Error("Error fetching user profile from Google People API");
    }
  }
}

// Function to get user by email
export async function getUserByEmail(email) {
  const userSnapshot = await db
      .collection("users")
      .where("email", "==", email)
      .get();
      if (userSnapshot.empty) {
        throw new Error("User not found");
      }
      
  return { id: userSnapshot.docs[0].id, ...userSnapshot.docs[0].data() };

}




// Function to add a new user
export async function addUser(userData) {
  const { email, name, role, profile , password} = userData;

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  // Check if the email already exists
  const existingUserSnapshot = await db
    .collection("users")
    .where("email", "==", email)
    .get();
  if (!existingUserSnapshot.empty) {
    return { status: 400, message: "Email already exists" };
  }

  const newUser = {
    email,
    name,
    role,
    password: hashedPassword,
    profile,
  };
  await db.collection("users").add(newUser);
  return { status: 201, message: "User added successfully" };
}

export async function getAllUsers(email) {
  //get both users and admin except the current user
  const adminSnapshot = await db
    .collection("admins")
    .where("email", "!=", email)
    .get();
  const usersSnapshot = await db.collection("users").get();
  if (usersSnapshot.empty) {
    return [];
  }

  const allUsers = [];

  adminSnapshot.forEach((doc) => {
    allUsers.push({ id: doc.id, ...doc.data() });
  });

  usersSnapshot.forEach((doc) => {
    if (doc.data().email !== email) {
      allUsers.push({ id: doc.id, ...doc.data()});
    }
  });

  return allUsers;
}

export function logoutAdmin() {
  // Implement token invalidation if necessary
}

export default {

  getUserProfile,
  getUserByEmail,
  addUser,
  getAllUsers,
  logoutAdmin,
};
