const SUPPORT_URL = "https://buymeacoffee.com/krisnachhe0";

interface WelcomeEmailOptions {
    name?: string;
}

const normalizeName = (name?: string) => {
    const trimmed = name?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : "there";
};

export const buildWelcomeEmail = ({ name }: WelcomeEmailOptions = {}) => {
    const displayName = normalizeName(name);

    const subject = "Welcome to AI Resume Craft 🚀";
    const text = [
        `Hi ${displayName},`,
        "",
        "Thanks for joining AI Resume Craft! You're all set to craft polished resumes, cover letters, and more with our AI-powered tools.",
        "",
        "Need a hand getting started? Just reply to this email and we'll jump in.",
        "",
        `If you'd like to support ongoing development, please consider showing your support at ${SUPPORT_URL}. Every contribution helps keep new features coming!`,
        "",
        "Cheers,",
        "The AI Resume Craft Team",
    ].join("\n");

    const html = `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${subject}</title>
        <style>
            body {
                background-color: #f5f5f5;
                font-family: "Helvetica Neue", Arial, sans-serif;
                color: #1a1a1a;
                margin: 0;
                padding: 24px;
                line-height: 1.6;
            }
            .container {
                max-width: 560px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 12px;
                padding: 32px 28px;
                box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
            }
            h1 {
                margin-top: 0;
                font-size: 24px;
                color: #111827;
            }
            p {
                margin: 16px 0;
            }
            .cta {
                display: inline-block;
                margin-top: 24px;
                padding: 12px 20px;
                border-radius: 8px;
                background: #111827;
                color: #ffffff !important;
                text-decoration: none;
                font-weight: 600;
            }
            .footer {
                margin-top: 32px;
                font-size: 12px;
                color: #6b7280;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Welcome aboard, ${displayName}!</h1>
            <p>
                We're excited to have you on AI Resume Craft. You now have access to streamlined tools for crafting standout resumes, cover letters, and more—powered by AI precision.
            </p>
            <p>
                Have questions or need help getting started? Just reply to this email and we'll assist right away.
            </p>
            <p>
                If our work helps you, please consider showing your support. Every contribution keeps the platform fast, reliable, and improving:
            </p>
            <p>
                <a class="cta" href="${SUPPORT_URL}" target="_blank" rel="noopener noreferrer">
                    Support AI Resume Craft
                </a>
            </p>
            <p>Thanks for being part of the journey!</p>
            <p>— The AI Resume Craft Team</p>
            <div class="footer">
                You received this email because you created an account on AI Resume Craft.
            </div>
        </div>
    </body>
</html>`;

    return { subject, text, html };
};