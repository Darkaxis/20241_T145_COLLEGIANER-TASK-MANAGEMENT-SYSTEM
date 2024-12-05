import { google } from 'googleapis';
import oAuth2Client from '../../utils/oauth2Client.js';
import db from '../../utils/firestoreClient.js'; // Assuming you have a Firestore client to get user tokens

async function getUserTokens(email) {
  try {
    const userSnapshot = await db.collection('users').where('email', '==', email).get();
    if (userSnapshot.empty) {
      throw new Error('User not found');
    }
    const userDoc = userSnapshot.docs[0];
    return {
      access_token: userDoc.data().token,
      refresh_token: userDoc.data().refreshToken
    }; // Assuming tokens are stored in the user document
  } catch (error) {
    console.error('Error getting user tokens:', error);
    throw new Error('Error getting user tokens');
  }
}

async function addEventToGoogleCalendar(eventData, email) {
  try {
    const tokens = await getUserTokens(email);
    oAuth2Client.setCredentials(tokens);

    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
    const event = {
      summary: eventData.taskName,
      description: eventData.description,
      start: {
        dateTime: eventData.createdAt,
        timeZone: 'Asia/Manila',
      },
      end: {
        dateTime: eventData.deadline,
        timeZone: 'Asia/Manila',
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });
    console.log('Event added to Google Calendar:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding event to Google Calendar:', error);
    throw new Error('Error adding event to Google Calendar');
  }
}

export default addEventToGoogleCalendar;