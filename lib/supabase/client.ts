'use client'

import { createBrowserClient } from '@supabase/ssr'

function getSupabasePublicEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Important: do NOT throw at module import time.
    // CI often runs `next build` without runtime env vars; we only want to fail when Supabase is actually used.
    throw new Error(
      'Missing Supabase environment variables. Please configure them in your deployment environment.\n' +
        `NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'Set' : 'Missing'}\n` +
        `NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'Set' : 'Missing'}`
    )
  }

  return { supabaseUrl, supabaseAnonKey }
}

let _supabase: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseClient() {
  if (_supabase) return _supabase
  const { supabaseUrl, supabaseAnonKey } = getSupabasePublicEnv()
  _supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return _supabase
}

// Backwards-compatible export for existing imports.
// Note: this is initialized lazily to avoid breaking builds when env vars aren't present.
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_target, prop) {
    const client = getSupabaseClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (client as any)[prop]
  },
})

