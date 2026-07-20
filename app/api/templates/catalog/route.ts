import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('query') || '').trim();
    const limit = Math.max(1, Math.min(Number(searchParams.get('limit') || 24), 60));

    // New Prisma models may not exist in generated client until migration+generate.
    const templateStore = (prisma as unknown as {
      resumeTemplate: {
        findMany: (args: unknown) => Promise<Array<Record<string, unknown>>>;
      };
    }).resumeTemplate;

    const templates = await templateStore.findMany({
      where: {
        isPublic: true,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { displayName: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ usageCount: 'desc' }, { updatedAt: 'desc' }],
      take: limit,
      select: {
        id: true,
        name: true,
        normalizedName: true,
        displayName: true,
        description: true,
        createdByUserId: true,
        isPublic: true,
        isBuiltIn: true,
        latestVersion: true,
        usageCount: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    console.error('GET /api/templates/catalog failed', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch templates catalog' }, { status: 500 });
  }
}
