import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { analyseResumeToJobDescription } from '@/lib/ai-actions';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { resumeId, jobDescription, updateTitle }: { resumeId: string; jobDescription: string; updateTitle?: boolean } = await req.json();
    if (!resumeId || !jobDescription) {
      return NextResponse.json({ error: 'resumeId and jobDescription are required' }, { status: 400 });
    }

  const resume = await prisma.resume.findFirst({ where: { id: resumeId, deleted: false } });
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Parse stored JSON blobs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseMaybe = (val: any) => (typeof val === 'string' ? JSON.parse(val) : val);
    const resumeData = {
      id: resume.id,
      userId: resume.userId,
      title: resume.title,
      template: resume.template,
      profile: parseMaybe(resume.profile),
      experiences: parseMaybe(resume.experiences),
      educations: parseMaybe(resume.educations),
      skills: parseMaybe(resume.skills),
      certificates: parseMaybe(resume.certificates)
    };

    // Call AI
    const analysis = await analyseResumeToJobDescription(resumeData, jobDescription);

    // Role extraction heuristics if not provided
    let role = analysis?.role;
    if (!role) {
      const firstLine = jobDescription.split(/\n|\r/).map(l => l.trim()).filter(Boolean)[0] || '';
      if (firstLine.length < 80 && /[a-z]/i.test(firstLine)) role = firstLine;
    }

    const matchingScore = Math.min(100, Math.max(0, Number(analysis?.matchingPercentage || 0)));

    const shouldOverwrite = updateTitle || resume.title.toLowerCase().startsWith('untitled');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- temporary until Prisma client regenerated with new fields
  const updated = await (prisma as any).resume.update({
      where: { id: resume.id },
      data: {
        title: shouldOverwrite && role ? role : resume.title,
        matchingScore: isNaN(matchingScore) ? 0 : matchingScore,
        analyzedAt: new Date()
      },
      select: { id: true, title: true, matchingScore: true, analyzedAt: true }
    });

    return NextResponse.json({
      analysis: {
        ...analysis,
        role,
        matchingPercentage: matchingScore,
      },
  updated
    });
  } catch (error) {
    console.error('Analyze API error:', error);
    return NextResponse.json({ error: 'Failed to analyze resume' }, { status: 500 });
  }
}
