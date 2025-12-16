"use client"

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// Cache user data to prevent unnecessary re-fetches
let cachedUser: User | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5000 // 5 seconds

export function useUser() {
  const [user, setUser] = useState<User | null>(cachedUser)
  const [loading, setLoading] = useState(!cachedUser)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    // Use cached user if available and fresh
    if (cachedUser && Date.now() - cacheTimestamp < CACHE_DURATION) {
      setUser(cachedUser)
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mountedRef.current) return
      if (error) {
        console.error('Error getting session:', error)
      }
      const currentUser = session?.user ?? null
      cachedUser = currentUser
      cacheTimestamp = Date.now()
      setUser(currentUser)
      setLoading(false)
    })

    // Listen for auth changes (only significant events)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return
      // Only update on significant events to reduce re-renders
      if (['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED'].includes(event)) {
        const currentUser = session?.user ?? null
        cachedUser = currentUser
        cacheTimestamp = Date.now()
        setUser(currentUser)
        setLoading(false)
      }
    })

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}

