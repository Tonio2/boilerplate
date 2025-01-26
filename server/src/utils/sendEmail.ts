import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// TODO: Use a real email service like SendGrid or Mailgun

dotenv.config();
if (!process.env.GMAIL_PWD) {
    throw new Error('GMAIL_PWD is not defined in environment variables');
}

// Configure the SMTP transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'labalette.antoine@gmail.com',
        pass: process.env.GMAIL_PWD,
    },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
    const mailOptions = {
        from: 'labalette.antoine@gmail.com',
        to,
        subject,
        html
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
};
