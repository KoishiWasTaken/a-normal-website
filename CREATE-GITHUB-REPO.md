# 🚀 Step-by-Step: Create GitHub Repository

Follow these exact steps to safely create your GitHub repo with auto-deployment.

## ✅ Pre-Flight Check

Before starting, verify:

```bash
cd a-normal-website

# Should show .env.local and .same/ as ignored
git status --ignored

# Should show NO results (your email not in tracked files)
git grep "your-email@gmail.com"

# Should show "private/" is ignored
git status --ignored | grep private
```

If all checks pass, continue! 🎯

---

## 📝 Step 1: Create GitHub Repository

### 1.1 Go to GitHub

1. Open browser to: **https://github.com/new**
2. Make sure you're logged into your GitHub account

### 1.2 Configure Repository

Fill in these fields:

**Repository name:**
```
a-normal-website
```

**Description (optional):**
```
A web exploration platform with discovery mechanics
```

**Visibility:**
- Choose **Private** ✅ (Recommended - keeps your code private)
- OR **Public** (only if you verified no secrets in code)

**Initialize repository:**
- ❌ **DO NOT** check "Add a README file"
- ❌ **DO NOT** check "Add .gitignore"
- ❌ **DO NOT** choose a license

### 1.3 Create Repository

Click the green **"Create repository"** button

You'll see a page with setup instructions - **leave this page open!**

---

## 💻 Step 2: Connect Your Local Project

### 2.1 Open Terminal

Navigate to your project:

```bash
cd ~/path/to/a-normal-website
# Or wherever your project is located
```

### 2.2 Verify Git is Ready

```bash
git status
```

You should see:
```
On branch master
nothing to commit, working tree clean
```

### 2.3 Add GitHub Remote

Copy this command from your GitHub page (it should look like this):

```bash
git remote add origin https://github.com/YOUR-USERNAME/a-normal-website.git
```

**Replace `YOUR-USERNAME` with your actual GitHub username!**

For example:
```bash
git remote add origin https://github.com/koishiwastaken/a-normal-website.git
```

### 2.4 Rename Branch to Main (Optional but Recommended)

```bash
git branch -M main
```

This renames `master` to `main` (GitHub's new default).

### 2.5 Push to GitHub

```bash
git push -u origin main
```

You might be asked for credentials:
- **Username:** Your GitHub username
- **Password:** Your GitHub Personal Access Token (NOT your password)

**Don't have a token?**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name: "Netlify Deploy"
4. Check boxes: `repo` (all), `workflow`
5. Click "Generate token"
6. **Copy the token** (you'll only see it once!)
7. Use it as your password

### 2.6 Verify Push Succeeded

Refresh your GitHub repository page. You should see:
- ✅ All your files
- ✅ Last commit message
- ✅ 37-38 files

---

## 🌐 Step 3: Set Up Netlify Auto-Deploy

### 3.1 Go to Netlify

1. Open: **https://app.netlify.com**
2. Sign in to your account

### 3.2 Import Project

1. Click **"Add new site"** (big button)
2. Click **"Import an existing project"**
3. Click **"Deploy with GitHub"**

### 3.3 Authorize Netlify

If prompted:
1. Click **"Authorize Netlify"**
2. You may need to grant access to repositories
3. Click **"Authorize"** or **"Install"**

### 3.4 Select Repository

1. Find **"a-normal-website"** in the list
2. Click on it

If you don't see it:
- Click **"Configure Netlify on GitHub"**
- Grant access to your repository
- Come back to Netlify

### 3.5 Configure Build Settings

You should see a form. Fill it in:

**Branch to deploy:**
```
main
```

**Build command:**
```
bun run build
```

**Publish directory:**
```
.next
```

**Leave other fields as default**

### 3.6 Add Environment Variables

**CRITICAL:** Click **"Show advanced"** → **"New variable"**

Add these THREE variables:

**Variable 1:**
- Key: `NEXT_PUBLIC_SUPABASE_URL`
- Value: `https://kixvpxemfwufzntcvrnx.supabase.co` (your actual URL)

**Variable 2:**
- Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: `eyJhbGci...` (your actual anon key from `.env.local`)

**Variable 3:**
- Key: `NEXT_PUBLIC_SITE_URL`
- Value: `https://anormalwebsite.xyz`

**Where to find these values:**
```bash
cat .env.local
# Copy the values from there
```

### 3.7 Deploy Site

Click the big **"Deploy a-normal-website"** button!

**Wait for deployment** (2-3 minutes):
- You'll see logs streaming
- It will install packages
- Run build
- Deploy

### 3.8 Update Custom Domain

After deployment succeeds:

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter: `anormalwebsite.xyz`
4. Click **"Verify"**
5. Click **"Add domain"**
6. Netlify should auto-detect it's already configured ✅

---

## ✅ Step 4: Test Auto-Deploy

Let's verify auto-deployment works!

### 4.1 Make a Small Change

```bash
cd a-normal-website

# Edit the homepage
echo "// Test comment" >> src/app/page.tsx
```

### 4.2 Commit and Push

```bash
git add -A
git commit -m "Test auto-deploy"
git push
```

### 4.3 Watch Netlify

1. Go to your Netlify dashboard
2. You should see a new deploy starting automatically!
3. Wait for it to finish
4. Visit https://anormalwebsite.xyz
5. It should be deployed! 🎉

### 4.4 Undo Test Change (Optional)

```bash
git revert HEAD
git push
```

---

## 🎯 Step 5: Verify Everything

### Check GitHub:

- [ ] Go to https://github.com/YOUR-USERNAME/a-normal-website
- [ ] You see all your files
- [ ] NO `.env.local` file visible
- [ ] NO `.same/` folder visible
- [ ] NO `private/` folder visible

### Check Netlify:

- [ ] Site deploys successfully
- [ ] Environment variables are set
- [ ] Custom domain works
- [ ] Auto-deploy triggers on push

### Check Website:

- [ ] Visit https://anormalwebsite.xyz
- [ ] Homepage loads
- [ ] Sign up works
- [ ] Auth emails send
- [ ] Discoveries page works

---

## 🔐 Step 6: Backup Private Files

**CRITICAL:** These files are NOT in GitHub:

### Backup `.same/` Folder

```bash
# Create a backup
cd ..
zip -r same-backup-$(date +%Y%m%d).zip a-normal-website/.same/

# Save this ZIP file to:
# - Google Drive
# - Dropbox
# - 1Password
# - External hard drive
```

### Backup `private/` Folder

```bash
cd ..
zip -r private-backup-$(date +%Y%m%d).zip a-normal-website/private/

# Save this ZIP file securely
```

### Save `.env.local`

```bash
# Copy to password manager or secure note
cat a-normal-website/.env.local
```

---

## 🚀 You're Live!

Your workflow is now:

### Adding Features:
```bash
# 1. Make changes
code src/app/page.tsx

# 2. Test locally
bun run dev

# 3. Commit and push
git add -A
git commit -m "Add new feature"
git push

# 4. Netlify auto-deploys! ✨
```

### Adding Secret Pages:
```bash
# 1. Create in private/ folder
code private/pages/my-secret.tsx

# 2. Test locally (copy to src/app/secret/)
cp private/pages/my-secret.tsx src/app/secret/my-secret/page.tsx
bun run dev

# 3. Run SQL in Supabase
# (Add page to database)

# 4. Push to GitHub
git push
# Note: src/app/secret/ is gitignored!

# 5. Auto-deploys with secret page hidden from GitHub! 🔒
```

---

## 🆘 Troubleshooting

### "Permission denied" when pushing

Create a Personal Access Token:
1. https://github.com/settings/tokens
2. Generate new token (classic)
3. Check: `repo`, `workflow`
4. Use token as password

### Netlify build fails

Check:
1. Environment variables are set
2. Build command is `bun run build`
3. Publish directory is `.next`
4. Check build logs for errors

### Domain not working

1. Wait 10-15 minutes for DNS propagation
2. Check Netlify domain settings
3. Verify Netlify DNS records in domain registrar

### Auto-deploy not triggering

1. Check Netlify is connected to GitHub
2. Verify branch name is `main`
3. Check Netlify deploy settings

---

## 📚 Next Steps

Now that you're set up:

1. ✅ **Add secret pages** using `private/pages/template.secret.tsx`
2. ✅ **Create puzzles** and hide them in ignored folders
3. ✅ **Track progress** in `private/docs/`
4. ✅ **Deploy often** - every push auto-deploys!

**Remember:**
- `private/` folder = Your secret workspace (not in GitHub)
- `src/app/secret/` = Secret pages (not in GitHub)
- `src/app/` (other folders) = Public pages (in GitHub)

Your ARG is ready to grow! 🎮🔍

---

## ✨ Congratulations!

You now have:
- ✅ GitHub repository (version control)
- ✅ Netlify auto-deployment (push = deploy)
- ✅ Secret page protection (gitignored)
- ✅ Custom domain (anormalwebsite.xyz)
- ✅ Future-proof structure (add secrets safely)

Happy ARG building! 🚀
