export function isAdmin(user: Record<string, unknown> | undefined): boolean {
  if (!user) return false;
  
  // Check the FantasyPlayoffs namespace (shared Auth0 app)
  const roles = user['https://fantasyplayofffootball.vercel.app/roles'] as string[] | undefined;
  
  return roles?.includes('fpf_admin') || false;
}
