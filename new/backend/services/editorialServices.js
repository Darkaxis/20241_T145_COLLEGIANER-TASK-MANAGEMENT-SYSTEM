
import dotenv from 'dotenv';
import { google } from 'googleapis';
import oauth2Client from '../utils/oauthClient.js'; // Ensure shared OAuth client is imported
import db from '../utils/firestoreClient.js'; // Ensure shared Firestore client is imported

dotenv.config();




// Function to get user by email
export async function getUserByEmail(email) {
    const userSnapshot = await db.collection('users').where('email', '==', email).get();
    if (userSnapshot.empty) {
        return null;
    }
    return userSnapshot.docs[0].data();
}



// Function to get details of an admin user
export async function getEditorDetails(editorId) {
    const userDoc = await db.collection('users').doc(editorId).get();
    if (!userDoc.exists) {
        throw new Error('User not found');
    }
    return userDoc.data();
}




export default {
    getEditorDetails,
    getUserByEmail,
    
};