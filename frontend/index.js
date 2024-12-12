import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';
import cors from 'cors';
dotenv.config();

const httpsOptions = {
    key: fs.readFileSync('./certs/localhost-key.pem'),
    cert: fs.readFileSync('./certs/localhost-cert.pem')
};

// Get the file URL and directory name
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors());

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '/assets')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/login/index.html'));
});

// Add these new routes for staff
app.get('/staff/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/staff/staff-dashboard.html'));
});

app.get('/staff/projects', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/staff/staff-projects.html'));
});

app.get('/staff/archive', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/staff/staff-archive.html'));
});

// Existing routes
app.get('/eic/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/eic/eic-dashboard.html'));
});
app.get('/eic/accounts', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/eic/eic-accounts.html'));
});
app.get('/eb/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/eb/eb-dashboard.html'));
});
app.get('/eic/projects', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/eic/eic-projects.html'));
});
app.get('/eic/archive', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/eic/eic-archive.html'));
});
app.get('/eic/activitylog', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/eic/eic-activitylog.html'));
});
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/register/welcome.html'));
});

// EB routes
app.get('/eb/projects', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/eb/eb-projects.html'));
});

app.get('/eb/archive', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/eb/eb-archive.html'));
});

// Adviser routes
app.get('/adviser/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/adviser/adviser-dashboard.html'));
});

app.get('/adviser/projects', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/adviser/adviser-projects.html'));
});

app.get('/adviser/archive', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/adviser/adviser-archive.html'));
});

app.get('/adviser/accounts', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/adviser/adviser-accounts.html'));
});

// Start the server
https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`Server is running on https://localhost:${PORT}`);
});