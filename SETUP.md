# Quick Setup Guide

## ✅ Step 1: Environment Variables (COMPLETED)
Your `.env.local` file has been created with your Supabase credentials.

## 📋 Step 2: Apply Database Migration

You need to run the database migration in your Supabase dashboard:

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard/project/optbrdgdsjncetnnzcvr

2. **Navigate to SQL Editor**:
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy the Migration SQL**:
   - Open the file: `supabase/migrations/001_initial_schema.sql`
   - Copy ALL the contents (Ctrl+A, Ctrl+C / Cmd+A, Cmd+C)

4. **Paste and Run**:
   - Paste the SQL into the SQL Editor
   - Click "Run" (or press Ctrl+Enter / Cmd+Enter)
   - Wait for it to complete (should take a few seconds)

5. **Verify Tables Were Created**:
   - Go to "Table Editor" in the left sidebar
   - You should see 17 tables:
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

## 🌱 Step 3: Seed Sample Data (Optional)

If you want to populate some sample data:

1. Go back to **SQL Editor**
2. Open the file: `supabase/seed.sql`
3. Copy and paste the contents
4. Run it

This will add:
- 15 sample properties
- 8 sample integrations

## 🧪 Step 4: Test the Connection

You can test if everything is working by running:

```bash
pnpm dev
```

Then create a simple test page or API route to query the database.

## 📝 Next Steps

After the migration is complete, you can:

1. **Set up Authentication** - Configure Supabase Auth for user login
2. **Create API Routes** - Replace mock data with real database queries
3. **Refine RLS Policies** - Update Row Level Security based on your needs
4. **Generate TypeScript Types** - Use Supabase CLI to generate types

## 🆘 Troubleshooting

If you encounter any errors:

1. **"relation already exists"** - Some tables might already exist. You can drop them first or modify the migration.
2. **Permission errors** - Make sure you're using the SQL Editor with proper permissions
3. **RLS blocking queries** - The initial policies require authentication. You may need to adjust them for testing.

## 📚 Documentation

- [Supabase Setup Guide](./supabase/README.md)
- [Supabase Client Usage](./lib/supabase/README.md)

