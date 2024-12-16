import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import https from 'https';
import fs from 'fs';
import cors from 'cors';


const httpsOptions = {
    key: fs.readFileSync('./certs/localhost-key.pem'),
    cert: fs.readFileSync('./certs/localhost-cert.pem')
};

// Get the file URL and directory name
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 4000;
app.use(cors());

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '/assets')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/login/index.html'));
});

// New routes
app.get('/password_reset', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/login/passReset.html'));
});
app.get('/new_password', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/login/newPass.html'));
});

app.get('/new_password/confirm', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/login/resetConfirmation.html'));
});


// Add these new routes for staff
app.get('/staff/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/staff/staff-dashboard.html'));
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
app.get('/eic/archive', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/eic/eic-archive.html'));
});
app.get('/eic/activitylog', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/eic/eic-activitylog.html'));
});
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/register/welcome.html'));
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