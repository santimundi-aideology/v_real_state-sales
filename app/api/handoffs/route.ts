import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    let query = supabase
      .from("handoff_packages")
      .select("*")
      .order("timestamp", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching handoff packages:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error in GET /api/handoffs:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    const {
      conversationId,
      prospectId,
      prospectName,
      prospectPhone,
      prospectEmail,
      prospectWhatsapp,
      priority = "medium",
      reason,
      summary,
      detectedNeeds = [],
      suggestedProperties = [],
      qualificationScore,
      conversationContext,
      nextSteps = [],
      sourceChannel,
      suggestedFollowUpChannel,
    } = body

    // Validate required fields
    if (!prospectId || !prospectName || !prospectPhone || !prospectEmail || !reason || !summary || !conversationContext || !sourceChannel) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("handoff_packages")
      .insert({
        conversation_id: conversationId,
        prospect_id: prospectId,
        prospect_name: prospectName,
        prospect_phone: prospectPhone,
        prospect_email: prospectEmail,
        prospect_whatsapp: prospectWhatsapp,
        priority,
        reason,
        summary,
        detected_needs: detectedNeeds,
        suggested_properties: suggestedProperties,
        qualification_score: qualificationScore,
        conversation_context: conversationContext,
        next_steps: nextSteps,
        source_channel: sourceChannel,
        suggested_follow_up_channel: suggestedFollowUpChannel,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating handoff package:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error("Error in POST /api/handoffs:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


