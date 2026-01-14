import { auth0 } from '@/app/lib/auth0';

export async function GET(request: Request) {
  return auth0.middleware(request);
}

export async function POST(request: Request) {
  return auth0.middleware(request);
}

export const dynamic = 'force-dynamic';
