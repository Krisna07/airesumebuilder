import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  defaultTemplateLayoutConfig,
  defaultTemplatePreviewMeta,
  defaultTemplateSectionRules,
  defaultTemplateStyleTokens,
  getTemplateIdentifierError,
  normalizeTemplateIdentifier,
} from '@/lib/templateCreator';
import { getAuthenticatedUserId } from '@/app/api/templates/_shared';

export const runtime = 'nodejs';

type DraftPayload = {
  name: string;
  displayName?: string;
  description?: string;
  baseTemplateId?: string;
  layoutConfig?: Record<string, unknown>;
  styleTokens?: Record<string, unknown>;
  sectionRules?: Record<string, unknown>;
  previewMeta?: Record<string, unknown>;
};

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as DraftPayload;
    const normalizedName = normalizeTemplateIdentifier(body?.name || '');
    const validationError = getTemplateIdentifierError(normalizedName);
    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 });
    }

    // New Prisma models may not exist in generated client until migration+generate.
    const db = prisma as unknown as {
      $transaction: <T>(fn: (tx: {
        resumeTemplate: {
          findFirst: (args: unknown) => Promise<Record<string, unknown> | null>;
          create: (args: unknown) => Promise<Record<string, unknown>>;
        };
        resumeTemplateVersion: {
          create: (args: unknown) => Promise<Record<string, unknown>>;
        };
      }) => Promise<T>) => Promise<T>;
    };

    const result = await db.$transaction(async (tx) => {
      const existing = await tx.resumeTemplate.findFirst({
        where: {
          OR: [{ name: normalizedName }, { normalizedName }],
        },
        select: { id: true },
      });

      if (existing) {
        return {
          ok: false as const,
          status: 409,
          payload: { success: false, error: 'Template name already exists' },
        };
      }

      const template = await tx.resumeTemplate.create({
        data: {
          name: normalizedName,
          normalizedName,
          displayName: (body.displayName || normalizedName).trim(),
          description: (body.description || '').trim(),
          createdByUserId: userId,
          isPublic: false,
          isBuiltIn: false,
          baseTemplateId: body.baseTemplateId || null,
          latestVersion: 1,
        },
      });

      const version = await tx.resumeTemplateVersion.create({
        data: {
          templateId: template.id,
          version: 1,
          schemaVersion: 1,
          layoutConfig: body.layoutConfig || defaultTemplateLayoutConfig(),
          styleTokens: body.styleTokens || defaultTemplateStyleTokens(),
          sectionRules: body.sectionRules || defaultTemplateSectionRules(),
          previewMeta: body.previewMeta || defaultTemplatePreviewMeta(),
        },
      });

      return {
        ok: true as const,
        status: 201,
        payload: {
          success: true,
          data: {
            template,
            version,
          },
        },
      };
    });

    return NextResponse.json(result.payload, { status: result.status });
  } catch (error) {
    console.error('POST /api/templates/draft failed', error);
    return NextResponse.json({ success: false, error: 'Failed to create draft template' }, { status: 500 });
  }
}
