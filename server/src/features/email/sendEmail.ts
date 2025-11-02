import nodemailer from 'nodemailer';

import env from '@config/env'

// Configure the SMTP transporter for Resend
const transporter = nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 465,
    secure: true,
    auth: {
        user: 'resend',
        pass: env.RESEND_API_KEY,
    },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
    const mailOptions = {
        from: 'onboarding@resend.dev', // Use Resend's default test domain or replace with your verified domain
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
