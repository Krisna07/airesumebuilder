/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { matchRole } from "@/lib/roleMatcher"
import { generateRecommendations } from "@/lib/recommendationEngine"
import { AIService } from "@/services/aiServices"
import { prisma } from "@/lib/prisma"
import recommendations from "@/data/recommendations.json"

export const runtime = 'nodejs';
export const maxDuration = 60;

// Normalize role name for DB lookup
function normalizeRole(role: string): string {
  return role.trim().toLowerCase().replace(/\s+/g, '_');
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { role, specialization, seniority, techStack, isAI, existingBullets } = body

    if (!role) {
      return NextResponse.json(
        { error: "Role is required" },
        { status: 400 }
      )
    }

    // Try local JSON match first
    const roleKey = matchRole(role)
    let source = 'builtin'; // 'builtin' | 'db_cache' | 'ai_generated'
    let recommendations_result: string[] = [];

    // Found in static JSON
    if (roleKey) {
      const spec = specialization ? (recommendations as any).roles[roleKey].specializations[specialization] : 'general';
      let bullets;
      if (seniority && spec) {
        bullets = spec?.bullets[seniority] || spec.bullets['junior'] || [];
      } else {
        bullets = (recommendations as any).roles[roleKey].specializations.general?.bullets['junior'] || [];
      }
      recommendations_result = bullets;
      source = 'builtin';
    } else {
      // Not in JSON, try DB cache
      const roleNormalized = normalizeRole(role);
      const cachedRole = await prisma.dynamicRole.findUnique({
        where: {
          roleNormalized_specialization_seniority: {
            roleNormalized,
            specialization: specialization || 'general',
            seniority: seniority || 'junior'
          }
        }
      });

      if (cachedRole) {
        recommendations_result = (cachedRole.bullets as any) || [];
        source = 'db_cache';
        // Increment usage count
        await prisma.dynamicRole.update({
          where: { id: cachedRole.id },
          data: { usageCount: cachedRole.usageCount + 1 }
        });
      } else {
        // Not in JSON, not in DB → call AI and cache
        try {
          recommendations_result = await AIService.getSmartRecommendations(
            role,
            seniority || 'junior',
            specialization || 'general',
            existingBullets || []
          );
          source = 'ai_generated';

          // Save to DB cache for future use
          await prisma.dynamicRole.create({
            data: {
              roleNormalized,
              roleDisplay: role,
              specialization: specialization || 'general',
              seniority: seniority || 'junior',
              bullets: recommendations_result,
              usageCount: 1
            }
          }).catch(err => {
            // If unique constraint fails (concurrent write), just continue
            if (err.code !== 'P2002') throw err;
          });
        } catch (err) {
          return NextResponse.json(
            { error: 'Failed to generate AI recommendations: ' + (err as any).message },
            { status: 500 }
          );
        }
      }
    }

    // Handle inspection intent if provided
    if (body.intent && typeof body.intent === 'string' && body.intent.trim().length > 0) {
      try {
        const inspection = await AIService.inspectIntent(
          role,
          seniority || 'junior',
          specialization || 'general',
          body.intent,
          existingBullets || []
        );
        return NextResponse.json({
          recommendations: recommendations_result,
          source,
          tasks: inspection.tasks,
          notes: inspection.notes
        });
      } catch (err) {
        console.error('Inspection error:', err);
        // Still return recommendations even if inspection fails
        return NextResponse.json({
          recommendations: recommendations_result,
          source
        });
      }
    }

    return NextResponse.json({
      recommendations: recommendations_result,
      source
    });
  } catch (error) {
    console.error("Recommendation error:", error)
    return NextResponse.json(
      { error: "Internal server error: " + (error as any).message },
      { status: 500 }
    )
  }
}
