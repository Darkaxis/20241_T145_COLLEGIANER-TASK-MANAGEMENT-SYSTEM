
import admin from "firebase-admin";
import dotenv from "dotenv";
import { google } from "googleapis";
import db from "../utils/firestoreClient.js"; // Ensure shared Firestore client is imported
import { encrypt, decrypt } from '../utils/encrypt.js';


dotenv.config();



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

  export default { getAllUsers };   