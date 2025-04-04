import admin from "firebase-admin";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import db from "../utils/firestoreClient.js";
import {encrypt, decrypt} from "../utils/encrypt.js";


dotenv.config();

export async function registerUser(userData, password) {
  
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = {
      email: encrypt(userData.email),
      emailSearch: userData.email.toLowerCase(),
      password: hashedPassword,
      name: encrypt(userData.name),
      profile: encrypt(userData.profile),
      refreshToken: userData.refreshToken,
      token: userData.accessToken,
      role: encrypt(userData.role),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      version: 1 
    };
    // chech if user already exists
    const existingUserSnapshot = await db
        .collection("users")
        .where("emailSearch", "==", userData.email.toLowerCase())
        .get();
    if (!existingUserSnapshot.empty) {
        return false; // User already exists
    }
    
    const userRef = await db.collection("users").add(user);

    return userRef.id;
}


export async function authenticateUser(email, password) {
    const userSnapshot = await db
      .collection("users")
      .where("emailSearch", "==", email.toLowerCase())
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
        role: decrypt(userData.role),
    };
}


export async function resetPassword(email, password) {

    const userSnapshot = await db
        .collection("users")
        .where("emailSearch", "==", email.toLowerCase())
        .get();
    if (userSnapshot.empty) {
        throw new Error("User not found");
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.collection("users").doc(userSnapshot.docs[0].id).update({
        password: hashedPassword
    });
}
// ...existing code...


export default {getUser, authenticateUser, registerUser, resetPassword};