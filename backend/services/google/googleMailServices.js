import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
);

// Set the credentials (you should have a refresh token stored)
oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

async function sendOAuthLink(email, link) {
    if (!email || !email.endsWith('buksu.edu.ph')) {
        return 400;
    }

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    const messageParts = [
        'From: ' + process.env.EMAIL_USER,
        'To: ' + email,
        'Subject: Complete Your Registration',
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Management System Invitation</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            height: 100vh;
            padding: 0;
            background: linear-gradient(120deg, #fdfbfb 0%, #f9f7ff 100%) fixed;
            background-size: 400% 400%;
            color: #1e293b;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: gradientBG 15s ease infinite;
            overflow: hidden;
        }
        
        @keyframes gradientBG {
            0% {
                background-position: 0% 50%;
            }
            50% {
                background-position: 100% 50%;
            }
            100% {
                background-position: 0% 50%;
            }
        }
        
        .container {
            max-width: 480px;
            width: calc(100% - 32px);
            margin: 0 auto;
            padding: 32px 28px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 20px 40px -10px rgba(99, 102, 241, 0.15);
            backdrop-filter: blur(20px);
            position: relative;
            overflow: hidden;
        }
        
        .container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
            background-size: 200% 200%;
            animation: gradientBorder 15s ease infinite;
        }
        
        @keyframes gradientBorder {
            0% {
                background-position: 0% 50%;
            }
            50% {
                background-position: 100% 50%;
            }
            100% {
                background-position: 0% 50%;
            }
        }
        
        .logo {
            margin-bottom: 32px;
            text-align: center;
        }
        
        .logo img {
            max-width: 100px;
            height: auto;
            filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.3))
        }
        
        h1 {
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 16px 0;
            background: linear-gradient(135deg,rgb(243, 243, 243) 0%, #334155 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-align: center;
        }
        
        p {
            color: #64748B;
            margin-bottom: 16px;
            font-size: 15px;
            line-height: 1.5;
            text-align: center;
            max-width: 400px;
            margin-left: auto;
            margin-right: auto;
        }
        
        p:last-of-type {
            margin-bottom: 24px;
        }
        
        .button {
            display: block;
            width: fit-content;
            margin: 0 auto;
            padding: 12px 32px;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 15px;
            transition: all 0.3s ease;
            box-shadow: 0 8px 16px -4px rgba(99, 102, 241, 0.3);
        }
        
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 20px -4px rgba(99, 102, 241, 0.4);
            background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
        }
        
        @media (max-width: 480px) {
            .container {
                padding: 24px 20px;
            }
            h1 {
                font-size: 24px;
            }
            p {
                font-size: 14px;
            }
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="logo">
            <img src="https://idoxb68.sufydely.com/Collegianer%20logo.png" alt="Collegianer">
        </div>
        <h1>Task Management System</h1>
        <p>Greetings, you have been invited to use the task management system of Collegianer.</p>
        <p>To activate your account please click the button below</p>
        <a href="${link}" class="button">Accept Invitation</a>
    </div>
</body>

</html>`
    ];

    const message = messageParts.join('\n');

    const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    try {
        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });
        return 200;
    } catch (error) {
        console.error('Error sending email:', error);
        return 500;
    }
}

async function forgotPassword(email, link) {
    if (!email || !email.endsWith('buksu.edu.ph')) {
        return 400;
    }

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    const messageParts = [
        'From: ' + process.env.EMAIL_USER,
        'To: ' + email,
        'Subject: Reset Password',
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `<!DOCTYPE html>    
        <html lang="en">
        <head>
        <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            height: 100vh;
            padding: 0;
            background: linear-gradient(135deg, #f6f8ff 0%, #f0f4ff 100%) fixed;
            color: #1e293b;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        
        .container {
            max-width: 520px;
            width: calc(100% - 48px);
            margin: 0 auto;
            padding: 40px 32px;
            background: rgba(255, 255, 255, 0.98);
            border-radius: 24px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 20px 40px -10px rgba(99, 102, 241, 0.12), 0 0 0 1px rgba(99, 102, 241, 0.08);
            backdrop-filter: blur(24px);
            position: relative;
            overflow: hidden;
        }
        
        .container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 8px;
            background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 50%, #6366f1 100%);
        }
        
        .logo {
            margin-bottom: 36px;
            text-align: center;
        }
        
        .logo-text {
            font-family: "Old English Text MT", "Times New Roman", serif;
            font-size: 50px;
            font-weight: 400;
            background: linear-gradient(135deg, #000000 0%, #7c3aed 100%);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.02em;
        }
        
        h1 {
            font-size: 32px;
            font-weight: 800;
            margin: 0 0 24px 0;
            background: linear-gradient(135deg, #1E293B 0%, #334155 100%);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-align: center;
            letter-spacing: -0.02em;
        }
        
        p {
            color: #475569;
            margin-bottom: 20px;
            font-size: 16px;
            line-height: 1.6;
            text-align: center;
            max-width: 440px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .button-container {
            text-align: center;
            margin-top: 32px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .button {
            display: inline-block;
            padding: 14px 36px;
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white;
            text-decoration: none;
            border-radius: 14px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 8px 16px -4px rgba(99, 102, 241, 0.3), 0 0 0 2px rgba(99, 102, 241, 0.1);
            position: relative;
            overflow: hidden;
        }
        
        .button:hover {
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 20px 40px -8px rgba(99, 102, 241, 0.5), 0 0 0 2px rgba(99, 102, 241, 0.2);
            background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
        }
        
        .button::after {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient( 45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            transform: rotate(45deg);
            transition: 0.5s;
            opacity: 0;
        }
        
        .button:hover::after {
            opacity: 1;
            transform: rotate(45deg) translateX(100%);
        }
    </style>
</head>


<div class="container">
    <div class="logo">
        <img src="https://idoxb68.sufydely.com/Collegianer%20logo.png" alt="Collegianer">
    </div>
    <h1>Password Reset Request</h1>
    <p>You're receiving this email because you requested a password reset for your user account at Task Management System.</p>
    <p>Please click the button below to choose a new password:</p>
    <div class="button-container">
        <a href="${link}" class="button">Reset Password</a>
    </div>
    <p style="font-size: 14px; margin-top: 24px; color: #64748b;">If you didn't request this password reset, you can safely ignore this email.</p>
</div>


</html>`];

    const message = messageParts.join('\n');

    const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    try {
        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });
        return 200;
    } catch (error) {
        console.error('Error sending email:', error);
        return 500;
    }
    
}



export default { sendOAuthLink, forgotPassword };