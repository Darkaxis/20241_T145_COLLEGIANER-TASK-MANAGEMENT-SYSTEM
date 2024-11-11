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
  
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Complete Your Registration',
        text: `Please complete your registration by clicking the following link: ${link}`,
        html: `<p>Please complete your registration by clicking the following link: <a href="${link}">Verify</a></p>`
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return { status: 200, message: 'OAuth link sent successfully' };
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Error sending email');
    }
}

export default { sendOAuthLink };