import express from 'express';
import bodyParser from 'body-parser';
import eicRoutes from './routes/eicRoutes.js'; // Import the admin routes
import editorialRoutes from './routes/editorialRoutes.js'; // Import the editorial routes
import oauthRoutes from './routes/oauthRoutes.js'; // Import the OAuth2 routes
import cors from 'cors';
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Middleware to parse JSON request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Use the admin routes
app.use('/eic', eicRoutes);
app.use('/eb', editorialRoutes);

// Use the OAuth2 routes
app.use('/google/oauth2', oauthRoutes);

app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});