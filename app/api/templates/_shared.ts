import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function getAuthenticatedUserId(req: NextRequest): Promise<string | null> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = typeof token?.id === 'string'
    ? token.id
    : typeof token?.sub === 'string'
      ? token.sub
      : null;
  return userId;
}
