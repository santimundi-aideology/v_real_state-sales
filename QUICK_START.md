# Quick Start Guide

## ✅ Setup Complete!

Your database is now fully configured and ready to use. Here's what's been set up:

### ✅ Completed
- [x] Supabase database configured
- [x] All 17 tables created
- [x] RLS policies fixed and working
- [x] API routes created for all resources
- [x] Authentication system ready
- [x] Sign in/Sign up pages created

## 🚀 Getting Started

### 1. Start the Development Server
```bash
pnpm dev
```

### 2. Create Your First Account
1. Visit: http://localhost:3000/auth/signup
2. Fill in:
   - Full Name
   - Email
   - Password (min 6 characters)
   - Role (select from dropdown)
3. Click "Sign Up"
4. Check your email for verification (if email confirmation is enabled)

### 3. Sign In
1. Visit: http://localhost:3000/auth/signin
2. Enter your email and password
3. You'll be redirected to the dashboard

### 4. Seed Sample Data (Optional)
If you want to populate the database with sample properties and integrations:

1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase/seed.sql`
3. Copy and paste the contents
4. Run it

This will add:
- 15 sample properties
- 8 sample integrations

## 📡 API Endpoints Available

All endpoints are ready to use:

### Properties
- `GET /api/properties` - List all properties (supports ?city=, ?status=, ?type= filters)
- `POST /api/properties` - Create new property
- `GET /api/properties/[id]` - Get single property
- `PUT /api/properties/[id]` - Update property
- `DELETE /api/properties/[id]` - Delete property

### Prospects
- `GET /api/prospects` - List prospects (supports ?status=, ?city=, ?assignedTo= filters)
- `POST /api/prospects` - Create new prospect

### Campaigns
- `GET /api/campaigns` - List campaigns (supports ?status=, ?createdBy= filters)
- `POST /api/campaigns` - Create new campaign

### Conversations
- `GET /api/conversations` - List conversations (supports ?prospectId=, ?campaignId=, ?channel= filters)
- `POST /api/conversations` - Create new conversation

### Appointments
- `GET /api/appointments` - List appointments (supports ?prospectId=, ?assignedRepId=, ?status= filters)
- `POST /api/appointments` - Create new appointment

### Integrations
- `GET /api/integrations` - List all integrations
- `POST /api/integrations` - Create new integration
- `PUT /api/integrations` - Update integration status

## 🧪 Test Your Setup

### Test Database Connection
```bash
pnpm test:db
```

### Test API Routes
Visit: http://localhost:3000/api/test-db

You should see:
```json
{
  "success": true,
  "message": "Database connection successful!",
  "tables": {
    "properties": { "accessible": true, "count": 0 },
    "integrations": { "accessible": true, "count": 0 }
  }
}
```

## 🔐 Authentication Flow

1. **Sign Up**: `/auth/signup`
   - Creates user in Supabase Auth
   - Creates corresponding record in `public.users` table
   - Sends verification email (if enabled)

2. **Sign In**: `/auth/signin`
   - Authenticates user
   - Sets session cookie
   - Redirects to dashboard or requested page

3. **Protected Routes**: Automatically protected by middleware
   - `/campaigns`
   - `/conversations`
   - `/appointments`
   - `/properties`
   - `/handoffs`
   - `/analytics`
   - `/settings`
   - `/users`

4. **Sign Out**: Click user menu → Logout
   - Clears session
   - Redirects to sign in

## 📝 Using the Hooks

### Get Current User
```typescript
import { useUser } from '@/lib/hooks/use-user'

function MyComponent() {
  const { user, loading } = useUser()
  
  if (loading) return <div>Loading...</div>
  if (!user) return <div>Not signed in</div>
  
  return <div>Hello, {user.email}</div>
}
```

### Fetch Properties
```typescript
import { useProperties } from '@/lib/hooks/use-properties'

function PropertiesList() {
  const { properties, loading, error } = useProperties({ 
    city: 'Riyadh',
    status: 'available'
  })
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  
  return (
    <div>
      {properties.map(property => (
        <div key={property.id}>{property.name}</div>
      ))}
    </div>
  )
}
```

## 🎯 Next Steps

1. **Seed Data**: Run `supabase/seed.sql` for sample data
2. **Create More Hooks**: Similar to `useProperties()`, create hooks for:
   - `useProspects()`
   - `useCampaigns()`
   - `useConversations()`
   - `useAppointments()`
   - `useIntegrations()`

3. **Update Components**: Replace mock data with API calls:
   - `components/properties-content.tsx` - Use `useProperties()`
   - `components/integrations-content.tsx` - Fetch from `/api/integrations`
   - Other components as needed

4. **Refine RLS Policies**: Update policies based on your role-based access needs

5. **Add Real-time**: Enable Supabase Realtime for live updates

## 🆘 Troubleshooting

### "infinite recursion detected in policy"
✅ Fixed! You've already run the RLS fix migration.

### Can't access tables
- Check RLS policies allow your user role
- Verify you're authenticated
- Check Supabase logs for specific errors

### API routes return 500
- Check Supabase connection in `.env.local`
- Verify tables exist in Supabase dashboard
- Check browser console for errors

### Authentication not working
- Verify Supabase Auth is enabled in dashboard
- Check email confirmation settings
- Verify redirect URLs are configured

## 📚 Documentation

- `IMPLEMENTATION_SUMMARY.md` - Full implementation details
- `NEXT_STEPS.md` - Detailed next steps
- `SETUP.md` - Setup instructions
- `supabase/README.md` - Database documentation
- `lib/supabase/README.md` - Supabase client usage

## 🎉 You're Ready!

Your system is fully set up and ready to use. Start by:
1. Creating an account
2. Seeding sample data (optional)
3. Exploring the API routes
4. Updating components to use real data

Happy coding! 🚀

