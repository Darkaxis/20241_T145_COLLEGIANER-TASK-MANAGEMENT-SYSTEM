import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '/assets')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/login/index.html'));
});
app.get('/eic/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '/eic/eic-dashboard.html'));
});
app.get('/eic/accounts', (req, res) => {
    res.sendFile(path.join(__dirname, '/eic/eic-accounts.html'));
});
app.get('/eb/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '/eb/eb-dashboard.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});