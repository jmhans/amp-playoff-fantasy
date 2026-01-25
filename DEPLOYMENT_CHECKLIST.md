# Deployment Checklist - Week 3 Scoring Fix

## Pre-Deployment

- [ ] Review all code changes in the following files:
  - [ ] `/app/api/stats/update/route.ts`
  - [ ] `/app/api/admin/spreads/route.ts`
  - [ ] `/app/admin/stats/StatsUpdater.tsx`
  - [ ] `/app/api/cron/update-stats/route.ts`

- [ ] Verify database is accessible and schema is up to date
- [ ] Confirm environment variables are set (.env.local)
- [ ] Test build locally: `npm run build`

## Development/Staging Deployment

1. **Deploy Code**
   ```bash
   # Push to git
   git add .
   git commit -m "fix: Week 3 scoring update with better error handling"
   git push origin main
   ```

2. **Verify Deployment**
   - [ ] Application builds successfully
   - [ ] No console errors on page load
   - [ ] Admin panel accessible

3. **Test Week 3 Scoring**
   - [ ] Navigate to Admin → Manage Spreads
   - [ ] Select Week 3
   - [ ] Verify games load from ESPN
   - [ ] See games list with ESPN IDs
   - [ ] Click "Save Spreads"
   - [ ] Verify success message

4. **Test Stats Update**
   - [ ] Go to Admin → Update Player Stats
   - [ ] Select Week 3 (Conference Championship)
   - [ ] Click "Update Stats from ESPN"
   - [ ] Wait for completion
   - [ ] Verify no "Games skipped" warning

5. **Verify Scores Updated**
   - [ ] Check participant pages
   - [ ] Verify Week 3 scores appear
   - [ ] Check standings updated
   - [ ] Verify team picks calculated if games are final

## Production Deployment

### Before Going Live
- [ ] All staging tests passed
- [ ] No regression in other weeks' scoring
- [ ] Database backup taken
- [ ] Rollback plan documented

### Deploy to Production
```bash
# From production branch
git pull
npm run build
npm start
```

### Post-Deployment Verification
1. **Immediate (first 15 minutes)**
   - [ ] Admin panel loads without errors
   - [ ] No errors in browser console
   - [ ] Spreads page works

2. **Short-term (first hour)**
   - [ ] Run Week 3 stats update manually
   - [ ] Verify scores populate
   - [ ] Check a few participants' Week 3 scores
   - [ ] Monitor application logs for errors

3. **Follow-up (next 24 hours)**
   - [ ] Cron job ran successfully (check logs)
   - [ ] All participants' scores updated
   - [ ] No user complaints about missing scores
   - [ ] Verify other weeks still working

## Rollback Plan

If issues occur after deployment:

```bash
# Revert to previous version
git revert HEAD
npm run build
npm start
```

**Key Files to Revert** (if selective rollback needed):
- `/app/api/stats/update/route.ts`
- `/app/api/admin/spreads/route.ts`  
- `/app/admin/stats/StatsUpdater.tsx`
- `/app/api/cron/update-stats/route.ts`

## Monitoring Alerts

Watch for these log patterns:

### ✅ Success Pattern
```
[Spreads API] Found 2 games for week 3
[Spreads API] ✅ Saved 2 games for week 3
[Stats Update] Processing game ... (espnGameId)
[Stats Update] Complete: 8 updated, 2 skipped (no stats)
```

### ⚠️ Warning Pattern (Needs Action)
```
[Stats Update] ⚠️ Game KC @ LV has no ESPN ID - skipping
[Spreads API] Warning: New game created without ESPN ID
```

### ❌ Error Pattern (Needs Immediate Attention)
```
[Stats Update] No games found (status: 404)
[Spreads API] ESPN API returned 404
[Cron] Error in scheduled stats update
```

## Post-Deployment Communication

Once verified working, notify:
- [ ] Product team
- [ ] Support team (if applicable)
- [ ] League participants (optional)

**Sample message:**
> "Week 3 scoring update has been fixed! The system now provides better visibility when games need to be reloaded from ESPN. If you see a warning about skipped games, simply go to Admin → Manage Spreads, reload Week 3, and stats will update properly."

## Documentation Updates

- [ ] Confirm `/WEEK3_SCORING_FIX.md` is accessible to users
- [ ] Update any internal wiki/docs
- [ ] Add to known issues list if not fully resolved

## Sign-Off

- [ ] Code reviewed by: _________________
- [ ] Testing completed by: _________________
- [ ] Deployed by: _________________
- [ ] Verified working by: _________________
- [ ] Date deployed: _________________
