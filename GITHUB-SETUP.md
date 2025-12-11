# GitHub Repository Setup Guide

## ✅ Security Verification Complete

Your project is now safe to push to GitHub! Here's what's been secured:

### 🔒 Protected (NOT in Git)
- ✅ `.env.local` - Contains your real API keys
- ✅ `.same/` folder - Contains SQL files, admin email, secret page info
- ✅ Example secret pages removed
- ✅ Database schemas with real data excluded

### 📦 Safe to Commit (IN Git)
- ✅ Source code (src/)
- ✅ Configuration templates
- ✅ Public documentation
- ✅ `.env.example` (no real values)

## 🚀 Push to GitHub

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `a-normal-website` (or your choice)
3. **Make it PRIVATE** (recommended) or Public
4. **DO NOT** initialize with README, gitignore, or license
5. Click **"Create repository"**

### Step 2: Push Your Code

Run these commands in the project directory:

```bash
cd a-normal-website

# Verify what will be committed
git status

# Create initial commit
git commit -m "Initial commit - ARG website foundation"

# Add GitHub remote (replace YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/a-normal-website.git

# Rename branch to main (optional)
git branch -M main

# Push to GitHub
git push -u origin main
```

### Step 3: Set Up Netlify Auto-Deploy

1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"GitHub"**
4. Authorize Netlify to access your repos
5. Select your `a-normal-website` repository
6. Configure build settings:
   - **Build command**: `bun run build`
   - **Publish directory**: `.next`
7. **Add environment variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-actual-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-key
   NEXT_PUBLIC_SITE_URL=https://anormalwebsite.xyz
   ```
8. Click **"Deploy site"**

### Step 4: Configure Auto-Deploy

Now every time you push to GitHub:
1. Netlify automatically builds
2. Runs tests
3. Deploys to production
4. You get a notification!

To deploy changes:
```bash
git add -A
git commit -m "Add new feature"
git push
```

## 🔐 Managing Secrets

### What Goes Where

| Secret Type | Location | Public? |
|-------------|----------|---------|
| API Keys | Netlify env vars | ❌ Private |
| Database URL | Netlify env vars | ❌ Private |
| SQL Files | `.same/` (local only) | ❌ Private |
| Source Code | GitHub | ✅ Can be public |
| Documentation | `.same/` (local only) | ❌ Private |

### Sharing with Collaborators

To add a collaborator:

1. **Add them to GitHub repo**:
   - Settings → Collaborators → Add people

2. **Share private files separately**:
   - Send `.same/` folder via Dropbox/Drive
   - Provide `.env.local` values securely (1Password, etc.)
   - Never send secrets via email or chat

3. **Document setup process**:
   - They clone repo
   - Add `.env.local` with your provided values
   - Copy `.same/` folder into their project
   - Run `bun install`
   - Run `bun run dev`

## 📝 Backup Your Private Files

**IMPORTANT**: The `.same/` folder is NOT in GitHub!

Backup `.same/` folder somewhere safe:
- Google Drive
- Dropbox
- 1Password (for small files)
- Encrypted USB drive

If you lose it, you lose:
- Database setup SQL
- Admin configuration
- Setup documentation
- Deployment guides

## 🔄 Workflow

### Making Changes

```bash
# Make your changes
code src/app/page.tsx

# Test locally
bun run dev

# Commit and push
git add -A
git commit -m "Update homepage"
git push

# Netlify auto-deploys!
```

### Updating Secrets

If you need to change environment variables:

1. Update in Netlify dashboard
2. Trigger manual redeploy OR
3. Push a dummy commit to trigger deploy

### Adding New Secret Pages

1. Create page component in `src/app/`
2. Add to database via Supabase dashboard
3. Test locally
4. Push to GitHub (page component only)
5. SQL stays in `.same/` (private)

## ⚠️ Before Making Repo Public

If you want to make your repo public:

### Double-Check These:

- [ ] No secrets in code
- [ ] No admin email in code
- [ ] `.env.local` is gitignored
- [ ] `.same/` folder is gitignored
- [ ] No secret page hints in code comments
- [ ] README doesn't spoil ARG mechanics
- [ ] SECURITY.md is present

### Run Security Scan

```bash
# Check for accidentally committed secrets
git log --all --full-history -- .env.local
git log --all --full-history -- .same/

# Should return nothing!
```

```bash
# Search for your email in committed files
git grep "koishiwastaken@gmail.com"

# Should only appear in ignored files!
```

## 🎯 GitHub Actions (Optional)

Want automatic testing? Create `.github/workflows/test.yml`:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run lint
```

Add secrets in GitHub Settings → Secrets and variables → Actions

## ✅ Verification Checklist

Before first push:

- [ ] `.gitignore` includes `.env*` and `.same/`
- [ ] `.env.local` is NOT in `git status`
- [ ] `.same/` is NOT in `git status`
- [ ] Example secret pages removed
- [ ] README doesn't reveal ARG mechanics
- [ ] SECURITY.md is committed
- [ ] `.env.example` has placeholder values only

After first push:

- [ ] Check GitHub repo - no secrets visible
- [ ] Netlify auto-deploy configured
- [ ] Environment variables set in Netlify
- [ ] Test deployment works
- [ ] `.same/` folder backed up elsewhere

## 🆘 If Something Goes Wrong

### Accidentally Pushed Secrets

1. **Rotate the secret immediately**
   - Regenerate API key in Supabase
   - Update in Netlify env vars
   - Update local `.env.local`

2. **Remove from Git history**
   ```bash
   # DANGER: This rewrites history!
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env.local" \
     --prune-empty --tag-name-filter cat -- --all

   git push origin --force --all
   ```

3. **Consider the secret compromised**
   - Change all passwords
   - Check for unauthorized access
   - Monitor usage

### Repo is Public and Has Secrets

1. **Make repo private immediately**
2. **Rotate all secrets**
3. **Clean git history** (see above)
4. **Review commits** for other leaks

## 📞 Ready to Push?

Verify one more time:

```bash
cd a-normal-website

# What's being committed?
git status

# What's being ignored?
git status --ignored

# Any secrets in tracked files?
git grep -i "password"
git grep -i "secret"
git grep -i "@gmail.com"
```

If all looks good - push it! 🚀

```bash
git push -u origin main
```

Your ARG is now safely on GitHub with auto-deployment! 🎉
