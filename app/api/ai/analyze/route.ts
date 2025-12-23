import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AIService } from '@/services/aiServices';
import { JobDescription, ResumeData } from '@/types/types';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

interface JobDetails extends JobDescription {
  id: string;
}

export async function POST(req: NextRequest) {
  try {
    const { resumeId, jobDetails }: { resumeId: string; jobDetails: JobDetails } = await req.json();
    if (!resumeId || !jobDetails) {
      return NextResponse.json({ error: 'resumeId and jobDescription are required' }, { status: 400 });
    }

    const resume = await prisma.resume.findFirst({ where: { id: resumeId, deleted: false } });
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    const resumeData: ResumeData = {
      id: resume.id,
      userId: resume.userId,
      title: resume.title,
      template: resume.template,
      profile: JSON.parse(resume.profile as string),
      experiences: JSON.parse(resume.experiences as string),
      educations: JSON.parse(resume.educations as string),
      skills: JSON.parse(resume.skills as string),
      customSections: resume.customSections ?
        (() => {
          try {
            const parsed = JSON.parse(resume.customSections as string);
            return Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            console.warn('Failed to parse customSections:', e);
            return [];
          }
        })() : [],
    };

    // Call AI
    const analysis = await AIService.analyzeResume(resumeData, JSON.stringify(jobDetails));

    // Role extraction heuristics if not provided
    let role = analysis?.role;
    if (!role) {
      const firstLine = jobDetails.title.trim().split('\n')[0];
      if (firstLine.length < 80 && /[a-z]/i.test(firstLine)) role = firstLine;
    }

    const matchingScore = Math.min(100, Math.max(0, Number(analysis?.matchingPercentage || 0)));


    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- temporary until Prisma client regenerated with new fields
    let updated: any;
    const existing = await prisma.analysisResult.findFirst({
      where: {
        resumeId: resume.id,
        jobDescriptionId: jobDetails.id,
      },
    });

    if (existing) {
      updated = await prisma.analysisResult.update({
        where: { id: existing.id },
        data: {
          result: analysis ? JSON.stringify(analysis) : '',
          matchingScore: isNaN(matchingScore) ? 0 : matchingScore,
          analyzedAt: new Date(),
        },
      });
    } else {
      updated = await prisma.analysisResult.create({
        data: {
          id: randomUUID(),
          resumeId: resume.id,
          jobDescriptionId: jobDetails.id,
          result: analysis ? JSON.stringify(analysis) : '',
          matchingScore: isNaN(matchingScore) ? 0 : matchingScore,
          analyzedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      data: updated
    });
  } catch (error) {
    console.error('Analyze API error:', error);
    return NextResponse.json({ error: 'Failed to analyze resume' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const resumeId = searchParams.get('resumeId');
    const jobDescriptionId = searchParams.get('jobDescriptionId');
    if (!resumeId || !jobDescriptionId) {
      return NextResponse.json({ error: 'resumeId and jobDescriptionId are required' }, { status: 400 });
    }
    const analysis = await prisma.analysisResult.findFirst({
      where: {
        resumeId,
        jobDescriptionId,
      },
    });
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }
    return NextResponse.json({ data: analysis });

  } catch (error) {
    console.error('Analyze API error:', error);
    return NextResponse.json({ error: 'Failed to analyze resume' }, { status: 500 })
  }
}
