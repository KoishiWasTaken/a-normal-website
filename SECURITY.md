# Security Best Practices

## 🔒 What's Protected

This repository is configured to keep sensitive information private:

### Ignored from Git
- ✅ `.env*` files (except `.env.example`)
- ✅ `.same/` folder (contains SQL, setup docs, admin info)
- ✅ `private/` folder
- ✅ Files matching `*.private.*`

### Safe to Commit
- ✅ Source code (`src/`)
- ✅ Public documentation
- ✅ Configuration templates
- ✅ UI components

## 🚨 Never Commit

1. **Environment Variables**
   - API keys
   - Database credentials
   - SMTP passwords
   - Session secrets

2. **Database Information**
   - SQL migration files with real data
   - Backup files
   - Connection strings

3. **Admin Information**
   - Admin email addresses
   - Privileged user lists
   - Internal documentation

4. **Content Spoilers**
   - Complete page listings
   - Solution guides
   - Secret URLs or paths
   - Discovery hints

## ✅ Before Pushing to GitHub

1. **Check `.gitignore`** includes:
   ```
   .env*
   !.env.example
   .same/
   private/
   *.private.*
   ```

2. **Verify no secrets** in code:
   ```bash
   # Search for potential secrets
   grep -r "password" --include="*.ts" --include="*.tsx"
   grep -r "secret" --include="*.ts" --include="*.tsx"
   grep -r "@gmail.com" --include="*.ts" --include="*.tsx"
   ```

3. **Review commit history**:
   ```bash
   git log --all --full-history --source -- .env.local
   ```

4. **Use `.env.example`** template:
   - Never put real values in `.env.example`
   - Use placeholder text like `your-value-here`

## 🔐 Netlify Environment Variables

Set these in Netlify Dashboard (not in code):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

These are automatically injected during build and never stored in Git.

## 📝 Managing Private Documentation

Keep private docs in `.same/` folder (git-ignored):

- Database schemas with real data
- Migration scripts
- Admin procedures
- Internal roadmaps
- Secret page structures

## 🤝 Collaborators

When adding collaborators:

1. Share `.same/` folder contents privately (Dropbox, Drive, etc.)
2. Provide `.env.local` template with instructions
3. Document any manual setup steps
4. Use Supabase Row Level Security (RLS) for data protection

## 🚀 CI/CD Security

If setting up GitHub Actions:

- Use GitHub Secrets for env vars
- Never log sensitive data
- Restrict workflow permissions
- Review action logs before making public

## 🐛 If You Accidentally Commit Secrets

1. **Rotate immediately**:
   - Regenerate API keys
   - Change passwords
   - Update credentials everywhere

2. **Remove from history**:
   ```bash
   # Use git-filter-repo or BFG Repo-Cleaner
   # DO NOT use until you understand the implications
   ```

3. **Force push** (if before anyone else cloned):
   ```bash
   git push --force
   ```

4. **If public for a while**: Consider the secret compromised

## 📞 Questions?

Before pushing anything sensitive, double-check:
- Is this information in `.gitignore`?
- Would revealing this spoil the experience?
- Could this be used maliciously?

When in doubt, keep it private!
