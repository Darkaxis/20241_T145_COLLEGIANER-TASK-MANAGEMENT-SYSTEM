import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';
dotenv.config();

const httpsOptions = {
    key: fs.readFileSync('./certs/localhost-key.pem'),
    cert: fs.readFileSync('./certs/localhost-cert.pem')
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '/assets')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/login/index.html'));
});
app.get('/eic/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/eic/eic-dashboard.html'));
});
app.get('/eic/accounts', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/eic/eic-accounts.html'));
});
app.get('/eb/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/eb/eb-dashboard.html'));
});

// Start the server
https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`Server is running on https://localhost:${PORT}`);
}  );