import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    
    const prospectId = searchParams.get('prospectId')
    const assignedRepId = searchParams.get('assignedRepId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')
    
    let query = supabase
      .from('appointments')
      .select('*')
      .order('scheduled_date', { ascending: true })
      .limit(limit)
    
    if (prospectId) {
      query = query.eq('prospect_id', prospectId)
    }
    
    if (assignedRepId) {
      query = query.eq('assigned_rep_id', assignedRepId)
    }
    
    if (status) {
      query = query.eq('status', status)
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
      .from('appointments')
      .insert({
        prospect_id: body.prospectId,
        prospect_name: body.prospectName,
        property_id: body.propertyId,
        property_name: body.propertyName,
        assigned_rep_id: body.assignedRepId,
        assigned_rep_name: body.assignedRepName,
        scheduled_date: body.scheduledDate,
        location: body.location,
        status: body.status || 'scheduled',
        notes: body.notes,
        source_channel: body.sourceChannel
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


