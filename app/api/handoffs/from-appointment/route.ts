import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { generateHandoffFromAppointment } from "@/lib/utils/handoff-generator"
import { mockAppointments, mockProspects, mockProperties, mockConversations } from "@/lib/mock-data"

// UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    const { appointmentId } = body

    if (!appointmentId) {
      return NextResponse.json(
        { error: "appointmentId is required" },
        { status: 400 }
      )
    }

    console.log("Creating handoff for appointment ID:", appointmentId)

    // Try to fetch appointment from database first (only if it looks like a UUID)
    let appointment: any = null
    
    if (uuidRegex.test(appointmentId)) {
      const { data: dbAppointment, error: appointmentError } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", appointmentId)
        .single()

      if (dbAppointment && !appointmentError) {
        appointment = dbAppointment
        console.log("Found appointment in database")
      }
    }

    // Fallback to mock data if not found in database
    if (!appointment) {
      appointment = mockAppointments.find((apt) => apt.id === appointmentId)
      console.log("Using mock appointment:", appointment ? "found" : "not found")
    }

    if (!appointment) {
      console.error("Appointment not found in database or mock data. ID:", appointmentId)
      return NextResponse.json(
        { error: `Appointment not found: ${appointmentId}` },
        { status: 404 }
      )
    }

    // Fetch prospect (with fallback to mock data)
    const appointmentProspectId = appointment.prospect_id || appointment.prospectId
    let prospect: any = null
    
    if (uuidRegex.test(String(appointmentProspectId))) {
      const { data: dbProspect, error: prospectError } = await supabase
        .from("prospects")
        .select("*")
        .eq("id", appointmentProspectId)
        .single()

      if (dbProspect && !prospectError) {
        prospect = dbProspect
      }
    }

    if (!prospect) {
      prospect = mockProspects.find((p) => p.id === appointmentProspectId)
    }

    if (!prospect) {
      console.error("Prospect not found. ID:", appointmentProspectId)
      return NextResponse.json(
        { error: `Prospect not found: ${appointmentProspectId}` },
        { status: 404 }
      )
    }

    // Fetch property (with fallback to mock data)
    const appointmentPropertyId = appointment.property_id || appointment.propertyId
    let property: any = null
    
    if (uuidRegex.test(String(appointmentPropertyId))) {
      const { data: dbProperty, error: propertyError } = await supabase
        .from("properties")
        .select("*")
        .eq("id", appointmentPropertyId)
        .single()

      if (dbProperty && !propertyError) {
        property = dbProperty
      }
    }

    if (!property) {
      property = mockProperties.find((p) => p.id === appointmentPropertyId)
    }

    if (!property) {
      console.error("Property not found. ID:", appointmentPropertyId)
      return NextResponse.json(
        { error: `Property not found: ${appointmentPropertyId}` },
        { status: 404 }
      )
    }

    // Fetch related conversation if exists (with fallback to mock data)
    let conversation: any = null
    const conversationLookupId = appointment.conversation_id || appointment.conversationId
    if (conversationLookupId) {
      const { data: dbConv } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationLookupId)
        .single()
      
      if (dbConv) {
        conversation = dbConv
      } else {
        conversation = mockConversations.find((c) => c.id === conversationLookupId)
      }
    }

    // Generate handoff package
    const handoffData = generateHandoffFromAppointment(
      appointment as any,
      prospect as any,
      property as any,
      conversation as any
    )

    // Handle conversation ID - if it's not a valid UUID, create a placeholder or use a fallback
    let conversationIdMutable = handoffData.conversationId
    
    // Check if conversationId is a valid UUID format
    if (!uuidRegex.test(conversationIdMutable)) {
      // Try to create a placeholder conversation in the database
      // First, ensure prospect_id is a valid UUID
      const prospectIdForConv = prospect.id || prospect.prospect_id
      if (uuidRegex.test(prospectIdForConv)) {
        try {
          const { data: placeholderConv, error: convError } = await supabase
            .from("conversations")
            .insert({
              prospect_id: prospectIdForConv,
              prospect_name: prospect.name || prospect.prospect_name,
              timestamp: appointment.scheduled_date || appointment.scheduledDate,
              duration: 0,
              channel: appointment.source_channel || appointment.sourceChannel || "phone",
              outcome: "connected",
            })
            .select()
            .single()
          
          if (placeholderConv && !convError) {
            conversationIdMutable = placeholderConv.id
          } else {
            // If we can't create, we'll need to skip database insert and return mock data
            console.warn("Could not create placeholder conversation, will return mock handoff")
            return NextResponse.json({
              id: `handoff-${Date.now()}`,
              ...handoffData,
              timestamp: new Date().toISOString(),
              status: "pending",
            }, { status: 201 })
          }
        } catch (error) {
          // If database insert fails, return mock handoff
          console.warn("Error creating placeholder conversation, returning mock handoff")
          return NextResponse.json({
            id: `handoff-${Date.now()}`,
            ...handoffData,
            timestamp: new Date().toISOString(),
            status: "pending",
          }, { status: 201 })
        }
      } else {
        // Prospect ID is not a UUID, return mock handoff
        return NextResponse.json({
          id: `handoff-${Date.now()}`,
          ...handoffData,
          timestamp: new Date().toISOString(),
          status: "pending",
        }, { status: 201 })
      }
    }

    // Validate that prospect_id and property_id are valid UUIDs before inserting
    const prospectId = handoffData.prospectId
    const propertyId = property.id || property.property_id
    
    // If IDs are not UUIDs (mock data), return mock handoff instead of trying to insert
    if (!uuidRegex.test(String(prospectId)) || !uuidRegex.test(String(propertyId))) {
      console.log("Using mock handoff (non-UUID IDs detected)")
      return NextResponse.json({
        id: `handoff-${Date.now()}`,
        ...handoffData,
        timestamp: new Date().toISOString(),
        status: "pending",
      }, { status: 201 })
    }

    // Create handoff package in database
    const { data: handoff, error: handoffError } = await supabase
      .from("handoff_packages")
      .insert({
        conversation_id: conversationIdMutable,
        prospect_id: prospectId,
        prospect_name: handoffData.prospectName,
        prospect_phone: handoffData.prospectPhone,
        prospect_email: handoffData.prospectEmail,
        prospect_whatsapp: handoffData.prospectWhatsapp,
        priority: handoffData.priority,
        reason: handoffData.reason,
        summary: handoffData.summary,
        detected_needs: handoffData.detectedNeeds,
        suggested_properties: handoffData.suggestedProperties,
        qualification_score: handoffData.qualificationScore,
        conversation_context: handoffData.conversationContext,
        next_steps: handoffData.nextSteps,
        source_channel: handoffData.sourceChannel,
        suggested_follow_up_channel: handoffData.suggestedFollowUpChannel,
        status: "pending",
      })
      .select()
      .single()

    if (handoffError) {
      console.error("Error creating handoff package:", handoffError)
      return NextResponse.json({ error: handoffError.message }, { status: 500 })
    }

    return NextResponse.json(handoff, { status: 201 })
  } catch (error: any) {
    console.error("Error in POST /api/handoffs/from-appointment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

