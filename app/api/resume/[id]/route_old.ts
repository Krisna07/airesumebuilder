import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Experience, Education, Certificates } from '@/types/types';

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
                    where: { resumeId: params.id },
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
                        resumeId: params.id,
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
            if (skills !== undefined) {
                await tx.skill.deleteMany({ where: { resumeId: params.id } });
                if (skills.length > 0) {
                    await tx.skill.createMany({
                        data: skills.map((skill: { type: string; skills: string[] }) => ({
                            resumeId: params.id,
                            type: skill.type || '',
                            skills: skill.skills || []
                        }))
                    });
                }
            }

            // Update experience
            if (experience !== undefined) {
                await tx.experience.deleteMany({ where: { resumeId: params.id } });
                if (experience.length > 0) {
                    await tx.experience.createMany({
                        data: experience.map((exp: Experience) => ({
                            resumeId: params.id,
                            title: exp.title,
                            company: exp.company,
                            location: exp.location,
                            startDate: exp.startDate,
                            endDate: exp.endDate,
                            current: exp.current || false,
                            responsibilities: exp.responsibilities || []
                        }))
                    });
                }
            }

            // Update education
            if (education !== undefined) {
                await tx.education.deleteMany({ where: { resumeId: params.id } });
                if (education.length > 0) {
                    await tx.education.createMany({
                        data: education.map((edu: Education) => ({
                            resumeId: params.id,
                            degree: edu.degree,
                            university: edu.university,
                            startDate: edu.startDate,
                            endDate: edu.endDate,
                            current: edu.current || false,
                            location: edu.location
                        }))
                    });
                }
            }

            // Update certificates
            if (certificates !== undefined) {
                await tx.certificate.deleteMany({ where: { resumeId: params.id } });
                if (certificates.length > 0) {
                    await tx.certificate.createMany({
                        data: certificates.map((cert: Certificates) => ({
                            resumeId: params.id,
                            title: cert.title,
                            issued_by: cert.issued_by,
                            year: cert.year
                        }))
                    });
                }
            }

            // Update resume timestamp
            await tx.resume.update({
                where: { id: params.id },
                data: { updatedAt: new Date() }
            });

            // Return the updated resume
            return await tx.resume.findUnique({
                where: { id: params.id },
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
