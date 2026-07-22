import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { resolveUserIdFromRequest } from '@/lib/auth-user';

// Secure endpoint that returns minimal user info. Accepts either:
// - cookie-based session (browser fetch with credentials: 'include')
// - Authorization: Bearer <token> header (server-to-server)

export async function GET(req: NextRequest) {
  try {
    const secret = process.env.NEXTAUTH_SECRET;
    const token = await getToken({ req, secret });
    const resolvedUserId = await resolveUserIdFromRequest(req);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return only safe, minimal user fields.
    const user = {
      id: resolvedUserId ?? token.id ?? token.sub ?? null,
      name: token.name ?? null,
      email: token.email ?? null,
      image: token.picture ?? null,
    };

    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: `Server Error ${err}` }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
