import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { AIService } from '@/services/aiServices';
import { ResumeData } from '@/types/types';
import { assertGuestQuota, consumeGuestUsage, mapGuestUsageError } from '@/lib/guest-usage';
import { createRequestGuard } from '@/lib/ai-request-guard'

export const runtime = 'nodejs';
export const maxDuration = 60;

const generateSectionGuard = createRequestGuard(5000)

type SectionKey = 'summary' | 'experience' | 'education' | 'skills' | 'customSections';

function normalizeSectionKey(key: string): SectionKey | null {
  const normalized = key.trim();
  if (normalized === 'summary') return 'summary';
  if (normalized === 'experience' || normalized === 'experiences') return 'experience';
  if (normalized === 'education' || normalized === 'educations') return 'education';
  if (normalized === 'skills') return 'skills';
  if (normalized === 'customSections' || normalized === 'custom') return 'customSections';
  return null;
}

function buildSectionPatch(sectionKey: SectionKey, resumeData: ResumeData, generated: Partial<ResumeData>): Partial<ResumeData> {
  switch (sectionKey) {
    case 'summary': {
      const summary = generated.profile?.summary;
      if (typeof summary !== 'string') return {};
      return { profile: { ...resumeData.profile, summary } };
    }
    case 'experience':
      return Array.isArray(generated.experiences) ? { experiences: generated.experiences } : {};
    case 'education':
      return Array.isArray(generated.educations) ? { educations: generated.educations } : {};
    case 'skills':
      return Array.isArray(generated.skills) ? { skills: generated.skills } : {};
    case 'customSections':
      return Array.isArray(generated.customSections) ? { customSections: generated.customSections } : {};
    default:
      return {};
  }
}

function buildNoopSectionPatch(sectionKey: SectionKey, resumeData: ResumeData): Partial<ResumeData> {
  switch (sectionKey) {
    case 'summary':
      return { profile: { ...resumeData.profile } };
    case 'experience':
      return { experiences: Array.isArray(resumeData.experiences) ? resumeData.experiences : [] };
    case 'education':
      return { educations: Array.isArray(resumeData.educations) ? resumeData.educations : [] };
    case 'skills':
      return { skills: Array.isArray(resumeData.skills) ? resumeData.skills : [] };
    case 'customSections':
      return { customSections: Array.isArray(resumeData.customSections) ? resumeData.customSections : [] };
    default:
      return {};
  }
}

export async function POST(req: NextRequest) {
  let requestKey: string | null = null
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = typeof token?.id === 'string'
      ? token.id
      : typeof token?.sub === 'string'
        ? token.sub
        : null;

    try {
      if (userId) {
        const { assertQuota, mapSubscriptionError } = await import('@/lib/subscription-server');
        try {
          await assertQuota(userId, 'regen');
        } catch (err) {
          const mapped = mapSubscriptionError(err);
          return NextResponse.json({ error: mapped.message }, { status: mapped.status });
        }
      } else {
        await assertGuestQuota('regen');
      }
    } catch (err) {
      const mapped = mapGuestUsageError(err);
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }

    const body = await req.json();
    const sectionKey = normalizeSectionKey(body?.sectionKey || '');
    const resumeData = body?.resumeData as ResumeData | undefined;
    const jobDescription = typeof body?.jobDescription === 'string' ? body.jobDescription : undefined;

    if (!sectionKey || !resumeData) {
      return NextResponse.json({ error: 'Missing sectionKey or resumeData' }, { status: 400 });
    }

    requestKey = `generate-section:${userId ?? 'guest'}:${JSON.stringify({ sectionKey, resumeId: resumeData.id, resumeData, jobDescription })}`
    const guardResult = generateSectionGuard.tryAcquire(requestKey)
    if (!guardResult.allowed) {
      return NextResponse.json(
        { error: guardResult.message || 'Duplicate request blocked' },
        { status: guardResult.status || 409 },
      )
    }

    let patch: Partial<ResumeData> = {};
    let aiFailureMessage: string | null = null;
    try {
      const generated = await AIService.generateSection(sectionKey, resumeData, jobDescription);
      patch = buildSectionPatch(sectionKey, resumeData, generated);
    } catch (aiError) {
      aiFailureMessage = aiError instanceof Error ? aiError.message : 'AI generation failed';
      patch = buildNoopSectionPatch(sectionKey, resumeData);
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'AI response was invalid for the requested section' }, { status: 422 });
    }

    if (!aiFailureMessage) {
      if (userId) {
        const { consumeUsage } = await import('@/lib/subscription-server');
        await consumeUsage(userId, 'regen');
      } else {
        await consumeGuestUsage('regen');
      }
    }

    if (requestKey) {
      generateSectionGuard.release(requestKey)
      requestKey = null
    }

    return NextResponse.json(
      aiFailureMessage
        ? {
          success: false,
          state: 'skipped',
          error: aiFailureMessage,
          data: patch,
        }
        : {
          success: true,
          data: patch,
        },
    );
  } catch (error) {
    if (requestKey) {
      generateSectionGuard.release(requestKey)
    }
    console.error('Error in generate-section route:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: 'Failed to process request', details: message }, { status: 500 });
  }
}
