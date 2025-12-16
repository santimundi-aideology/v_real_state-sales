import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    
    const prospectId = searchParams.get('prospectId')
    const campaignId = searchParams.get('campaignId')
    const channel = searchParams.get('channel')
    const limit = parseInt(searchParams.get('limit') || '100')
    
    let query = supabase
      .from('conversations')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit)
    
    if (prospectId) {
      query = query.eq('prospect_id', prospectId)
    }
    
    if (campaignId) {
      query = query.eq('campaign_id', campaignId)
    }
    
    if (channel) {
      query = query.eq('channel', channel)
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
      .from('conversations')
      .insert({
        prospect_id: body.prospectId,
        prospect_name: body.prospectName,
        campaign_id: body.campaignId,
        timestamp: body.timestamp || new Date().toISOString(),
        duration: body.duration || 0,
        channel: body.channel,
        outcome: body.outcome,
        sentiment: body.sentiment,
        transcript: body.transcript,
        ai_confidence: body.aiConfidence,
        handoff_suggested: body.handoffSuggested || false,
        message_count: body.messageCount || 0
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

