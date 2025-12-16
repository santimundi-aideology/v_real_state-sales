# Backend Architecture Documentation

## Overview

The backend is built on **Next.js 16 App Router** with **Supabase (PostgreSQL)** as the database. It follows a serverless architecture with API routes, server-side rendering, and real-time capabilities.

## Architecture Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL 15+)
- **Authentication**: Supabase Auth
- **API**: Next.js API Routes (RESTful)
- **ORM**: Supabase Client (PostgREST)
- **Security**: Row Level Security (RLS) policies
- **Middleware**: Next.js Middleware for route protection

---

## Database Schema

### Core Tables

#### 1. **users** (extends Supabase auth.users)
```sql
- id (UUID, references auth.users)
- name, email, role, avatar
- last_active, status
- created_at, updated_at
```

**Roles**: `sales_rep`, `sales_manager`, `admin`, `qa_supervisor`, `compliance_officer`, `operations`

#### 2. **prospects**
```sql
- id, name, email, phone, whatsapp
- budget, city, timeline
- status (new, contacted, qualified, appointment_set, closed, lost)
- assigned_to (references users)
- preferred_channel
```

#### 3. **properties**
```sql
- id, name, city, price_range
- bedrooms, type (villa, apartment, penthouse, townhouse)
- status (available, reserved, sold)
- image_url, description
- features (TEXT array)
```

#### 4. **campaigns**
```sql
- id, name, segment
- status (draft, active, paused, completed)
- channels (TEXT array)
- attempts, connect_rate, booked_appointments
- created_by (references users)
```

#### 5. **conversations**
```sql
- id, prospect_id, prospect_name
- campaign_id (optional)
- timestamp, duration (seconds)
- channel (phone, whatsapp, sms, email)
- outcome (connected, voicemail, qualified, etc.)
- sentiment, transcript
- ai_confidence, handoff_suggested
- message_count
```

#### 6. **appointments**
```sql
- id, prospect_id, prospect_name
- property_id, property_name
- assigned_rep_id, assigned_rep_name
- scheduled_date, location
- status (scheduled, completed, no_show, rescheduled)
- notes, source_channel
```

#### 7. **handoff_packages**
```sql
- id, conversation_id, prospect_id
- prospect_name, prospect_phone, prospect_email, prospect_whatsapp
- timestamp, priority (high, medium, low)
- reason, summary
- detected_needs (TEXT array)
- suggested_properties (TEXT array)
- qualification_score (JSONB)
- conversation_context
- next_steps (TEXT array)
- status (pending, claimed, completed, expired)
- claimed_by, claimed_at
- source_channel, suggested_follow_up_channel
```

#### 8. **integrations**
```sql
- id, name, type (crm, telephony, calendar, messaging, email)
- status (connected, disconnected, error)
- last_sync
```

### Supporting Tables

- **agent_actions**: Tracks AI agent actions during conversations
- **qualification_scores**: Stores prospect qualification metrics
- **live_conversations**: Real-time conversation state
- **transcript_messages**: Individual messages in conversations
- **detected_entities**: AI-detected entities (budget, timeline, etc.)
- **agent_plan_steps**: AI agent execution plan
- **campaign_runs**: Active campaign execution state
- **queued_leads**: Leads waiting to be contacted
- **routing_rules**: Rules for assigning prospects to reps

---

## API Routes

All API routes are located in `/app/api/` and follow RESTful conventions.

### Base URL
```
/api/{resource}
```

### Endpoints

#### **Properties** (`/api/properties`)
- `GET /api/properties` - List properties (with filters: city, status, type, limit)
- `GET /api/properties/[id]` - Get single property
- `POST /api/properties` - Create property
- `PUT /api/properties/[id]` - Update property
- `DELETE /api/properties/[id]` - Delete property

**Query Parameters**:
- `city`: Filter by city
- `status`: Filter by status (available, reserved, sold)
- `type`: Filter by type (villa, apartment, penthouse, townhouse)
- `limit`: Limit results (default: 100)

#### **Prospects** (`/api/prospects`)
- `GET /api/prospects` - List prospects (with filters: status, city, assignedTo)
- `POST /api/prospects` - Create prospect

**Query Parameters**:
- `status`: Filter by status
- `city`: Filter by city
- `assignedTo`: Filter by assigned user ID
- `limit`: Limit results

#### **Campaigns** (`/api/campaigns`)
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign

#### **Conversations** (`/api/conversations`)
- `GET /api/conversations` - List conversations (with filters)
- `POST /api/conversations` - Create conversation record

#### **Appointments** (`/api/appointments`)
- `GET /api/appointments` - List appointments (with filters: prospectId, assignedRepId, status)
- `POST /api/appointments` - Create appointment

#### **Handoffs** (`/api/handoffs`)
- `GET /api/handoffs` - List handoff packages (with filter: status)
- `POST /api/handoffs` - Create handoff package manually
- `POST /api/handoffs/from-appointment` - Generate handoff from appointment

**Special Endpoint**: `/api/handoffs/from-appointment`
- Takes `appointmentId` in request body
- Automatically generates handoff package with:
  - Prospect and property data
  - Conversation context (if available)
  - Detected needs and suggested properties
  - Qualification scores
  - Next steps

#### **Integrations** (`/api/integrations`)
- `GET /api/integrations` - List integrations
- `POST /api/integrations` - Create/update integration

#### **Authentication** (`/api/auth`)
- `POST /api/auth/signout` - Sign out user

#### **Test** (`/api/test-db`)
- `GET /api/test-db` - Test database connection and table accessibility

---

## Authentication System

### Supabase Auth Integration

The app uses **Supabase Auth** for authentication with the following flow:

1. **Client-side**: `lib/supabase/client.ts`
   - Uses `createBrowserClient` from `@supabase/ssr`
   - Handles browser cookies automatically
   - Persists sessions across page refreshes

2. **Server-side**: `lib/supabase/server.ts`
   - Uses `createServerClient` from `@supabase/ssr`
   - Reads/writes cookies via Next.js `cookies()` API
   - Works with Server Components and API routes

3. **User Record Sync**:
   - When a user signs up via Supabase Auth, a trigger (`on_auth_user_created`) automatically creates a record in `public.users`
   - RLS policy allows users to insert their own record

### Authentication Flow

```
Sign Up → Supabase Auth → Trigger creates public.users record → User can sign in
Sign In → Supabase Auth → Session stored in cookies → Middleware validates → Access granted
```

### Session Management

- Sessions are stored in HTTP-only cookies
- Middleware refreshes sessions automatically
- Client-side hooks (`useUser`) cache user data for 5 seconds

---

## Middleware

**File**: `middleware.ts`

### Purpose
- Route protection (authentication)
- Session refresh
- Cookie management

### Protected Routes
- `/campaigns`
- `/conversations`
- `/appointments`
- `/properties`
- `/handoffs`
- `/analytics`
- `/settings`
- `/users`

### Behavior
1. **Unauthenticated access to protected route** → Redirects to `/auth/signin` with `redirect` query param
2. **Authenticated access to auth pages** → Redirects to `/` (dashboard)
3. **Session refresh** → Automatically refreshes expired sessions

---

## Server Utilities

### `lib/supabase/server.ts`
- `createServerClient()`: Creates Supabase client for server-side operations
- Handles cookie management for SSR
- Used in API routes and Server Components

### `lib/supabase/client.ts`
- `supabase`: Browser-side Supabase client
- Handles client-side auth operations
- Used in Client Components

### `lib/utils/handoff-generator.ts`
- `generateHandoffFromAppointment()`: Generates handoff packages from appointments
- Extracts prospect, property, and conversation data
- Calculates priority, qualification scores, and next steps

---

## Security

### Row Level Security (RLS)

All tables have RLS enabled with policies:

1. **Users can read/update own data**
2. **Admins can read all users** (via `is_admin()` function)
3. **Authenticated users can read/write** most tables (for development)
4. **Anonymous read access** for properties and integrations (for public viewing)

### Security Functions

- `public.is_admin()`: SECURITY DEFINER function to check admin status without recursion
- `public.handle_new_user()`: Trigger function to create user records on signup

### API Security

- All API routes use server-side Supabase client
- RLS policies enforce data access at database level
- No direct database queries bypass RLS

---

## Data Flow

### Request Flow

```
Client Request
    ↓
Next.js Middleware (session check)
    ↓
API Route (/app/api/*)
    ↓
createServerClient() (get Supabase client)
    ↓
Supabase Query (with RLS enforcement)
    ↓
Database (PostgreSQL)
    ↓
Response (JSON)
```

### Example: Creating a Handoff Package

```
1. User clicks "Create Handoff" on appointment
2. Frontend calls: POST /api/handoffs/from-appointment
3. API route:
   - Fetches appointment from database (or mock data)
   - Fetches prospect and property
   - Generates handoff data via generateHandoffFromAppointment()
   - Creates placeholder conversation if needed
   - Inserts handoff_package record
4. Returns handoff package JSON
5. Frontend updates UI
```

---

## Database Migrations

Migrations are located in `/supabase/migrations/`:

1. **001_initial_schema.sql**: Creates all tables, indexes, triggers, and RLS policies
2. **002_fix_rls_policies.sql**: Fixes infinite recursion in RLS policies
3. **003_fix_user_signup.sql**: Adds user insertion policy and signup trigger

### Migration Management

Migrations should be applied via Supabase Dashboard SQL Editor or Supabase CLI.

---

## Error Handling

### API Routes
- All routes use try-catch blocks
- Return appropriate HTTP status codes
- Error messages in JSON format: `{ error: "message" }`

### Common Error Responses
- `400`: Bad Request (missing/invalid parameters)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error (database/server error)

---

## Performance Optimizations

1. **Database Indexes**: Created on frequently queried columns
2. **Query Filtering**: All GET endpoints support filtering to reduce data transfer
3. **Pagination**: `limit` parameter on list endpoints
4. **Caching**: User data cached client-side for 5 seconds
5. **Connection Pooling**: Handled by Supabase

---

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Testing

### Database Connection Test
```
GET /api/test-db
```

Returns:
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

### Command Line Test
```bash
pnpm test:db
```

Runs `scripts/test-db-connection.ts` to test database connectivity.

---

## Future Enhancements

1. **Real-time Subscriptions**: Use Supabase Realtime for live updates
2. **File Storage**: Supabase Storage for property images
3. **Edge Functions**: Supabase Edge Functions for complex operations
4. **Webhooks**: External integrations (CRM, telephony)
5. **Rate Limiting**: API rate limiting middleware
6. **Caching Layer**: Redis for frequently accessed data
7. **Search**: Full-text search for properties and prospects

---

## API Response Format

### Success Response
```json
{
  "data": [...]
}
```

### Error Response
```json
{
  "error": "Error message"
}
```

### Handoff Package Response
```json
{
  "id": "uuid",
  "conversation_id": "uuid",
  "prospect_id": "uuid",
  "prospect_name": "John Doe",
  "priority": "high",
  "summary": "...",
  "detected_needs": ["...", "..."],
  "suggested_properties": ["...", "..."],
  "qualification_score": {...},
  "status": "pending",
  ...
}
```

---

## Database Triggers

### `on_auth_user_created`
- **Trigger**: AFTER INSERT on `auth.users`
- **Function**: `public.handle_new_user()`
- **Purpose**: Automatically creates `public.users` record when user signs up

### `update_updated_at_column`
- **Trigger**: BEFORE UPDATE on all tables
- **Function**: `update_updated_at_column()`
- **Purpose**: Automatically updates `updated_at` timestamp

---

## Notes

- All timestamps use `TIMESTAMPTZ` (timezone-aware)
- UUIDs are used for all primary keys
- Foreign keys have appropriate CASCADE/SET NULL behaviors
- Arrays (TEXT[]) are used for multi-value fields (channels, features, etc.)
- JSONB is used for complex nested data (qualification scores, metrics)


