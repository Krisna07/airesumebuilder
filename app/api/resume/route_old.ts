import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { skills, Experience, Education, Certificates } from '@/types/types';

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

        // Create a new resume
        const resume = await prisma.resume.create({
            data: {
                userId: user.id,
                profile: profile ? {
                    create: {
                        fullname: profile.fullname || '',
                        email: profile.email || '',
                        phone: profile.phone || '',
                        location: profile.location || '',
                        summary: profile.summary || '',
                        links: profile.links ? {
                            create: profile.links.map((link: { type: string; url: string }) => ({
                                type: link.type || '',
                                url: link.url || ''
                            }))
                        } : undefined
                    }
                } : undefined,
                skills: skills ? {
                    create: {
                        skills: JSON.parse(skills), // Ensure skills is an array of strings
                    }
                } : undefined,
                experience: experience ? {
                    create: experience.map((exp: Experience) => ({
                        title: exp.title || '',
                        company: exp.company || '',
                        location: exp.location || '',
                        startDate: exp.startDate || '',
                        endDate: exp.endDate || null,
                        current: exp.current || false,
                        responsibilities: exp.responsibilities || []
                    }))
                } : undefined,
                education: education ? {
                    create: education.map((edu: Education) => ({
                        degree: edu.degree || '',
                        university: edu.university || '',
                        startDate: edu.startDate || '',
                        endDate: edu.endDate || null,
                        current: edu.current || false,
                        location: edu.location || ''
                    }))
                } : undefined,
                certificates: certificates ? {
                    create: certificates.map((cert: Certificates) => ({
                        title: cert.title || '',
                        issued_by: cert.issued_by || '',
                        year: cert.year || ''
                    }))
                } : undefined
            },
            include: {
                profile: {
                    include: {
                        links: true
                    }
                },
                skills: true,
                experience: true,
                education: true,
                certificates: true
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
            include: {
                profile: { include: { links: true } },
                skills: true,
                experience: true,
                education: true,
                certificates: true
            }
        });

        if (!existingResume) {
            return NextResponse.json({ error: 'Resume not found or access denied' }, { status: 404 });
        }

        // Update the resume using transaction for data consistency
        const updatedResume = await prisma.$transaction(async (tx) => {
            // Update profile if provided
            if (profile && existingResume.profile) {
                await tx.profile.update({
                    where: { resumeId: id },
                    data: {
                        fullname: profile.fullname,
                        email: profile.email,
                        phone: profile.phone,
                        location: profile.location,
                        summary: profile.summary
                    }
                });

                // Update links
                await tx.link.deleteMany({ where: { profileId: existingResume.profile.id } });
                if (profile.links && profile.links.length > 0) {
                    await tx.link.createMany({
                        data: profile.links.map((link: { type: string; url: string }) => ({
                            profileId: existingResume.profile!.id,
                            type: link.type,
                            url: link.url
                        }))
                    });
                }
            } else if (profile && !existingResume.profile) {
                // Create new profile
                await tx.profile.create({
                    data: {
                        resumeId: id,
                        fullname: profile.fullname,
                        email: profile.email,
                        phone: profile.phone,
                        location: profile.location,
                        summary: profile.summary,
                        links: profile.links ? {
                            create: profile.links.map((link: { type: string; url: string }) => ({
                                type: link.type,
                                url: link.url
                            }))
                        } : undefined
                    }
                });
            }

            // Update skills
            if (skills) {
                await tx.skill.deleteMany({ where: { resumeId: id } });
                if (skills.length > 0) {
                    await tx.skill.createMany({
                        data: skills.map((skill: skills) => ({
                            resumeId: id,
                            type: skill.type || '',
                            skills: skill.skills || []
                        }))
                    });
                }
            }

            // Update experience
            if (experience) {
                await tx.experience.deleteMany({ where: { resumeId: id } });
                if (experience.length > 0) {
                    await tx.experience.createMany({
                        data: experience.map((exp: Experience) => ({
                            resumeId: id,
                            title: exp.title,
                            company: exp.company,
                            location: exp.location,
                            startDate: exp.startDate,
                            endDate: exp.endDate,
                            current: exp.current,
                            responsibilities: exp.responsibilities || []
                        }))
                    });
                }
            }

            // Update education
            if (education) {
                await tx.education.deleteMany({ where: { resumeId: id } });
                if (education.length > 0) {
                    await tx.education.createMany({
                        data: education.map((edu: Education) => ({
                            resumeId: id,
                            degree: edu.degree,
                            university: edu.university,
                            startDate: edu.startDate,
                            endDate: edu.endDate,
                            current: edu.current,
                            location: edu.location
                        }))
                    });
                }
            }

            // Update certificates
            if (certificates) {
                await tx.certificate.deleteMany({ where: { resumeId: id } });
                if (certificates.length > 0) {
                    await tx.certificate.createMany({
                        data: certificates.map((cert: Certificates) => ({
                            resumeId: id,
                            title: cert.title,
                            issued_by: cert.issued_by,
                            year: cert.year
                        }))
                    });
                }
            }

            // Update resume timestamp
            await tx.resume.update({
                where: { id },
                data: { updatedAt: new Date() }
            });

            // Return the updated resume
            return await tx.resume.findUnique({
                where: { id },
                include: {
                    profile: { include: { links: true } },
                    skills: true,
                    experience: true,
                    education: true,
                    certificates: true
                }
            });
        });

        return NextResponse.json({ resume: updatedResume });
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
