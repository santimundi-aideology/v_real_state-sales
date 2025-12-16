# Next Steps After Database Migration

Great! Your database migration has been completed. Here's what to do next:

## ✅ Completed
- [x] Supabase project created
- [x] Environment variables configured
- [x] Database schema migrated (17 tables created)
- [x] Test utilities created

## 🧪 Test Your Database Connection

### Option 1: Using the Test Script
```bash
pnpm test:db
```

This will verify:
- Database connection works
- Tables are accessible
- Row Level Security is configured correctly

### Option 2: Using the API Route
1. Start your dev server:
   ```bash
   pnpm dev
   ```

2. Visit: http://localhost:3000/api/test-db

You should see a JSON response confirming the connection.

## 🌱 Seed Sample Data (Optional)

To populate your database with sample data:

1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase/seed.sql`
3. Copy and paste the contents
4. Run it

This will add:
- 15 sample properties
- 8 sample integrations

## 🚀 Recommended Next Steps

### 1. Set Up Authentication (High Priority)
- Configure Supabase Auth
- Create user sign-up/sign-in pages
- Set up session management
- Create initial admin user

### 2. Create API Routes (High Priority)
Replace mock data with real database queries:

- `app/api/properties/route.ts` - CRUD for properties
- `app/api/prospects/route.ts` - CRUD for prospects
- `app/api/campaigns/route.ts` - Campaign management
- `app/api/conversations/route.ts` - Conversation history
- `app/api/appointments/route.ts` - Appointment management

### 3. Refine Row Level Security (Medium Priority)
Update RLS policies to match your role-based access requirements:
- Sales reps can only see their assigned prospects
- Managers can see their team's data
- Admins have full access

### 4. Set Up Real-time Subscriptions (Medium Priority)
Enable Supabase Realtime for:
- Live conversation monitoring
- Real-time dashboard updates
- Campaign progress tracking

### 5. Generate TypeScript Types (Low Priority)
```bash
npx supabase gen types typescript --project-id optbrdgdsjncetnnzcvr > lib/supabase/types.ts
```

## 📚 Useful Resources

- [Supabase Client Usage Guide](./lib/supabase/README.md)
- [Database Schema Documentation](./supabase/README.md)
- [Supabase Documentation](https://supabase.com/docs)

## 🆘 Troubleshooting

### RLS Policy Errors
If you get permission errors, you may need to:
1. Temporarily disable RLS for testing (not recommended for production)
2. Update RLS policies to allow anonymous access for specific tables
3. Set up proper authentication first

### Connection Errors
- Verify `.env.local` has correct credentials
- Check Supabase project is active
- Ensure migration ran successfully

### Type Errors
- Run the type generation command above
- Or manually maintain types in `lib/supabase/types.ts`

## 🎯 Quick Wins

1. **Test the connection**: Run `pnpm test:db`
2. **Seed data**: Run the seed script
3. **Create one API route**: Start with `/api/properties`
4. **Replace one mock data call**: Update a component to use real data

Good luck! 🚀


