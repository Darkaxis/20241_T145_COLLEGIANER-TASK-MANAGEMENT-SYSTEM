import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a Nodemailer transporter using SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Function to send the email with the OAuth link
async function sendOAuthLink(email, link) {
    if (!email || !email.endsWith('buksu.edu.ph')) {
        return 400 ;
    }

  
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Complete Your Registration',
        text: `Please complete your registration by clicking the following link: ${link}`,
        html: `<!DOCTYPE html>
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
            background: linear-gradient(135deg, #1E293B 0%, #334155 100%);
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
            <img src="https://cdn.discordapp.com/attachments/536052278797402149/1308966763026845707/Collegianer_logo.png?ex=673fddcb&is=673e8c4b&hm=56f4b37ed3b07f30eb2e5e1fb94f51e5989344cee7c0ec7d62c943f8c6ada563&" alt="Collegianer">
        </div>
        <h1>Task Management System</h1>
        <p>Greetings, you have been invited to use the task management system of Collegianer.</p>
        <p>To activate your account please click the button below</p>
        <a href="${link}" class="button">Accept Invitation</a>
    </div>
</body>

</html>`
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return { status: 200, message: 'OAuth link sent successfully' };
    } catch (error) {
        console.error('Error sending email:', error);
        return { status: 500, message: 'Error sending email' };
    }
}
async function forgotPassword(email, link) {
    if (!email || !email.endsWith('buksu.edu.ph')) {
        return 400 ;
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Reset Pass'}
    }
    
export default { sendOAuthLink,forgotPassword };