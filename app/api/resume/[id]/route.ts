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
                personal: true,
                work: true,
                education: true,
                projects: true
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
        const {
            personal,
            workExperience,
            education,
            projects,
            skills,
            certifications
        } = body;

        // Check if the resume belongs to the user
        const existingResume = await prisma.resume.findFirst({
            where: { id: params.id, userId: user.id }
        });

        if (!existingResume) {
            return NextResponse.json({ error: 'Resume not found or access denied' }, { status: 404 });
        }

        // Update the resume and its related data
        const resume = await prisma.resume.update({
            where: { id: params.id },
            data: {
                skills: skills || existingResume.skills,
                certifications: certifications || existingResume.certifications,
                updatedAt: new Date()
            },
            include: {
                personal: true,
                work: true,
                education: true,
                projects: true
            }
        });

        // Update personal details if provided
        if (personal) {
            if (resume.personal) {
                await prisma.personalDetail.update({
                    where: { resumeId: params.id },
                    data: {
                        name: personal.name,
                        contact: personal.email || personal.phone,
                        linkedin: personal.linkedin,
                        github: personal.github,
                        portfolio: personal.portfolio
                    }
                });
            } else {
                await prisma.personalDetail.create({
                    data: {
                        resumeId: params.id,
                        name: personal.name,
                        contact: personal.email || personal.phone,
                        linkedin: personal.linkedin,
                        github: personal.github,
                        portfolio: personal.portfolio
                    }
                });
            }
        }

        // Get the updated resume with all relations
        const updatedResume = await prisma.resume.findUnique({
            where: { id: params.id },
            include: {
                personal: true,
                work: true,
                education: true,
                projects: true
            }
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

        // Delete the resume (cascade will handle related data)
        await prisma.resume.delete({ where: { id: params.id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting resume:', error);
        return NextResponse.json({ error: 'Failed to delete resume' }, { status: 500 });
    }
}
