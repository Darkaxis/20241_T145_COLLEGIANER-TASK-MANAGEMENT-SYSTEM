import admin from "firebase-admin";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
 // Ensure shared OAuth client is imported
import db from "../utils/firestoreClient.js"; // Ensure shared Firestore client is imported



dotenv.config();

export async function authenticateUser(email, password) {
    const userSnapshot = await db
      .collection("users")
      .where("email", "==", email)
      .get();
    if (userSnapshot.empty) {
      throw new Error("User not found");
    }
    
    const userData = userSnapshot.docs[0].data();
    const isPasswordValid = await bcrypt.compare(password, userData.password);
    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }
    console.log(userData);
    const token = jwt.sign(
      {
        id: userSnapshot.docs[0].id,
        name: userData.name,
        email: userData.email,
        profile: userData.profile,
        role: userData.role, 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    return token;
  }

export async function getUser(email) {
    const userSnapshot = await db
      .collection("users")
      .where("email", "==", email)
      .get();
    if (userSnapshot.empty) {
      throw new Error("User not found");
    }
    return userSnapshot.docs[0].data();
  }


  
export default{
    authenticateUser, getUser
}