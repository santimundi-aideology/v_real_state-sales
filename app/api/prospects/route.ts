import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status')
    const city = searchParams.get('city')
    const assignedTo = searchParams.get('assignedTo')
    const limit = parseInt(searchParams.get('limit') || '100')
    
    let query = supabase
      .from('prospects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (status) {
      query = query.eq('status', status)
    }
    
    if (city) {
      query = query.eq('city', city)
    }
    
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo)
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
      .from('prospects')
      .insert({
        name: body.name,
        email: body.email,
        phone: body.phone,
        whatsapp: body.whatsapp,
        budget: body.budget,
        city: body.city,
        timeline: body.timeline,
        status: body.status || 'new',
        assigned_to: body.assignedTo,
        preferred_channel: body.preferredChannel
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


