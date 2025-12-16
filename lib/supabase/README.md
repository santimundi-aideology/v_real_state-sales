# Supabase Client Usage

This directory contains Supabase client utilities for both client-side and server-side usage.

## Client-Side Usage

For client components (marked with `"use client"`), use the client:

```typescript
import { supabase } from '@/lib/supabase/client'

// Example: Fetch prospects
const { data, error } = await supabase
  .from('prospects')
  .select('*')
  .eq('status', 'new')
  .order('created_at', { ascending: false })
```

## Server-Side Usage

For server components and API routes, use the server client:

```typescript
import { createServerClient } from '@/lib/supabase/server'

// In a server component or API route
const supabase = await createServerClient()

const { data, error } = await supabase
  .from('prospects')
  .select('*')
```

## Common Patterns

### Fetching Data

```typescript
// Get all properties
const { data: properties, error } = await supabase
  .from('properties')
  .select('*')
  .eq('status', 'available')

// Get prospects with assigned user
const { data: prospects, error } = await supabase
  .from('prospects')
  .select(`
    *,
    assigned_user:users!prospects_assigned_to_fkey(*)
  `)
```

### Inserting Data

```typescript
// Insert a new prospect
const { data, error } = await supabase
  .from('prospects')
  .insert({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+966501234567',
    city: 'Riyadh',
    status: 'new'
  })
  .select()
  .single()
```

### Updating Data

```typescript
// Update prospect status
const { data, error } = await supabase
  .from('prospects')
  .update({ status: 'qualified' })
  .eq('id', prospectId)
  .select()
  .single()
```

### Real-time Subscriptions

```typescript
// Subscribe to live conversations
const channel = supabase
  .channel('live-conversations')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'live_conversations'
  }, (payload) => {
    console.log('Change received!', payload)
  })
  .subscribe()

// Cleanup
channel.unsubscribe()
```

## Type Safety

After generating types with Supabase CLI, you can use typed queries:

```typescript
import { Database } from '@/lib/supabase/types'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

## Error Handling

Always check for errors:

```typescript
const { data, error } = await supabase
  .from('prospects')
  .select('*')

if (error) {
  console.error('Error fetching prospects:', error)
  // Handle error appropriately
  return
}

// Use data safely
console.log('Prospects:', data)
```

## Row Level Security

Remember that Row Level Security (RLS) policies are enforced. Make sure:
1. Users are authenticated when needed
2. RLS policies allow the operations you're performing
3. Check Supabase logs if queries fail unexpectedly

