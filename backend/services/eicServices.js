import admin from 'firebase-admin';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { google } from 'googleapis';

// Load environment variables
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
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
    });
}

const db = admin.firestore();

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
);

// Function to get user profile information from Google People API
export async function getUserProfile(accessToken) {
    try {
        oauth2Client.setCredentials({ access_token: accessToken });
        const people = google.people({ version: 'v1', auth: oauth2Client });
        const response = await people.people.get({
            resourceName: 'people/me',
            personFields: 'names,emailAddresses'
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw new Error('Error fetching user profile from Google People API');
    }
}

// Function to create a new admin user
export async function createAdmin(adminData) {
    if (!adminData) {
        return { status: 400, message: 'adminData is undefined' };
    }

    const { username, password, email } = adminData;

    // Check if the username already exists
    const existingAdminSnapshot = await db.collection('admins').where('username', '==', username).get();
    if (!existingAdminSnapshot.empty) {
        return { status: 400, message: 'Username already exists' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = {
        username,
        password: hashedPassword,
        email,
        name: adminData.name,
        accessToken: adminData.accessToken
    };
    await db.collection('admins').add(newAdmin);
    return { status: 201, message: 'Admin created successfully' };
}

// Function to authenticate an admin user
export async function authenticateAdmin(username, password) {
    const adminSnapshot = await db.collection('admins').where('username', '==', username).get();
    if (adminSnapshot.empty) {
        throw new Error('Admin not found');
    }
    const adminData = adminSnapshot.docs[0].data();
    const isPasswordValid = await bcrypt.compare(password, adminData.password);
    if (!isPasswordValid) {
        throw new Error('Invalid password');
    }
    const token = jwt.sign(
        { id: adminSnapshot.docs[0].id, name: adminData.name, email: adminData.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
    return token;
}

// Function to get details of an admin user
export async function getAdminDetails(adminId) {
    const adminDoc = await db.collection('admins').doc(adminId).get();
    if (!adminDoc.exists) {
        throw new Error('Admin not found');
    }
    return adminDoc.data();
}

export default {
    
    createAdmin,
    authenticateAdmin,
    getAdminDetails,
    getUserProfile
};