import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '/assets')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/Login Page/index.html'));
});
app.get('/eic/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '/EIC-DASHBOARD/eic-dashboard.html'));
});



// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});