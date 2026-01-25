# Week 3 Scoring Update Issue - Troubleshooting Guide

## Problem
Scoring updates are not working for Week 3 (Conference Championship) in either production or development sites.

## Root Cause
The stats update API (`/api/stats/update`) requires games to have a valid ESPN Game ID (`espnGameId`) in the database. Without this ID, the API cannot fetch player statistics from ESPN and therefore cannot calculate fantasy points.

This typically happens when:
1. Week 3 games were never loaded from ESPN into the database
2. Week 3 games were created manually or imported without ESPN IDs
3. Games were updated/edited and lost their ESPN IDs

## How to Fix

### Step 1: Access the Admin Dashboard
1. Log in to the site with admin credentials
2. Navigate to `/admin`

### Step 2: Load Week 3 Games from ESPN
1. Go to **Admin → Manage Spreads**
2. Select **Week 3** from the dropdown
3. The page will fetch all games from ESPN for Week 3
4. You should see all 2 Conference Championship games displayed
5. Review the spreads (they should be pre-populated if they already exist)
6. Click **Save Spreads** to ensure the games are stored with their ESPN IDs

### Step 3: Verify Games Were Saved
After saving spreads, you should see:
- ✅ Success message confirming games were saved
- Both Week 3 games listed with their matchups and ESPN IDs

### Step 4: Update Stats
1. Go to **Admin → Update Player Stats**
2. Select **Week 3 (Conference)** from the dropdown
3. Click **Update Stats from ESPN**
4. Wait for the update to complete

The response should show:
- Games processed: 2
- Player stats updated: [number]
- Team picks updated: [number]
- ✅ No "Games skipped" warning

## If It Still Doesn't Work

If you see "Games skipped (no ESPN ID)" warning after updating stats:

### Check ESPN API
The ESPN API might be returning different week numbers than expected. Contact support with:
- Full error message from the update
- Screenshot from "Manage Spreads" page
- Whether games are visible or showing "No games found"

### Manual Fix (Last Resort)
If ESPN API is not returning Week 3 games, you can manually ensure ESPN IDs are set:

1. Database direct query (if you have DB access):
   ```sql
   SELECT id, home_team, away_team, espn_game_id, status 
   FROM ampplayoffs.games 
   WHERE week = 3 AND season_id = 1;
   ```

2. If ESPN IDs are NULL, you may need to:
   - Wait for ESPN to finalize Week 3 schedules
   - Check if Week 3 games have actually been scheduled yet
   - Try reloading from a different week to test the system

## Technical Details

### Files Modified
- `/app/api/stats/update/route.ts` - Added logging for skipped games
- `/app/api/admin/spreads/route.ts` - Improved error handling
- `/app/admin/stats/StatsUpdater.tsx` - Added user feedback about skipped games

### What Changed
- Better error messages when ESPN API fails
- More detailed logging about which games are being processed
- Warning when games lack ESPN IDs
- User-friendly suggestions for fixing the issue

## Prevention
Going forward, to prevent this issue:
1. Always use the "Manage Spreads" page to load games from ESPN
2. Don't manually create games without ESPN IDs
3. Run stats updates only after games are properly loaded from ESPN
4. Check the admin dashboard weekly to ensure all weeks' games are loaded
