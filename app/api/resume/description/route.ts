import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, url, description, title, company, location, domain } = body;

        if (!userId) {
            return NextResponse.json({ error: 'The action needs to be handled by a logged in user' }, { status: 400 });
        }
        if (!url && !description) {
            return NextResponse.json({ error: 'No URL or description provided' }, { status: 400 });
        }
        if (!title || !company || !location || !domain) {
            return NextResponse.json({ error: 'Missing required metadata fields' }, { status: 400 });
        }

        const storedJobDetails = await prisma.jobDescription.findFirst({
            where: { url }
        });

        if (storedJobDetails) {
            // update all descriptions for this resumeId with the new metadata/description
            return NextResponse.json({ data: storedJobDetails }, { status: 200 });
        }

        // ensure the resume exists and get its owner so we can satisfy the required user relation
        const resumeRecord = await prisma.user.findUnique({ where: { id: userId } });
        if (!resumeRecord) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const jobDescriptionData = {
            id: randomUUID(),
            title,
            company,
            location,
            domain,
            url,
            description: description || '',
            user: { connect: { id: resumeRecord.id } }
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
        const slug = searchParams.get('slug');
        if (slug === 'all') {
            const allDescriptions = await prisma.jobDescription.findMany();
            return NextResponse.json({ data: allDescriptions }, { status: 200 });
        }

        const descriptionId = searchParams.get('id') || undefined;

        if (!descriptionId) {
            return NextResponse.json({ error: 'resumeId is required' }, { status: 400 });
        }

        const descriptions = await prisma.jobDescription.findFirst({
            where: { id: descriptionId },
        });

        if (descriptions) {
            return NextResponse.json({
                data: {
                    title: descriptions.title,
                    company: descriptions.company,
                    location: descriptions.location,
                    domain: descriptions.domain,
                    description: descriptions.description,
                    url: descriptions.url,
                    dateCreated: descriptions.createdAt
                }
            }, { status: 200 });
        }
        return NextResponse.json({ data: 'No description found' }, { status: 202 });
    } catch (err) {
        console.log('Error ', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}