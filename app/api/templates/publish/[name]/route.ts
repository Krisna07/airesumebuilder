import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeTemplateIdentifier } from '@/lib/templateCreator';
import { getAuthenticatedUserId } from '@/app/api/templates/_shared';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, context: { params: Promise<{ name: string }> }) {
  try {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await context.params;
    const normalizedName = normalizeTemplateIdentifier(name);
    if (!normalizedName) {
      return NextResponse.json({ success: false, error: 'Invalid template name' }, { status: 400 });
    }

    const db = prisma as unknown as {
      $transaction: <T>(fn: (tx: {
        resumeTemplate: {
          findFirst: (args: unknown) => Promise<Record<string, unknown> | null>;
          update: (args: unknown) => Promise<Record<string, unknown>>;
        };
        resumeTemplateVersion: {
          update: (args: unknown) => Promise<Record<string, unknown>>;
        };
      }) => Promise<T>) => Promise<T>;
    };

    const result = await db.$transaction(async (tx) => {
      const template = await tx.resumeTemplate.findFirst({ where: { normalizedName } });
      if (!template) {
        return { status: 404, payload: { success: false, error: 'Template not found' } };
      }

      if (template.createdByUserId !== userId) {
        return { status: 403, payload: { success: false, error: 'Forbidden' } };
      }

      const updatedTemplate = await tx.resumeTemplate.update({
        where: { id: template.id },
        data: { isPublic: true },
      });

      const publishedVersion = await tx.resumeTemplateVersion.update({
        where: {
          templateId_version: {
            templateId: template.id,
            version: Number(template.latestVersion),
          },
        },
        data: { publishedAt: new Date() },
      });

      return {
        status: 200,
        payload: {
          success: true,
          data: {
            template: updatedTemplate,
            version: publishedVersion,
          },
        },
      };
    });

    return NextResponse.json(result.payload, { status: result.status });
  } catch (error) {
    console.error('POST /api/templates/publish/[name] failed', error);
    return NextResponse.json({ success: false, error: 'Failed to publish template' }, { status: 500 });
  }
}
