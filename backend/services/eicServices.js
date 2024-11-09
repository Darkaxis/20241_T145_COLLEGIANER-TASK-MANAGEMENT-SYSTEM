import admin from 'firebase-admin';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import oauth2Client from '../utils/oauthClient.js'; // Ensure shared OAuth client is imported
import db from '../utils/firestoreClient.js'; // Ensure shared Firestore client is imported

dotenv.config();




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

// Function to create a new admin user
export async function createAdmin(adminData) {
    if (!adminData || !adminData.email || !adminData.password) {
        return { status: 400, message: 'adminData, email, and password are required' };
    }

    const { password, email, name } = adminData;

    // Check if the email already exists
    const existingAdminSnapshot = await db.collection('admins').where('email', '==', email).get();
    if (!existingAdminSnapshot.empty) {
        return { status: 400, message: 'Email already exists' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = {
        password: hashedPassword,
        email,
        name,
        accessToken: adminData.accessToken,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await db.collection('admins').add(newAdmin);

    // Generate tokens
    const token = jwt.sign(
        { id: newAdmin.id, name: newAdmin.name, email: newAdmin.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
    return { status: 201, message: 'Admin created successfully', token };
}

// Function to authenticate an admin user
export async function authenticateAdmin(email, password) {
    const adminSnapshot = await db.collection('admins').where('email', '==', email).get();
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
        { expiresIn: '7d' }
    );
    console.log('Token:', token);
    return  token ;
}

// Function to get details of an admin user
export async function getAdminDetails(adminId) {
    const adminDoc = await db.collection('admins').doc(adminId).get();
    if (!adminDoc.exists) {
        throw new Error('Admin not found');
    }
    return adminDoc.data();
}

// Function to add a new user
export async function addUser(userData) {
    const { email, name, role, accessToken } = userData;

    // Check if the email already exists
    const existingUserSnapshot = await db.collection('users').where('email', '==', email).get();
    if (!existingUserSnapshot.empty) {
        return { status: 400, message: 'Email already exists' };
    }

    
    const newUser = {
        email,
        name,
        role,
        accessToken: accessToken,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await db.collection('users').add(newUser);
    return { status: 201, message: 'User added successfully' };
}


export function logoutAdmin() {
    // Implement token invalidation if necessary
}

export default {
    createAdmin,
    authenticateAdmin,
    getAdminDetails,
    getUserProfile,
    getUserByEmail,
    addUser,
    logoutAdmin
};