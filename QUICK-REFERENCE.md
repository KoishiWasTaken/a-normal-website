# 🎯 Quick Reference Card

## 📂 File Locations

| What | Where | In Git? |
|------|-------|---------|
| Public pages | `src/app/page.tsx` | ✅ Yes |
| Secret pages | `src/app/secret/*/page.tsx` | ❌ No |
| Private workspace | `private/` | ❌ No |
| Database setup | `.same/` | ❌ No |
| Config template | `.env.example` | ✅ Yes |
| Your secrets | `.env.local` | ❌ No |

## 🔐 Safe Folders for Secrets (Auto-Ignored)

```
private/              ← Your workspace, never in Git
src/app/secret/       ← Secret pages
src/app/secrets/      ← Secret pages
src/app/hidden/       ← Secret pages
src/app/mystery/      ← Secret pages
src/app/puzzle/       ← Secret pages
src/app/clue/         ← Secret pages
```

## 🚀 Common Commands

### Start Development Server
```bash
cd a-normal-website
bun run dev
# Visit http://localhost:3000
```

### Deploy Changes
```bash
git add -A
git commit -m "Your message"
git push
# Netlify auto-deploys!
```

### Add Secret Page (Quick)
```bash
# 1. Create from template
cp private/pages/template.secret.tsx private/pages/my-secret.tsx

# 2. Edit it
code private/pages/my-secret.tsx

# 3. Copy to secret location (gitignored)
cp private/pages/my-secret.tsx src/app/secret/my-path/page.tsx

# 4. Add to database (run in Supabase SQL Editor)
# See: private/sql/template-add-page.sql

# 5. Push to GitHub
git push
# Your secret page deploys but stays hidden from GitHub!
```

### Check What's Being Committed
```bash
git status              # Files to be committed
git status --ignored    # Files being ignored
git diff                # See changes
```

### Verify No Secrets Leaking
```bash
git grep "koishiwastaken"     # Should find nothing
git grep "@gmail.com"          # Should find nothing
git ls-files | grep .env.local # Should find nothing
git ls-files | grep .same      # Should find nothing
```

## 📊 Database Quick Reference

### Add Page
```sql
INSERT INTO public.pages (page_key, page_url, page_name, page_description, how_to_access, is_hidden, discovery_order)
VALUES ('key', '/path', 'Name', 'Description', 'Hints', true, 10);
```

### View All Pages
```sql
SELECT page_key, page_url, page_name, is_hidden
FROM public.pages
ORDER BY discovery_order;
```

### Check Discoveries
```sql
SELECT p.page_name, COUNT(*) as discoverers
FROM public.page_discoveries pd
JOIN public.pages p ON pd.page_id = p.id
GROUP BY p.page_name;
```

### See Leaderboard
```sql
SELECT * FROM public.leaderboard;
```

## 🎨 Page Template Locations

| Template | Location | Use For |
|----------|----------|---------|
| Secret page | `private/pages/template.secret.tsx` | New secret pages |
| SQL template | `private/sql/template-add-page.sql` | Adding to database |

## 🔄 Typical Workflow

### Public Feature
1. Edit files in `src/app/`, `src/components/`, etc.
2. Test: `bun run dev`
3. Commit: `git add -A && git commit -m "message"`
4. Deploy: `git push`

### Secret Page
1. Create in `private/pages/my-secret.tsx`
2. Copy to `src/app/secret/path/page.tsx` (gitignored!)
3. Add to database via Supabase
4. Test: `bun run dev`
5. Deploy: `git push` (page stays hidden from Git)

### Update Secrets
1. Edit `.env.local` locally
2. Update in Netlify dashboard
3. Trigger redeploy or push a commit

## 🆘 Emergency Commands

### Accidentally Staged Secrets
```bash
git reset HEAD .env.local    # Unstage
git reset HEAD .same/        # Unstage
```

### Undo Last Commit (Not Pushed)
```bash
git reset HEAD~1             # Keep changes
git reset --hard HEAD~1      # Discard changes
```

### See What Would Be Pushed
```bash
git diff origin/main
```

### Force Netlify Redeploy
```bash
git commit --allow-empty -m "Trigger deploy"
git push
```

## 📞 Help & Documentation

| Topic | File |
|-------|------|
| GitHub setup | `CREATE-GITHUB-REPO.md` |
| Security | `SECURITY.md` |
| Private workspace | `private/README.md` |
| Deployment | `GITHUB-SETUP.md` |
| This reference | `QUICK-REFERENCE.md` |

## ✅ Daily Checklist

Before pushing:
- [ ] Test locally: `bun run dev`
- [ ] Check for secrets: `git status --ignored`
- [ ] Review changes: `git diff`
- [ ] Commit with clear message
- [ ] Push: `git push`
- [ ] Verify deploy in Netlify

## 🎮 ARG-Specific

### Your Admin Account
- Email: (in `.same/` docs, not in code)
- Auto-unlocks all pages
- Excluded from leaderboard
- Doesn't count toward nth discoverer

### Adding Hints
Edit page in database:
```sql
UPDATE public.pages
SET how_to_access = 'Your hint here'
WHERE page_key = 'your-page-key';
```

### View Discovery Stats
```sql
SELECT
  p.page_name,
  ps.unique_discoverers,
  ps.first_discovered_at
FROM public.page_statistics ps
JOIN public.pages p ON ps.page_id = p.id
ORDER BY ps.unique_discoverers DESC;
```

## 🔗 Quick Links

- **Live Site**: https://anormalwebsite.xyz
- **Netlify**: https://app.netlify.com
- **Supabase**: https://supabase.com
- **GitHub**: https://github.com/YOUR-USERNAME/a-normal-website

---

**Keep this file handy!** Pin it to your desktop or save to bookmarks.
