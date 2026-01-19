import nodemailer from "nodemailer";
import { validate } from "deep-email-validator";


// Create a transporter using Ethereal test credentials.
// For production, replace with your actual SMTP server details.
const transporter = nodemailer.createTransport({
    host: "smtp.zoho.com.au",
    port: 465,
    secure: true, // Use true for port 465, false for port 587
    auth: {
        user: "authentication@airesumecraft.xyz",
        pass: "Kr!shn@19981",
    }
});

export class EmailService {
    static async ValidateEmail(email: string) {
        return validate(email);
    }

    static async sendWelcomeEmail(email: string, name: string, code: string) {
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

Welcome to AiResumeCraft! We're excited to have you on board.

Your authentication code is: ${code}

Please use this code to complete your registration process. If you did not request this email, please ignore it.

Best regards,
The AireSumeCraft Team
        `;

        const htmlContent = `
<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
    <h2>Welcome to AireSumeCraft, ${name}!</h2>
    <p>We're excited to have you on board.</p>
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
        const info = await transporter.sendMail({
            from: senderEmail,
            to: receiverEmail,
            subject,
            text: plainText,
            html: htmlContent,
        });

        console.log("Message sent:", info.messageId);
        return info;
    }
}
