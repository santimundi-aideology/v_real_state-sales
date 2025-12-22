# FPH Agentic Sales OS

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/ai-deologyai/v0-fph-agentic-sales-os)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/nHO6EjPvTeu)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/ai-deologyai/v0-fph-agentic-sales-os](https://vercel.com/ai-deologyai/v0-fph-agentic-sales-os)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/nHO6EjPvTeu](https://v0.app/chat/nHO6EjPvTeu)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Database Setup

This project uses Supabase as the backend database. To set up the database:

1. **Create a Supabase project** at [https://supabase.com](https://supabase.com)

2. **Configure environment variables**:
   - Copy `.env.example` to `.env.local`
   - Add your Supabase project URL and anon key

3. **Run the database migration**:
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor**
   - Open `supabase/migrations/001_initial_schema.sql`
   - Copy and paste the contents into the SQL Editor and run it

4. **Optional: Seed sample data**:
   - Run `supabase/seed.sql` in the SQL Editor to populate sample properties and integrations

For detailed setup instructions, see [supabase/README.md](./supabase/README.md)

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```