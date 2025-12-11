# a normal website

A web-based exploration and discovery platform with gamification elements.

## Features

- **User Accounts**: Username and email-based authentication with verification
- **Discovery System**: Track and collect findings as you explore
- **Leaderboard**: Compete with other explorers
- **Personal Profile**: View your statistics and achievements
- **Settings**: Manage your account preferences
- **Anonymous Browsing**: Explore without creating an account

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Set Up Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `.same/supabase-schema.sql` in your Supabase SQL Editor
3. Get your project URL and anon key from Project Settings > API
4. Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

### 3. Configure Environment Variables

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the site.

## Documentation

- **Setup Guide**: See `.same/setup-guide.md` for detailed setup instructions
- **Database Schema**: See `.same/supabase-schema.sql` for the complete database structure

## Tech Stack

- **Framework**: Next.js 15 with React 18
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with email verification
- **Deployment**: Netlify (configured)
- **Package Manager**: Bun

## Extending the Application

The application is designed to be extensible. Documentation for adding new features and content is available to project maintainers.

## Project Structure

```
a-normal-website/
 src/
   ├── app/
   │   ├── auth/          # Authentication pages
   │   ├── index/         # User's discovery index
   │   ├── leaderboard/   # Global leaderboard
   │   ├── profile/       # User profile
   │   └── page.tsx       # Homepage
   ├── components/ui/     # shadcn components
   └── lib/
       ├── supabase/      # Supabase client configs
       └── types/         # TypeScript types
 .same/
   ├── setup-guide.md     # Detailed setup instructions
   └── supabase-schema.sql # Database schema
 netlify.toml           # Netlify deployment config
```

## Deployment

This project is deployed to Netlify with auto-deployment from GitHub enabled. Any push to the `master` branch will automatically trigger a new deployment.

**Live Site:** https://anormalwebsite.xyz

### Deploy Your Own Instance

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Add environment variables in Netlify dashboard
4. Deploy!

See `.same/setup-guide.md` for detailed deployment instructions.

## License

This is a draft/starter project. Customize as needed for your ARG experience!
