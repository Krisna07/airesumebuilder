import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getTemplateIdentifierError,
  normalizeTemplateIdentifier,
} from '@/lib/templateCreator';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = (searchParams.get('name') || '').trim();

    if (!raw) {
      return NextResponse.json(
        { success: false, error: 'Name query parameter is required' },
        { status: 400 },
      );
    }

    const normalizedName = normalizeTemplateIdentifier(raw);
    const validationError = getTemplateIdentifierError(normalizedName);
    if (validationError) {
      return NextResponse.json({
        success: true,
        data: {
          input: raw,
          normalizedName,
          available: false,
          reason: validationError,
        },
      });
    }

    // New Prisma models may not exist in generated client until migration+generate.
    const templateStore = (prisma as unknown as { resumeTemplate: { findFirst: (args: unknown) => Promise<unknown> } }).resumeTemplate;
    const existing = await templateStore.findFirst({
      where: {
        OR: [{ name: normalizedName }, { normalizedName }],
      },
      select: { id: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        input: raw,
        normalizedName,
        available: !existing,
      },
    });
  } catch (error) {
    console.error('GET /api/templates/name-availability failed', error);
    return NextResponse.json({ success: false, error: 'Failed to check template name' }, { status: 500 });
  }
}
