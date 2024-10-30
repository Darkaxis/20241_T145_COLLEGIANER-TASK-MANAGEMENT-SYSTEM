import admin from 'firebase-admin';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import oauth2Client from '../utils/oauthClient.js'; // Ensure shared OAuth client is imported

dotenv.config();

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            type: process.env.FIREBASE_TYPE,
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: process.env.FIREBASE_AUTH_URI,
            token_uri: process.env.FIREBASE_TOKEN_URI,
            auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
            client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
        }),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
        ignoreUndefinedProperties: true // Enable ignoring undefined properties
    });
}

const db = admin.firestore();

// Function to get user profile information from Google People API
export async function getUserProfile(accessToken) {
    try {
        oauth2Client.setCredentials({ access_token: accessToken });
        const people = google.people({ version: 'v1', auth: oauth2Client });
        const response = await people.people.get({
            resourceName: 'people/me',
            personFields: 'names,emailAddresses,photos'
        });
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 401) {
        
            const people = google.people({ version: 'v1', auth: oauth2Client });
            const response = await people.people.get({
                resourceName: 'people/me',
                personFields: 'names,emailAddresses,photos'
            });
            return response.data;
        } else {
            console.error('Error fetching user profile:', error);
            throw new Error('Error fetching user profile from Google People API');
        }
    }
}

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
    const adminDoc = await db.collection('users').doc(editorId).get();
    if (!adminDoc.exists) {
        throw new Error('Admin not found');
    }
    return adminDoc.data();
}




export default {
    getEditorDetails,
    getUserProfile,
    getUserByEmail,
    
};