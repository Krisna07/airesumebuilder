import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as any

    const secret = body?.secret || req.headers.get('x-revalidate-secret')
    if (!secret || secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // allow either `paths` array or a single `path` string or `slug` for blog pages
    const paths: string[] = []

    if (Array.isArray(body.paths)) {
      paths.push(...body.paths.filter((p: any) => typeof p === 'string'))
    }

    if (typeof body.path === 'string') paths.push(body.path)
    if (typeof body.slug === 'string') {
      paths.push(`/blogs/${body.slug}`)
    }

    // always revalidate the index/listing when a publish/unpublish occurs
    if (!paths.includes('/blogs')) paths.push('/blogs')

    for (const p of paths) {
      try {
        // revalidatePath is synchronous in intent, call for each path
        revalidatePath(p)
      } catch (err) {
        console.error('revalidatePath failed for', p, err)
      }
    }

    return NextResponse.json({ success: true, revalidated: paths })
  } catch (error) {
    console.error('POST /api/revalidate failed', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
