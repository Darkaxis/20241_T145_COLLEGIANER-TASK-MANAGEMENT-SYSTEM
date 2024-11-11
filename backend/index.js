import express from 'express';
import bodyParser from 'body-parser';
import eicRoutes from './routes/eicRoutes.js'; // Import the admin routes
import editorialRoutes from './routes/editorialRoutes.js'; // Import the editorial routes
import oauthRoutes from './routes/oauthRoutes.js'; // Import the OAuth2 routes
import cors from 'cors';
import https from 'https';
import fs from 'fs';
const app = express();
const port = process.env.PORT;

// Enable CORS
app.use(cors());
const options = {
    key: fs.readFileSync('./certs/localhost-key.pem'),
    cert: fs.readFileSync('./certs/localhost-cert.pem')
};

// Middleware to parse JSON request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Use the admin routes
app.use('/api/v1/eic', eicRoutes);
app.use('/api/v1/eb', editorialRoutes);

// Use the OAuth2 routes
app.use('/api/v1/google/oauth2', oauthRoutes);

https.createServer(options, app).listen(port, () => {
    console.log(`Server is running on https://localhost:${port}`);
});