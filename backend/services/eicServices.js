import { configDotenv } from "dotenv";
import admin from 'firebase-admin';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Load environment variables
configDotenv();

// Initialize Firebase Admin SDK
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

const db = admin.firestore();

// Function to create a new admin user
export async function createAdmin(adminData) {
    if (!adminData) {
        return { status: 400, message: 'adminData is undefined' };
    }

    const { username, password } = adminData;

    // Check if the username already exists
    const existingAdminSnapshot = await db.collection('admins').where('username', '==', username).get();
    if (!existingAdminSnapshot.empty) {
        return { status: 400, message: 'Username already exists' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = {
        username,
        password: hashedPassword
    };
    await db.collection('admins').add(newAdmin);
    return { status: 201, message: 'Admin created successfully' };
}

// Function to authenticate an admin user
async function authenticateAdmin(username, password) {
    const adminSnapshot = await db.collection('admins').where('username', '==', username).get();
    if (adminSnapshot.empty) {
        throw new Error('Admin not found');
    }
    const adminData = adminSnapshot.docs[0].data();
    const isPasswordValid = await bcrypt.compare(password, adminData.password);
    if (!isPasswordValid) {
        throw new Error('Invalid password');
    }
    const token = jwt.sign({ id: adminSnapshot.docs[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return token;
}

// Function to get details of an admin user
async function getAdminDetails(adminId) {
    const adminDoc = await db.collection('admins').doc(adminId).get();
    if (!adminDoc.exists) {
        throw new Error('Admin not found');
    }
    return adminDoc.data();
}

function logoutAdmin() {
    // Invalidate the token on the client side
    return true;
}

function addUser(userData) {
    // Add user
}

export default { createAdmin, authenticateAdmin, getAdminDetails, logoutAdmin, addUser };