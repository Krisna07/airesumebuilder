import { NextRequest, NextResponse } from 'next/server'
import { getAnalysisJob } from '@/lib/analysis-process-store'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
    }

    const job = getAnalysisJob(jobId)
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: job })
  } catch (error) {
    console.error('analysis/process/status error:', error)
    return NextResponse.json({ error: 'Failed to fetch analysis status' }, { status: 500 })
  }
}
