/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { matchRole } from "@/lib/roleMatcher"
import { generateRecommendations } from "@/lib/recommendationEngine"
import { AIService } from "@/services/aiServices"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { role, specialization, seniority, techStack, isAI, existingBullets } = body
    console.log('recommendataion for:', role)
    if (!role) {
      return NextResponse.json(
        { error: "Role is required" },
        { status: 400 }
      )
    }

    if (isAI) {
      // If intent is provided, run an inspection flow that returns tasks/notes
      const { intent } = body as any;
      if (intent && typeof intent === 'string' && intent.trim().length > 0) {
        const inspection = await AIService.inspectIntent(
          role,
          seniority || "junior",
          specialization || "general",
          intent,
          existingBullets || []
        );
        // Optionally include recommendations as well to the client
        let aiRecommendations: string[] = [];
        try {
          aiRecommendations = await AIService.getSmartRecommendations(
            role,
            seniority || "junior",
            specialization || "general",
            existingBullets || []
          );
        } catch (e) {
          throw new Error("Failed to get AI recommendations: " + e);
          // ignore
        }
        return NextResponse.json({ recommendations: aiRecommendations, tasks: inspection.tasks, notes: inspection.notes });
      }

      const aiRecommendations = await AIService.getSmartRecommendations(
        role,
        seniority || "junior",
        specialization || "general",
        existingBullets || []
      );
      return NextResponse.json({ recommendations: aiRecommendations });
    }

    const roleKey = matchRole(role)

    if (!roleKey) {
      return NextResponse.json({ error: "Role not found" }, { status: 400 })
    }

    const recommendations = generateRecommendations({
      roleKey,
      specialization: specialization || "general",
      seniority: seniority || "junior",
      techStack: techStack || {}
    })

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error("Recommendation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
