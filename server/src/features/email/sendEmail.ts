import env from "@config/env";
import { Resend } from "resend";

// Initialize Resend client (uses HTTP API, not SMTP!)
const resend = new Resend(env.RESEND_API_KEY);

export const sendEmail = async (to: string, subject: string, html: string) => {
    // In development, just log
    if (env.NODE_ENV === "development") {
        console.log("Email sent (dev mode):", { to, subject, html });
        return { success: true, id: "dev-mock-id" };
    }

    try {
        // Resend API call (HTTP-based, no SMTP ports!)
        const data = await resend.emails.send({
            from: "onboarding@resend.dev", // Use your verified domain
            to: to,
            subject: subject,
            html: html,
        });

        console.log("Email sent successfully:", data);
        return data;
    } catch (error) {
        console.error("Email sending failed:", error);
        throw error;
    }
};
