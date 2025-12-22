import type { Appointment, HandoffPackage, Prospect, Property, Conversation } from "@/lib/types"

/**
 * Generate a handoff package from an appointment/visit
 */
export function generateHandoffFromAppointment(
  appointment: any, // Can be Appointment type or database row
  prospect: any, // Can be Prospect type or database row
  property: any, // Can be Property type or database row
  conversation?: any // Can be Conversation type or database row
): Omit<HandoffPackage, "id" | "timestamp" | "status"> {
  // Normalize field names (handle both camelCase and snake_case)
  const appointmentStatus = appointment.status || appointment.appointment_status
  const scheduledDate = appointment.scheduledDate || appointment.scheduled_date
  const appointmentNotes = appointment.notes || appointment.appointment_notes
  const prospectName = prospect.name || prospect.prospect_name
  const propertyName = property.name || property.property_name
  const prospectBudget = prospect.budget || prospect.prospect_budget
  const prospectTimeline = prospect.timeline || prospect.prospect_timeline
  const prospectPreferredChannel = prospect.preferredChannel || prospect.preferred_channel
  const prospectId = prospect.id || prospect.prospect_id
  const propertyId = property.id || property.property_id
  const conversationId = conversation?.id || conversation?.conversation_id || `appt-${appointment.id || appointment.appointment_id}`
  const conversationChannel = conversation?.channel || conversation?.conversation_channel || appointment.sourceChannel || appointment.source_channel || "phone"
  const conversationTimestamp = conversation?.timestamp || conversation?.conversation_timestamp
  const conversationDuration = conversation?.duration || conversation?.conversation_duration || 0

  // Determine priority based on appointment status and prospect data
  const priority: "high" | "medium" | "low" = 
    appointmentStatus === "scheduled" && prospectBudget 
      ? (parseFloat(String(prospectBudget).replace(/[^\d.]/g, "")) > 5000000 ? "high" : "medium")
      : appointmentStatus === "completed" ? "high" : "medium"

  // Generate summary
  const summary = `Visit scheduled for ${prospectName} to view ${propertyName} on ${new Date(scheduledDate).toLocaleDateString()}. ${appointmentNotes || "Ready for property viewing."}`

  // Detect needs from prospect data
  const detectedNeeds: string[] = []
  if (prospectBudget) detectedNeeds.push(`Budget: ${prospectBudget}`)
  if (prospectTimeline) detectedNeeds.push(`Timeline: ${prospectTimeline}`)
  const bedrooms = property.bedrooms || property.property_bedrooms
  if (bedrooms) detectedNeeds.push(`${bedrooms} bedrooms`)
  const propertyType = property.type || property.property_type
  if (propertyType) detectedNeeds.push(`Property type: ${propertyType}`)
  if (prospectPreferredChannel) detectedNeeds.push(`Preferred contact: ${prospectPreferredChannel}`)

  // Suggested properties (include the main one plus similar)
  const suggestedProperties = [propertyName]

  // Generate conversation context
  const conversationContext = conversation
    ? `Previous conversation via ${conversationChannel} on ${conversationTimestamp ? new Date(conversationTimestamp).toLocaleDateString() : "recently"}. ${conversation.transcript || conversation.transcript_messages ? `Transcript available.` : `Duration: ${Math.floor(conversationDuration / 60)} minutes.`}`
    : `Appointment scheduled for property viewing. ${appointmentNotes || "No previous conversation recorded."}`

  // Generate next steps
  const nextSteps: string[] = [
    "Confirm appointment details",
    "Prepare property presentation materials",
    "Review prospect preferences and budget",
  ]
  
  if (appointmentStatus === "scheduled") {
    nextSteps.push("Send location and parking instructions")
    nextSteps.push("Prepare viewing checklist")
  } else if (appointmentStatus === "completed") {
    nextSteps.push("Follow up on visit feedback")
    nextSteps.push("Send additional property information if requested")
    nextSteps.push("Schedule follow-up meeting if needed")
  }

  // Determine follow-up channel
  const suggestedFollowUpChannel = prospectPreferredChannel || "phone"

  // Generate qualification score
  const propertyPriceRange = property.priceRange || property.price_range
  const timelineStr = String(prospectTimeline || "")
  const qualificationScore = {
    intentScore: appointmentStatus === "completed" ? 90 : 75,
    budgetFitScore: propertyPriceRange ? 85 : 70,
    urgency: timelineStr.includes("1-3") ? "high" : timelineStr.includes("3-6") ? "medium" : "low" as "high" | "medium" | "low",
    propertyMatchConfidence: 85,
    riskFlags: appointmentStatus === "no_show" ? ["Previous no-show"] : [],
    overallScore: appointmentStatus === "completed" ? 88 : 75,
  }

  return {
    conversationId,
    prospectId,
    prospectName,
    prospectPhone: prospect.phone || prospect.prospect_phone,
    prospectEmail: prospect.email || prospect.prospect_email,
    prospectWhatsapp: prospect.whatsapp || prospect.prospect_whatsapp,
    priority,
    reason: `Property viewing appointment - ${appointment.status}`,
    summary,
    detectedNeeds,
    suggestedProperties,
    qualificationScore,
    conversationContext,
    nextSteps,
    sourceChannel: conversationChannel as "phone" | "whatsapp" | "sms" | "email",
    suggestedFollowUpChannel: suggestedFollowUpChannel as "phone" | "whatsapp" | "sms" | "email",
  }
}

