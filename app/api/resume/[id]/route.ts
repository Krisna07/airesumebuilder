import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const resume = await prisma.resume.findFirst({
            where: {
                id: params.id,
                userId: user.id
            },
            include: {
                profile: true
            }
        });

        if (!resume) {
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
        }

        return NextResponse.json({ resume });
    } catch (error) {
        console.error('Error fetching resume:', error);
        return NextResponse.json({ error: 'Failed to fetch resume' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await request.json();
        const { profile, skills, experience, education, certificates } = body;

        // Check if the resume belongs to the user
        const existingResume = await prisma.resume.findFirst({
            where: { id: params.id, userId: user.id },
            include: { profile: true }
        });

        if (!existingResume) {
            return NextResponse.json({ error: 'Resume not found or access denied' }, { status: 404 });
        }

        // Update the resume - much simpler with JSON fields
        await prisma.resume.update({
            where: { id: params.id },
            data: {
                skills: skills || null,
                experience: experience || null,
                education: education || null,
                certificates: certificates || null,
                updatedAt: new Date()
            }
        });

        // Update profile if provided
        if (profile) {
            if (existingResume.profile) {
                await prisma.profile.update({
                    where: { resumeId: params.id },
                    data: {
                        fullname: profile.fullname || '',
                        email: profile.email || '',
                        phone: profile.phone || '',
                        location: profile.location || '',
                        links: profile.links || null,
                        summary: profile.summary || ''
                    }
                });
            } else {
                await prisma.profile.create({
                    data: {
                        resumeId: params.id,
                        fullname: profile.fullname || '',
                        email: profile.email || '',
                        phone: profile.phone || '',
                        location: profile.location || '',
                        links: profile.links || null,
                        summary: profile.summary || ''
                    }
                });
            }
        }

        // Fetch the updated resume with profile
        const updatedResume = await prisma.resume.findUnique({
            where: { id: params.id },
            include: { profile: true }
        });

        return NextResponse.json({ resume: updatedResume });
    } catch (error) {
        console.error('Error updating resume:', error);
        return NextResponse.json({ error: 'Failed to update resume' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // Check if the resume belongs to the user
        const existingResume = await prisma.resume.findFirst({
            where: { id: params.id, userId: user.id }
        });

        if (!existingResume) {
            return NextResponse.json({ error: 'Resume not found or access denied' }, { status: 404 });
        }

        // Delete the resume (cascade will handle profile)
        await prisma.resume.delete({ where: { id: params.id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting resume:', error);
        return NextResponse.json({ error: 'Failed to delete resume' }, { status: 500 });
    }
}
