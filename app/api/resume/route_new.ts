import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // Fetch user's resumes with profile data
        const resumes = await prisma.resume.findMany({
            where: { userId: user.id },
            include: {
                profile: true
            },
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json({ resumes });
    } catch (error) {
        console.error('Error fetching resumes:', error);
        return NextResponse.json({ error: 'Failed to fetch resumes' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await req.json();
        const { profile, skills, experience, education, certificates } = body;

        // Ensure user exists in database
        await prisma.user.upsert({
            where: { id: user.id },
            update: {
                email: user.email!,
                updatedAt: new Date()
            },
            create: {
                id: user.id,
                email: user.email!
            }
        });

        // Create a new resume with simplified schema
        const resume = await prisma.resume.create({
            data: {
                userId: user.id,
                skills: skills || null,
                experience: experience || null,
                education: education || null,
                certificates: certificates || null,
                profile: profile ? {
                    create: {
                        fullname: profile.fullname || '',
                        email: profile.email || '',
                        phone: profile.phone || '',
                        location: profile.location || '',
                        company: profile.company || '',
                        job: profile.job || '',
                        school: profile.school || '',
                        graduated: profile.graduated || false,
                        links: profile.links || null,
                        summary: profile.summary || ''
                    }
                } : undefined
            },
            include: {
                profile: true
            }
        });

        return NextResponse.json({ resume });
    } catch (error) {
        console.error('Error creating resume:', error);
        return NextResponse.json({ error: 'Failed to create resume' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await req.json();
        const { id, profile, skills, experience, education, certificates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Resume ID is required' }, { status: 400 });
        }

        // Check if the resume belongs to the user
        const existingResume = await prisma.resume.findFirst({
            where: { id, userId: user.id },
            include: { profile: true }
        });

        if (!existingResume) {
            return NextResponse.json({ error: 'Resume not found or access denied' }, { status: 404 });
        }

        // Update the resume - much simpler with JSON fields
        const updatedResume = await prisma.resume.update({
            where: { id },
            data: {
                skills: skills || null,
                experience: experience || null,
                education: education || null,
                certificates: certificates || null,
                updatedAt: new Date()
            },
            include: {
                profile: true
            }
        });

        // Update profile if provided
        if (profile) {
            if (existingResume.profile) {
                await prisma.profile.update({
                    where: { resumeId: id },
                    data: {
                        fullname: profile.fullname || '',
                        email: profile.email || '',
                        phone: profile.phone || '',
                        location: profile.location || '',
                        company: profile.company || '',
                        job: profile.job || '',
                        school: profile.school || '',
                        graduated: profile.graduated || false,
                        links: profile.links || null,
                        summary: profile.summary || ''
                    }
                });
            } else {
                await prisma.profile.create({
                    data: {
                        resumeId: id,
                        fullname: profile.fullname || '',
                        email: profile.email || '',
                        phone: profile.phone || '',
                        location: profile.location || '',
                        company: profile.company || '',
                        job: profile.job || '',
                        school: profile.school || '',
                        graduated: profile.graduated || false,
                        links: profile.links || null,
                        summary: profile.summary || ''
                    }
                });
            }
        }

        // Fetch the updated resume with profile
        const finalResume = await prisma.resume.findUnique({
            where: { id },
            include: { profile: true }
        });

        return NextResponse.json({ resume: finalResume });
    } catch (error) {
        console.error('Error updating resume:', error);
        return NextResponse.json({ error: 'Failed to update resume' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await req.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: 'Resume ID is required' }, { status: 400 });
        }

        // Check if the resume belongs to the user
        const existingResume = await prisma.resume.findFirst({
            where: { id, userId: user.id }
        });

        if (!existingResume) {
            return NextResponse.json({ error: 'Resume not found or access denied' }, { status: 404 });
        }

        // Delete the resume (cascade will handle profile)
        await prisma.resume.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting resume:', error);
        return NextResponse.json({ error: 'Failed to delete resume' }, { status: 500 });
    }
}
