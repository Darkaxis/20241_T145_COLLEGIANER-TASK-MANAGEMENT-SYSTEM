import admin from "firebase-admin";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import db from "../utils/firestoreClient.js";
import {encrypt, decrypt} from "../utils/encrypt.js";

dotenv.config();




export async function authenticateUser(email, password) {
    const userSnapshot = await db
      .collection("users")
      .where("email", "==", encrypt(email))
      .get();
      
    if (userSnapshot.empty) {
      throw new Error("User not found");
    }
    
    const userData = userSnapshot.docs[0].data();
    const isPasswordValid = await bcrypt.compare(password, userData.password);
    
    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }

    // Decrypt user data for JWT
    const decryptedUserData = {
      name: decrypt(userData.name),
      email: decrypt(userData.email),
      profile: decrypt(userData.profile),
      role: decrypt(userData.role)
    };

    const token = jwt.sign(
      {
        id: userSnapshot.docs[0].id,
        ...decryptedUserData
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    return token;
}



// Update getUser to use non-encrypted field
export async function getUser(email) {
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
        role: decrypt(userData.role)
    };
}

console.log( await getUser('2201101373@student.buksu.edu.ph'))
export default {getUser, authenticateUser}