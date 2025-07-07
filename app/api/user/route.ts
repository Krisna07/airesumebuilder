import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { hash } from "bcryptjs";
import RandomBgGenerator from "@/lib/randomBgGenerator";
import RandomCodeGenerator from "@/lib/randomCodeGenerator";
import { sendEmail } from "@/lib/mailer";


// Handle GET requests (check if user is authenticated)
export const GET = async () => {
    const session = await getServerSession(authOptions);
    return NextResponse.json({ authenticated: !!session });
};

// Handle POST requests (create a new user)
export async function POST(req: Request) {
    try {
        const body = await req.json();

        const { email, username, password, checkUser } = body;

        // Check if the request is to check user existence
        if (checkUser) {
            const existingUser = await db.user.findUnique({ where: { email } });
            if (existingUser) {
                return NextResponse.json({ status: 200, id: existingUser.id });
            } else {
                return NextResponse.json({
                    status: 404,
                    message: "User does not exist.",
                });
            }
        }

        // Validate user data
        if (!email || !username || !password) {
            return NextResponse.json({
                status: 400,
                message: "Email, username, and password are required.",
            });
        }
        // Additional validation logic can be added here (e.g., regex for email)

        // Check for existing user or username conflicts
        const existingUser = await db.user.findUnique({ where: { email } });
        const usernameConflict = await db.user.findUnique({ where: { email } });

        if (existingUser || usernameConflict) {
            return NextResponse.json({
                status: 409,
                message: "User already exists, please sign in.",
            });
        }

        const hashedPassword = await hash(password, 12); // Increased salt rounds for better security

        // Create new user
        const newUser = await db.user.create({
            data: {
                email,
                password: hashedPassword,
                avatar: RandomBgGenerator(), // Provide default value for optional field
            },
        });

        //after the user is created call the post api for verification

        // Generate verification code
        const code = RandomCodeGenerator();

        // Save verification code to the database
        await db.verification.create({
            data: {
                userId: newUser.id,
                verificationCode: code,
                verified: false,
            },
        });

        // Prepare and send the verification email
        const sender = {
            name: "The Linkify",
            address: process.env.MAILER_EMAIL as string,
        };
        const recipients = [{ name: username, address: email }];

        try {
            const result = await sendEmail({
                sender,
                receiver: recipients,
                subject: "Account Verification",
                message: `Hi ${email.split('@')[0]}<br> Please verify your account using the following code: ${code}`,
            });

            return NextResponse.json({
                status: 200,
                message: "User created successfully. Verification email sent.",
                accepted: result.accepted,
            });
        } catch (error) {
            console.error("Error sending email:", error);
            return NextResponse.json({
                status: 500,
                message: "User created, but unable to send verification email.",
            });
        }
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json({
            status: 500,
            message: "Error creating user.",
        });
    }
}

// Handle PUT requests (update user information)
export async function PUT(req: Request) {
    try {
        const { id, ...updateData } = await req.json(); // Destructure id and update data

        const updatedUser = await db.user.update({
            where: { id },
            data: updateData,
        });

        if (!updatedUser) {
            return NextResponse.json({
                status: 404,
                message: "User not found",
            });
        }

        return NextResponse.json({
            status: 200,
            message: "User updated successfully",
        });
    } catch (error) {
        return NextResponse.json({
            status: 500,
            message: "Error updating user",
        });
    }
}

// Handle the verification key update (e.g., when the user submits the verification code)
export async function PATCH(req: Request) {
    try {
        const { userId, password } = await req.json();

        // Find the verification record
        const hashedPassword = await hash(password, 12);

        // Update the verification status
        await db.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
            },
        });

        return NextResponse.json({
            status: 200,
            message: "Password reset successful, please login.",
        });
    } catch (error) {
        return NextResponse.json({
            status: 500,
            message: "Error during password reset.",
        });
    }
}

// Handle DELETE requests (delete a user)
export async function DELETE(req: Request) {
    try {
        const url = new URL(req.url, `http://${req.headers.get("host")}`); // Create a URL object
        const userId = url.searchParams.get("id"); // Get user ID from query parameter

        if (!userId) {
            return NextResponse.json({
                status: 400,
                message: "User ID is required.",
            });
        }

        const deletedUser = await db.user.delete({
            where: { id: userId },
        });

        if (!deletedUser) {
            return NextResponse.json({
                status: 404,
                message: "User not found",
            });
        }

        return NextResponse.json({
            status: 200,
            message: "User deleted successfully.",
        });
    } catch (error) {
        return NextResponse.json({
            status: 500,
            message: "Error deleting user.",
        });
    }
}