import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    // Fetch all resumes
    const resumes = await prisma.resume.findMany({ include: { personal: true, work: true, education: true, projects: true } });
    return NextResponse.json(resumes);
}

export async function POST(req: NextRequest) {
    const data = await req.json();
    // Create a new resume
    const resume = await prisma.resume.create({ data });
    return NextResponse.json(resume);
}

export async function PUT(req: NextRequest) {
    const { id, ...data } = await req.json();
    // Update a resume
    const resume = await prisma.resume.update({ where: { id }, data });
    return NextResponse.json(resume);
}

export async function DELETE(req: NextRequest) {
    const { id } = await req.json();
    // Delete a resume
    await prisma.resume.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
