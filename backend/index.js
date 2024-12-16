import express from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import passport from './utils/passport.js'; // Import the configured Passport.js
import eicRoutes from './routes/eicRoutes.js'; // Import the admin routes
import editorialRoutes from './routes/editorialRoutes.js'; // Import the editorial routes
import staffRoutes from './routes/staffRoutes.js'; // Import the staff routes
import oauthRoutes from './routes/oauthRoutes.js'; // Import the OAuth2 routes
import loginRoutes from './routes/loginRoutes.js';
import cors from 'cors';
import https from 'https';
import fs from 'fs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
const port = process.env.PORT;

const corsOptions = {
  origin: 'https://localhost:4000',
  credentials: true // Allow credentials (cookies, authorization headers, etc.)
};

// Enable CORS
app.use(cors(corsOptions));

const options = {
  key: fs.readFileSync('./certs/localhost-key.pem'),
  cert: fs.readFileSync('./certs/localhost-cert.pem')
};

// Middleware to parse JSON request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize session handling
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Use the admin routes
app.use('/api/v1/eic', eicRoutes);
app.use('/api/v1/eb', editorialRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/login', loginRoutes);

// Use the OAuth2 routes
app.use('/api/v1/google/oauth2', oauthRoutes);

// Add security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

https.createServer(options, app).listen(port, () => {
  console.log(`Server is running on https://localhost:${port}`);
});