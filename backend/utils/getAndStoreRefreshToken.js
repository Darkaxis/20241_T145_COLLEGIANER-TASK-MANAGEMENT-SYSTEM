import { google } from 'googleapis';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import oauth2Client from './oauthClient.js';

dotenv.config();


const SCOPES = ['https://www.googleapis.com/auth/tasks'];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function getAccessToken() {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  rl.question('Enter the code from that page here: ', (code) => {
    oauth2Client.getToken(code, (err, token) => {
      if (err) {
        console.error('Error retrieving access token', err);
        return;
      }
      oauth2Client.setCredentials(token);
      console.log('Your refresh token is:', token.refresh_token);
      storeRefreshToken(token.refresh_token);
      rl.close();
    });
  });
}

function storeRefreshToken(refreshToken) {
  const envPath = path.resolve(__dirname, '.env');
  fs.appendFile(envPath, `\nGOOGLE_REFRESH_TOKEN=${refreshToken}`, (err) => {
    if (err) {
      console.error('Error writing to .env file', err);
    } else {
      console.log('Refresh token stored in .env file');
    }
  });
}

getAccessToken();