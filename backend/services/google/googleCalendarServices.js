
// add task to google calendar
const addTaskToGoogleCalendar = async (task) => {
    // try {
    //     const event = {
    //         summary: task.title,
    //         description: task.description,
    //         start: {
    //             dateTime: task.startTime,
    //             timeZone: 'Asia/Kolkata',
    //         },
    //         end: {
    //             dateTime: task.endTime,
    //             timeZone: 'Asia/Kolkata',
    //         },
    //         reminders: {
    //             useDefault: false,
    //             overrides: [
    //                 { method: 'email', minutes: 24 * 60 },
    //                 { method: 'popup', minutes: 10 },
    //             ],
    //         },
    //     };
    //     const calendar = await getGoogleCalendar();
    //     const response = await calendar.events.insert({
    //         calendarId: 'primary',
    //         resource: event,
    //     });
    //     console.log('Event created: %s', response.data.htmlLink);
    //     return response.data;
    // } catch (error) {
    //     console.error('Error adding task to google calendar:', error);
    //     return null;
    // }
};

// get google calendar
const getGoogleCalendar = async () => {
    // try {
    //     const auth = await getGoogleAuth();
    //     const calendar = google.calendar({ version: 'v3', auth });
    //     return calendar;
    // } catch (error) {
    //     console.error('Error getting google calendar:', error);
    //     return null;
    // }
};
