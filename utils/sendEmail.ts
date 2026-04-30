import nodemailer from "nodemailer";

// Create a transporter using Ethereal test credentials.
// For production, replace with your actual SMTP server details.

const APP_NAME = "AIResumeCraft";
const APP_URL = "https://airesumecraft.xyz";
const APP_LOGO_URL = `${APP_URL}/icon.svg`;

type BrandedCodeEmailOptions = {
    recipientName?: string;
    preheader: string;
    title: string;
    intro: string;
    codeLabel: string;
    code: string;
    outro: string;
}

const escapeHtml = (value: string) => value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const createBrandedCodeEmailText = ({
    recipientName,
    intro,
    codeLabel,
    code,
    outro,
}: Omit<BrandedCodeEmailOptions, "preheader" | "title">) => {
    const greetingName = recipientName?.trim() || "there";

    return `
Hello ${greetingName},

${intro}

${codeLabel}: ${code}

${outro}

Best regards,
The ${APP_NAME} Team
                `;
};

const createBrandedCodeEmailHtml = ({
    recipientName,
    preheader,
    title,
    intro,
    codeLabel,
    code,
    outro,
}: BrandedCodeEmailOptions) => {
    const safeRecipientName = recipientName?.trim() ? escapeHtml(recipientName.trim()) : "";
    const safeCode = escapeHtml(code);
    const safePreheader = escapeHtml(preheader);

    return `
<!DOCTYPE html>
<html lang="en">
    <body style="margin: 0; padding: 0; background-color: #edf6f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a;">
        <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">
            ${safePreheader}
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; background-color: #edf6f4; padding: 24px 0;">
            <tr>
                <td align="center" style="padding: 24px 12px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 620px; border-collapse: separate; border-spacing: 0; background-color: #ffffff; border: 1px solid #d7e5e3; border-radius: 24px; overflow: hidden;">
                        <tr>
                            <td style="padding: 28px 32px; background-color: #0f766e; background-image: linear-gradient(135deg, #083344 0%, #0f766e 58%, #14b8a6 100%);">
                                <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                                    <tr>
                                        <td style="padding-right: 14px; vertical-align: middle;">
                                            <img src="${APP_LOGO_URL}" alt="${APP_NAME} logo" width="56" height="56" style="display: block; width: 56px; height: 56px; border: 0; border-radius: 16px; background-color: #ffffff; padding: 8px; box-sizing: border-box;" />
                                        </td>
                                        <td style="vertical-align: middle; color: #ffffff;">
                                            <div style="margin: 0 0 6px; font-size: 12px; line-height: 1.2; letter-spacing: 0.18em; font-weight: 700; text-transform: uppercase; color: #ccfbf1;">Account Security</div>
                                            <div style="margin: 0; font-size: 28px; line-height: 1.1; font-weight: 800; color: #ffffff;">${APP_NAME}</div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 32px;">
                                <p style="margin: 0 0 12px; font-size: 16px; line-height: 1.6; color: #0f172a;">${safeRecipientName ? `Hi ${safeRecipientName},` : "Hello,"}</p>
                                <h1 style="margin: 0 0 16px; font-size: 30px; line-height: 1.15; font-weight: 800; color: #0f172a;">${title}</h1>
                                <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: #475569;">${intro}</p>
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background-color: #f8fafc; border: 1px solid #d7e5e3; border-radius: 18px;">
                                    <tr>
                                        <td align="center" style="padding: 22px 18px;">
                                            <div style="margin: 0 0 10px; font-size: 12px; line-height: 1.2; letter-spacing: 0.14em; font-weight: 700; text-transform: uppercase; color: #0f766e;">${codeLabel}</div>
                                            <div style="margin: 0; font-size: 34px; line-height: 1.1; letter-spacing: 0.28em; font-weight: 800; color: #0f172a; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;">${safeCode}</div>
                                        </td>
                                    </tr>
                                </table>
                                <p style="margin: 24px 0 0; font-size: 15px; line-height: 1.7; color: #475569;">${outro}</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 20px 32px 28px; border-top: 1px solid #e2e8f0; background-color: #f8fafc;">
                                <p style="margin: 0 0 8px; font-size: 13px; line-height: 1.6; color: #64748b;">You are receiving this email because a request was made for your ${APP_NAME} account.</p>
                                <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #64748b;">Visit <a href="${APP_URL}" style="color: #0f766e; text-decoration: none; font-weight: 700;">airesumecraft.xyz</a> to continue.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>
                `;
};



export const createTransporter = (auth: { user: string, pass: string }) => nodemailer.createTransport({
    service: 'gmail',// Use true for port 465, false for port 587
    auth: auth
});


export class EmailService {
    static async sendVerificationCode(email: string, name: string, code: string) {
        const receiverEmail = email;

        const senderEmail = "authentication@airesumecraft.xyz";

        // Email content
        const subject = `Welcome to ${APP_NAME}!`;
        const plainText = createBrandedCodeEmailText({
            recipientName: name,
            intro: `Use the verification code below to finish setting up your ${APP_NAME} account.`,
            codeLabel: "Verification code",
            code,
            outro: "If you did not request this email, you can safely ignore it.",
        });

        const htmlContent = createBrandedCodeEmailHtml({
            recipientName: name,
            preheader: `${APP_NAME} verification code: ${code}`,
            title: `Welcome to ${APP_NAME}`,
            intro: `Use the verification code below to finish setting up your ${APP_NAME} account.`,
            codeLabel: "Verification code",
            code,
            outro: "If you did not request this email, you can safely ignore it.",
        });
        if (!process.env.AUTH_EMAIL || !process.env.AUTH_PASSWORD) {
            throw new Error("Email service not configured properly.");
        }
        // Send the email
        const authTransporter = createTransporter({
            user: process.env.AUTH_EMAIL || '',
            pass: process.env.AUTH_PASSWORD || '',
        })
        const info = await authTransporter.sendMail({
            from: `"${APP_NAME} Team" <${senderEmail}>`,
            to: receiverEmail,
            subject,
            text: plainText,
            html: htmlContent,
        });

        console.log("Message sent:", info.messageId);
        if (info.rejected.length > 0) {
            console.error("Failed to send email to:", info.rejected);
            return {
                error: "Failed to send email",
            }
        }
        return info;
    }

    static async sendPasswordReset(email: string, code: string) {
        const senderEmail = "authentication@airesumecraft.xyz";
        // Email content
        const subject = `${APP_NAME} password reset code`;
        const plainText = createBrandedCodeEmailText({
            intro: "Use the password reset code below to continue resetting your account.",
            codeLabel: "Password reset code",
            code,
            outro: "If you did not request a password reset, you can safely ignore this email.",
        });

        const htmlContent = createBrandedCodeEmailHtml({
            preheader: `${APP_NAME} password reset code: ${code}`,
            title: "Reset your password",
            intro: "Use the password reset code below to continue resetting your account.",
            codeLabel: "Password reset code",
            code,
            outro: "If you did not request a password reset, you can safely ignore this email.",
        });

        if (!process.env.AUTH_EMAIL || !process.env.AUTH_PASSWORD) {
            throw new Error("Email service not configured properly.");
        }
        // Send the email
        const authTransporter = createTransporter({
            user: process.env.AUTH_EMAIL,
            pass: process.env.AUTH_PASSWORD,
        })
        const info = await authTransporter.sendMail({
            from: `"${APP_NAME} Support" <${senderEmail}>`,
            to: email,
            subject,
            text: plainText,
            html: htmlContent,
        });

        console.log("Message sent:", info.messageId);
        if (info.rejected.length > 0) {
            console.error("Failed to send email to:", info.rejected);
            return {
                error: "Failed to send email",
            }
        }
        return info;

    }

    static async sendEmail(email: string, subject: string, plainText: string, htmlContent: string) {
        const receiverEmail = email;
        const senderEmail = "noreply@airesumecraft.xyz";

        if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
            throw new Error("Email service not configured properly.");
        }
        // Send the email
        const emailTransporter = createTransporter({
            user: process.env.ADMIN_EMAIL,
            pass: process.env.ADMIN_PASSWORD,
        })
        const info = await emailTransporter.sendMail({
            from: `"${APP_NAME}" <${senderEmail}>`,
            to: receiverEmail,
            subject,
            text: plainText,
            html: htmlContent,
        });

        console.log("Message sent:", info.messageId);
        if (info.rejected.length > 0) {
            console.error("Failed to send email to:", info.rejected);
            return {
                error: "Failed to send email",
            }
        }
        return info;
    }


}
