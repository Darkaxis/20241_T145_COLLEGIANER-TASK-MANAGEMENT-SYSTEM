import { google } from 'googleapis';
import oAuth2Client from '../../utils/oauth2Client.js';
import db from '../../utils/firestoreClient.js';



async function getUserTokens(email) {
  try {
    const userSnapshot = await db
      .collection('users')
      .where('emailSearch', '==', email.toLowerCase())
      .get();

    if (userSnapshot.empty) {
      throw new Error('User not found');
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    return {
      access_token: userData.token,
      refresh_token: userData.refreshToken
    };
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
    const startDateTime = new Date().toISOString().replace(/\.\d{3}Z$/, '+08:00');
    const event = {
      summary: eventData.taskName,
      description: eventData.description,
      start: {
        dateTime: startDateTime,
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
    
    return {
      ...eventData,
      googleCalendarEventId: response.data.id
    };
  } catch (error) {
    console.error('Error adding event:', error);
    throw error;
  }
}

async function updateGoogleCalendarEvent(eventData, email) {
  if (!eventData.googleCalendarEventId) {
    throw new Error('Calendar Event ID is required for update');
  }

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

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventData.googleCalendarEventId,
      requestBody: event,
    });

    return {
      ...eventData,
      googleCalendarEventId: response.data.id
    };
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
}

async function deleteGoogleCalendarEvent(eventData, email) {
  if (!eventData.googleCalendarEventId) {
    throw new Error('Calendar Event ID is required for deletion');
  }

  try {
    const tokens = await getUserTokens(email);
    oAuth2Client.setCredentials(tokens);

    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventData.googleCalendarEventId,
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}

export default { addEventToGoogleCalendar, updateGoogleCalendarEvent, deleteGoogleCalendarEvent };