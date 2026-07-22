import { NextRequest } from 'next/server';
import { resolveUserIdFromRequest } from '@/lib/auth-user';

export async function getAuthenticatedUserId(req: NextRequest): Promise<string | null> {
  return resolveUserIdFromRequest(req);
}
