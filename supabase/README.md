# Supabase Database Setup

This directory contains database migrations and setup instructions for the FPH Agentic Sales OS.

## Prerequisites

1. Create a Supabase project at [https://supabase.com](https://supabase.com)
2. Get your project URL and anon key from the Supabase dashboard

## Setup Instructions

### 1. Create Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Then update the values:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Run the Initial Migration

You can run the migration in one of two ways:

#### Option A: Using Supabase Dashboard (Recommended for first-time setup)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase/migrations/001_initial_schema.sql`
4. Copy and paste the entire contents into the SQL Editor
5. Click **Run** to execute the migration

#### Option B: Using Supabase CLI (For advanced users)

If you have the Supabase CLI installed:

```bash
# Initialize Supabase (if not already done)
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 3. Verify the Setup

After running the migration, verify that all tables were created:

1. Go to **Table Editor** in your Supabase dashboard
2. You should see the following tables:
   - users
   - prospects
   - properties
   - campaigns
   - conversations
   - agent_actions
   - qualification_scores
   - appointments
   - integrations
   - detected_entities
   - live_conversations
   - transcript_messages
   - agent_plan_steps
   - campaign_runs
   - queued_leads
   - routing_rules
   - handoff_packages

## Database Schema Overview

### Core Tables

- **users**: User accounts with role-based access
- **prospects**: Potential customers/leads
- **properties**: Real estate listings
- **campaigns**: Marketing campaigns
- **conversations**: Historical conversation records
- **appointments**: Scheduled property viewings

### Real-time Tables

- **live_conversations**: Active conversations being monitored
- **transcript_messages**: Real-time message transcripts
- **agent_plan_steps**: AI agent action plans
- **detected_entities**: Entities extracted from conversations

### Operational Tables

- **campaign_runs**: Active campaign execution instances
- **queued_leads**: Leads waiting to be contacted
- **handoff_packages**: Packages for human agent handoffs
- **routing_rules**: Rules for lead routing
- **integrations**: External service integrations

## Row Level Security (RLS)

All tables have Row Level Security enabled. The initial policies allow authenticated users to read data. You should refine these policies based on your specific role-based access requirements.

### Current Policies

- Users can read/update their own user data
- Admins can read all users
- Authenticated users can read all other tables (this should be refined)

### Next Steps for RLS

1. Define role-specific policies for each table
2. Implement policies that restrict access based on:
   - User role (admin, sales_manager, sales_rep, etc.)
   - Data ownership (assigned_to relationships)
   - Campaign ownership
   - Department/team membership

## Indexes

The schema includes indexes on frequently queried columns:
- Foreign key relationships
- Status fields
- Timestamps
- Searchable fields (city, name, etc.)

## Triggers

Automatic `updated_at` triggers are set up on all tables with an `updated_at` column to automatically update timestamps on record changes.

## Next Steps

1. **Seed Initial Data**: Consider creating a seed script to populate initial data
2. **Refine RLS Policies**: Update Row Level Security policies based on your access requirements
3. **Add Database Functions**: Create stored procedures for complex queries
4. **Set up Realtime**: Enable Supabase Realtime for live updates
5. **Create Views**: Consider creating database views for common queries


