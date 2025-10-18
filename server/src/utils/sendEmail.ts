import nodemailer from 'nodemailer';
import env from '../env'

// Configure the SMTP transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'labalette.antoine@gmail.com',
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

    const info = await transporter.sendMail(mailOptions);
    return info;
};
