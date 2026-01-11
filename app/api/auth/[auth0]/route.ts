import { handleAuth } from '@auth0/nextjs-auth0';

export const GET = handleAuth();

export const dynamic = 'force-dynamic';
