import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // Fetch user's resumes with all related data
        const resumes = await prisma.resume.findMany({
            where: { userId: user.id },
            include: {
                personal: true,
                work: true,
                education: true,
                projects: true
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
        const {
            personal,
            workExperience,
            education,
            projects,
            skills,
            certifications
        } = body;

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

        // Create a new resume
        const resume = await prisma.resume.create({
            data: {
                userId: user.id,
                skills: skills || [],
                certifications: certifications || [],
                personal: personal ? {
                    create: {
                        name: personal.name,
                        contact: personal.email || personal.phone,
                        linkedin: personal.linkedin,
                        github: personal.github,
                        portfolio: personal.portfolio
                    }
                } : undefined,
                work: workExperience ? {
                    create: workExperience.map((exp: { company?: string; role?: string; duration?: string; description?: string }) => ({
                        company: exp.company,
                        role: exp.role,
                        duration: exp.duration,
                        description: exp.description
                    }))
                } : undefined,
                education: education ? {
                    create: education.map((edu: { institution?: string; degree?: string; field?: string; duration?: string }) => ({
                        institution: edu.institution,
                        degree: edu.degree,
                        field: edu.field,
                        duration: edu.duration
                    }))
                } : undefined,
                projects: projects ? {
                    create: projects.map((proj: { name?: string; description?: string; techStack?: string; role?: string }) => ({
                        name: proj.name,
                        description: proj.description,
                        techStack: proj.techStack ? [proj.techStack] : [],
                        role: proj.role
                    }))
                } : undefined
            },
            include: {
                personal: true,
                work: true,
                education: true,
                projects: true
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
        const { id, skills, certifications } = body;

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

        // Update the resume
        const resume = await prisma.resume.update({
            where: { id },
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

        return NextResponse.json({ resume });
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

        // Delete the resume (cascade will handle related data)
        await prisma.resume.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting resume:', error);
        return NextResponse.json({ error: 'Failed to delete resume' }, { status: 500 });
    }
}
