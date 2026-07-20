import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  defaultTemplateLayoutConfig,
  defaultTemplatePreviewMeta,
  defaultTemplateSectionRules,
  defaultTemplateStyleTokens,
  normalizeTemplateIdentifier,
} from '@/lib/templateCreator';
import { getAuthenticatedUserId } from '@/app/api/templates/_shared';

export const runtime = 'nodejs';

type UpdateDraftPayload = {
  displayName?: string;
  description?: string;
  layoutConfig?: Record<string, unknown>;
  styleTokens?: Record<string, unknown>;
  sectionRules?: Record<string, unknown>;
  previewMeta?: Record<string, unknown>;
};

async function findTemplateByName(normalizedName: string) {
  const templateStore = (prisma as unknown as {
    resumeTemplate: {
      findFirst: (args: unknown) => Promise<Record<string, unknown> | null>;
    };
  }).resumeTemplate;

  return templateStore.findFirst({
    where: { normalizedName },
  });
}

export async function GET(req: NextRequest, context: { params: Promise<{ name: string }> }) {
  try {
    const userId = await getAuthenticatedUserId(req);
    const { name } = await context.params;
    const normalizedName = normalizeTemplateIdentifier(name);

    if (!normalizedName) {
      return NextResponse.json({ success: false, error: 'Invalid template name' }, { status: 400 });
    }

    const template = await findTemplateByName(normalizedName);
    if (!template) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    const isOwner = userId && template.createdByUserId === userId;
    if (!template.isPublic && !isOwner) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const versionStore = (prisma as unknown as {
      resumeTemplateVersion: {
        findFirst: (args: unknown) => Promise<Record<string, unknown> | null>;
      };
    }).resumeTemplateVersion;

    const latestVersion = await versionStore.findFirst({
      where: { templateId: template.id, version: template.latestVersion },
    });

    return NextResponse.json({
      success: true,
      data: {
        template,
        version: latestVersion,
      },
    });
  } catch (error) {
    console.error('GET /api/templates/draft/[name] failed', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch template draft' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ name: string }> }) {
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

    const body = (await req.json()) as UpdateDraftPayload;

    const db = prisma as unknown as {
      $transaction: <T>(fn: (tx: {
        resumeTemplate: {
          findFirst: (args: unknown) => Promise<Record<string, unknown> | null>;
          update: (args: unknown) => Promise<Record<string, unknown>>;
        };
        resumeTemplateVersion: {
          findFirst: (args: unknown) => Promise<Record<string, unknown> | null>;
          create: (args: unknown) => Promise<Record<string, unknown>>;
        };
      }) => Promise<T>) => Promise<T>;
    };

    const result = await db.$transaction(async (tx) => {
      const template = await tx.resumeTemplate.findFirst({ where: { normalizedName } });
      if (!template) {
        return {
          status: 404,
          payload: { success: false, error: 'Template not found' },
        };
      }

      if (template.createdByUserId !== userId) {
        return {
          status: 403,
          payload: { success: false, error: 'Forbidden' },
        };
      }

      const currentVersion = await tx.resumeTemplateVersion.findFirst({
        where: { templateId: template.id, version: template.latestVersion },
      });

      if (!currentVersion) {
        return {
          status: 500,
          payload: { success: false, error: 'Template version data missing' },
        };
      }

      const nextVersion = Number(template.latestVersion) + 1;
      const updatedTemplate = await tx.resumeTemplate.update({
        where: { id: template.id },
        data: {
          displayName: body.displayName !== undefined ? body.displayName.trim() : template.displayName,
          description: body.description !== undefined ? body.description.trim() : template.description,
          latestVersion: nextVersion,
        },
      });

      const newVersion = await tx.resumeTemplateVersion.create({
        data: {
          templateId: template.id,
          version: nextVersion,
          schemaVersion: Number(currentVersion.schemaVersion || 1),
          layoutConfig: body.layoutConfig || currentVersion.layoutConfig || defaultTemplateLayoutConfig(),
          styleTokens: body.styleTokens || currentVersion.styleTokens || defaultTemplateStyleTokens(),
          sectionRules: body.sectionRules || currentVersion.sectionRules || defaultTemplateSectionRules(),
          previewMeta: body.previewMeta || currentVersion.previewMeta || defaultTemplatePreviewMeta(),
        },
      });

      return {
        status: 200,
        payload: {
          success: true,
          data: {
            template: updatedTemplate,
            version: newVersion,
          },
        },
      };
    });

    return NextResponse.json(result.payload, { status: result.status });
  } catch (error) {
    console.error('PUT /api/templates/draft/[name] failed', error);
    return NextResponse.json({ success: false, error: 'Failed to update template draft' }, { status: 500 });
  }
}
