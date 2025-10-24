import nodemailer from 'nodemailer';
import env from '../env'

// Configure the SMTP transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: env.GMAIL_USER,
        pass: env.GMAIL_PWD,
    },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
    const mailOptions = {
        from: 'labalette.antoine@gmail.com',
        to,
        subject,
        html
    };

    if (env.NODE_ENV === 'development') {
        console.log('Email sent (dev mode):', mailOptions);
        return;
    }

    const info = await transporter.sendMail(mailOptions);
    return info;
};
