import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status')
    const createdBy = searchParams.get('createdBy')
    const limit = parseInt(searchParams.get('limit') || '100')
    
    let query = supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (status) {
      query = query.eq('status', status)
    }
    
    if (createdBy) {
      query = query.eq('created_by', createdBy)
    }
    
    const { data, error } = await query
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data })
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


