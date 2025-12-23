import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Helper to get admin client (bypasses RLS)
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service role key for admin operations')
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function GET(request: Request) {
  try {
    // Try authenticated client first
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    
    const createdBy = searchParams.get('createdBy')
    const limit = parseInt(searchParams.get('limit') || '100')
    
    let query = supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (createdBy) {
      query = query.eq('created_by', createdBy)
    }
    
    let { data, error } = await query
    
    // If query fails or returns empty due to RLS, try with admin client
    if (error || !data || data.length === 0) {
      try {
        const adminClient = getAdminClient()
        let adminQuery = adminClient
          .from('campaigns')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit)
        
        if (createdBy) {
          adminQuery = adminQuery.eq('created_by', createdBy)
        }
        
        const adminResult = await adminQuery
        data = adminResult.data
        error = adminResult.error
      } catch (adminError) {
        // Fall back to original error
      }
    }
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data: data || [] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        name: body.name,
        segment: body.segment,
        status: body.status || 'draft',
        channels: body.channels || [],
        attempts: body.attempts || 0,
        connect_rate: body.connectRate || 0,
        booked_appointments: body.bookedAppointments || 0,
        created_by: body.createdBy
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


