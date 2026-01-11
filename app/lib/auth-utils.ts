import { UserProfile } from '@auth0/nextjs-auth0/client';

export function isAdmin(user: UserProfile | undefined): boolean {
  if (!user) return false;
  
  // Check the FantasyPlayoffs namespace (shared Auth0 app)
  const roles = user['https://fantasyplayofffootball.vercel.app/roles'] as string[] | undefined;
  
  return roles?.includes('fpf_admin') || false;
}
