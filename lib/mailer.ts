// config.ts
import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

const transporter = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    port: 465,
    auth: {
        user: process.env.MAILER_EMAIL,
        pass: process.env.MAILER_PASSKEY,
    },
} as SMTPTransport.Options);

type SendEmailto = {
    sender: Mail.Address;
    receiver: Mail.Address[];
    subject?: string;
    message: string;
};

export const sendEmail = async (dto: SendEmailto) => {
    const { sender, receiver, subject, message } = dto;
    return await transporter.sendMail({
        from: sender,
        to: receiver,
        subject: subject,
        html: message,
        text: message,
    });
};