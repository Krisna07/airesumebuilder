import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/services/aiServices';
import { JobDescription, ResumeData } from '@/types/types';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma'
import { assertQuota, consumeUsage, mapSubscriptionError, requireUserSession } from '@/lib/subscription-server'

export const runtime = 'nodejs';
export const maxDuration = 60;

interface JobDetails extends JobDescription {
  id: string;
}
const fetchResume = async (resumeId: string) => {
  const resume = await prisma.resume.findFirst({ where: { id: resumeId, deleted: false } });
  if (!resume) {
    throw new Error('Resume not found');
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
  return resumeData;
}

export async function POST(req: NextRequest) {
  try {

    let userId: string
    try {
      ({ userId } = await requireUserSession())
    } catch (err) {
      const mapped = mapSubscriptionError(err)
      return NextResponse.json({ error: mapped.message }, { status: mapped.status })
    }
    try {
      await assertQuota(userId, 'analysis')
    } catch (err) {
      const mapped = mapSubscriptionError(err)
      return NextResponse.json({ error: mapped.message }, { status: mapped.status })
    }

    const body = await req.json();
    const analyzeResumeParams = body.analyzeResumeParams;
    const { resumeId, jobDetails, jobDescriptionId }: { resumeId: string; jobDetails?: JobDetails; jobDescriptionId?: string } = analyzeResumeParams;
    console.log(resumeId, jobDetails, jobDescriptionId);
    if (!resumeId || (!jobDetails && !jobDescriptionId)) {
      return NextResponse.json({ error: 'ResumeId and jobDescription are required' }, { status: 400 });
    }

    const resumeData = await fetchResume(resumeId);
    const fetchedJobDetails = jobDetails || await prisma.jobDescription.findFirst({
      where: {
        id: jobDescriptionId
      }
    })

    // Call AI
    const analysis = await AIService.analyzeResume(resumeData, JSON.stringify(jobDetails || fetchedJobDetails));

    // Role extraction heuristics if not provided
    let role = analysis?.role;
    if (!role && fetchedJobDetails) {
      const firstLine = fetchedJobDetails.title.trim().split('\n')[0];
      if (firstLine.length < 80 && /[a-z]/i.test(firstLine)) role = firstLine;
    }

    const matchingScore = Math.min(100, Math.max(0, Number(analysis?.matchingPercentage || 0)));


    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- temporary until Prisma client regenerated with new fields
    let updated: any;
    const jobId = jobDetails?.id || fetchedJobDetails?.id || jobDescriptionId;
    console.log('Storing analysis for jobId:', jobId);
    if (!jobId) {
      return NextResponse.json({ error: 'Job description id missing' }, { status: 400 });
    }

    const existing = await prisma.analysisResult.findFirst({
      where: {
        resumeId: resumeId,
        jobDescriptionId: jobId,
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
          resumeId: resumeId,
          jobDescriptionId: jobId,
          result: analysis ? JSON.stringify(analysis) : '',
          matchingScore: isNaN(matchingScore) ? 0 : matchingScore,
          analyzedAt: new Date(),
        },
      });
    }

    await consumeUsage(userId, 'analysis')

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

    if (resumeId && !jobDescriptionId) {
      const analysis = await prisma.analysisResult.findMany({
        where: {
          resumeId
        }
      })
      return NextResponse.json({ data: analysis });
    }

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
      return NextResponse.json({ message: 'Analysis not found' }, { status: 202 });
    }
    return NextResponse.json({ data: analysis });

  } catch (error) {
    console.error('Analyze API error:', error);
    return NextResponse.json({ error: 'Failed to analyze resume' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const analysisId = searchParams.get('analysisId');
    const resumeId = searchParams.get('resumeId');
    if (!analysisId || !resumeId) {
      return NextResponse.json({ error: 'analysisId and resumeId are required' }, { status: 400 });
    }
    const deletion = await prisma.analysisResult.deleteMany({
      where: {
        id: analysisId,
        resumeId: resumeId
      }
    });
    return NextResponse.json({ data: deletion });
  } catch (error) {
    console.error('Delete Analysis API error:', error);
    return NextResponse.json({ error: 'Failed to delete analysis' }, { status: 500 })
  }
}