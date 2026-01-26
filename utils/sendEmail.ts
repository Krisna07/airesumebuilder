import nodemailer from "nodemailer";
import { validate } from "deep-email-validator";

// Create a transporter using Ethereal test credentials.
// For production, replace with your actual SMTP server details.



export const createTransporter = (auth: { user: string, pass: string }) => nodemailer.createTransport({
    host: "smtp.zoho.com.au",
    port: 465,
    secure: true, // Use true for port 465, false for port 587
    auth: auth
});


export class EmailService {
    static async ValidateEmail(email: string) {
        return validate(email);
    }

    static async sendVerificationCode(email: string, name: string, code: string) {
        const receiverEmail = email;

        // Validate the email
        const isEmailValid = await validate(receiverEmail);
        if (!isEmailValid.valid) {
            console.error("Invalid email address:", isEmailValid.reason);
            return;
        }

        const senderEmail = "authentication@airesumecraft.xyz";

        // Email content
        const subject = "Welcome to AiResumeCraft!";
        const plainText = `
Hello ${name},

Your authentication code is: ${code}

Please use this code to complete your registration process. If you did not request this email, please ignore it.

Best regards,
The AireSumeCraft Team
        `;

        const htmlContent = `
<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
    <h2>Welcome to AireSumeCraft, ${name}!</h2>
    <p><strong>Your authentication code is:</strong></p>
    <div style="font-size: 20px; font-weight: bold; color: #4CAF50; margin: 10px 0;">${code}</div>
    <p>Please use this code to complete your registration process.</p>
    <p>If you did not request this email, please ignore it.</p>
    <br />
    <p>Best regards,</p>
    <p><strong>The AiResumeCraft Team</strong></p>
</div>
        `;

        // Send the email
        const authTransporter = createTransporter({
            user: process.env.ZOHO_EMAIL || "authentication@airesumecraft.xyz",
            pass: process.env.ZOHO_PASSWORD || "Kr!shn@19981",
        })
        const info = await authTransporter.sendMail({
            from: `"AiResumeCraft Team" <${senderEmail}>`,
            to: receiverEmail,
            subject,
            text: plainText,
            html: htmlContent,
        });

        console.log("Message sent:", info.messageId);
        return info;
    }

    static async sendPasswordReset(email: string, code: string) {
        const isEmailValid = await validate(email);
        if (!isEmailValid.valid) {
            console.error("Invalid email address:", isEmailValid.reason);
            return;
        }
        const senderEmail = "authentication@airesumecraft.xyz";
        // Email content
        const subject = "Password Reset Request Code";
        const plainText = `
Hello,

Your password reset code is: ${code}

Please use this code to reset your password. If you did not request this email, please ignore it.

Best regards,
The AireSumeCraft Team
        `;

        const htmlContent = `
<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
    <h2>Hi three</h2>
    <p><strong>Your Password reset code is:</strong></p>
    <div style="font-size: 20px; font-weight: bold; color: #4CAF50; margin: 10px 0;">${code}</div>
    <p>Please use this code to authenticate yourself.</p>
    <p>If you did not request this email, please ignore it.</p>
    <br />
    <p>Best regards,</p>
    <p><strong>The AiResumeCraft Team</strong></p>
</div>
        `;

        // Send the email
        const authTransporter = createTransporter({
            user: process.env.ZOHO_EMAIL,
            pass: process.env.ZOHO_PASSWORD,
        })
        const info = await authTransporter.sendMail({
            from: `"AiResumeCraft Support" <${senderEmail}>`,
            to: email,
            subject,
            text: plainText,
            html: htmlContent,
        });

        console.log("Message sent:", info.messageId);
        return info;

    }

    static async sendEmail(email: string, subject: string, plainText: string, htmlContent: string) {
        const receiverEmail = email;
        // Validate the email
        const isEmailValid = await validate(receiverEmail);
        if (!isEmailValid.valid) {
            console.error("Invalid email address:", isEmailValid.reason);
            return;
        }

        const senderEmail = "noreply@airesumecraft.xyz";
        // Send the email
        const emailTransporter = createTransporter({
            user: "noreply@airesumecraft.xyz",
            pass: "Password123!",
        })
        const info = await emailTransporter.sendMail({
            from: `"AiResumeCraft" <${senderEmail}>`,
            to: receiverEmail,
            subject,
            text: plainText,
            html: htmlContent,
        });

        console.log("Message sent:", info.messageId);
        return info;
    }


}
