import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { resumeId, url, description, title, company, location, domain } = body;

        if (!resumeId) {
            return NextResponse.json({ error: 'resumeId is required' }, { status: 400 });
        }
        if (!url && !description) {
            return NextResponse.json({ error: 'No URL or description provided' }, { status: 400 });
        }
        if (!title || !company || !location || !domain) {
            return NextResponse.json({ error: 'Missing required metadata fields' }, { status: 400 });
        }
        const storedDescription = await prisma.jobDescription.findMany({
            where: { resumeId },
        });

        if (storedDescription && storedDescription.length > 0) {
            // update all descriptions for this resumeId with the new metadata/description
            await prisma.jobDescription.updateMany({
                where: { resumeId },
                data: {
                    title,
                    company,
                    location,
                    domain,
                    description: description || '',
                },
            });

            const updatedRecords = await prisma.jobDescription.findMany({
                where: { resumeId },
            });

            return NextResponse.json({ data: updatedRecords }, { status: 200 });
        }
        const jobDescriptionData = {
            id: randomUUID(),
            resumeId,
            title,
            company,
            location,
            domain,
            description: description || ''
        };

        const storeDescription = await prisma.jobDescription.create({ data: jobDescriptionData });
        return NextResponse.json({ data: storeDescription }, { status: 200 });

    } catch (err) {
        console.log('Error ', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

}
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const resumeId = searchParams.get('slug') || undefined;

        if (!resumeId) {
            return NextResponse.json({ error: 'resumeId is required' }, { status: 400 });
        }

        const descriptions = await prisma.jobDescription.findFirst({
            where: { resumeId },
        });

        if (descriptions) {
            return NextResponse.json({
                data: {
                    title: descriptions.title,
                    company: descriptions.company,
                    location: descriptions.location,
                    domain: descriptions.domain,
                    description: descriptions.description
                }
            }, { status: 200 });
        }
        return NextResponse.json({ error: 'No description found' }, { status: 404 });
    } catch (err) {
        console.log('Error ', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}