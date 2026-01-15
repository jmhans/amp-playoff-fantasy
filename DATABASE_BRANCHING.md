# Database Branching Strategy

## Overview
This project uses Neon's database branching feature to separate development and production databases.

## Setup Instructions

### 1. Create a Development Branch in Neon

1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. Navigate to **Branches**
4. Click **Create branch**
   - **Branch from**: main (production)
   - **Branch name**: dev
   - **Include data**: Yes (copies all current prod data)
5. After creation, copy the connection string for the dev branch

### 2. Update Local Environment

Update `.env.local` with your dev branch connection string:

```env
POSTGRES_URL_DEV=postgres://your-dev-branch-connection-string-here
```

### 3. Verify Setup

Your local development will now use the dev branch automatically:
- `POSTGRES_URL_DEV` is set → uses dev branch
- `POSTGRES_URL_DEV` not set → falls back to prod (be careful!)

## Migration Workflow

### Local Development (Dev Branch)

1. Make schema changes in `app/lib/db/schema.ts`

2. Generate migration:
   ```bash
   npx drizzle-kit generate
   ```

3. Apply migration to dev branch:
   ```bash
   npx drizzle-kit migrate
   ```

4. Test your changes locally against dev branch

### Production Deployment

Migrations are automatically applied to production during Vercel deployments through the build process.

**Option 1: Automatic via package.json**
Add to `package.json` scripts:
```json
"build": "npx drizzle-kit migrate && next build"
```

**Option 2: Manual via Vercel build command**
Set build command in Vercel dashboard:
```bash
npx drizzle-kit migrate && npm run build
```

## Database URLs

- **Production**: `POSTGRES_URL` (main branch) - used by Vercel deployments
- **Development**: `POSTGRES_URL_DEV` (dev branch) - used locally

## Important Notes

⚠️ **Never commit `.env.local`** - it contains sensitive credentials

⚠️ **Test migrations on dev branch first** - always verify schema changes work before deploying to prod

⚠️ **Neon branch limits** - Free tier has limited branches; monitor usage

## Syncing Dev from Prod

If you need to refresh your dev branch with latest prod data:

1. In Neon Console → Branches
2. Delete the old dev branch
3. Create new dev branch from main
4. Update `.env.local` with new connection string (if changed)
