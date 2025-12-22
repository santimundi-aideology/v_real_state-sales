export type UserRole = "sales_rep" | "sales_manager" | "admin" | "qa_supervisor" | "compliance_officer" | "operations"

export type Channel = "phone" | "whatsapp" | "sms" | "email"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  lastActive: string
  status: "active" | "inactive"
}

export interface Prospect {
  id: string
  name: string
  email: string
  phone: string
  whatsapp?: string
  budget?: string
  city?: string
  timeline?: string
  status: "new" | "contacted" | "qualified" | "appointment_set" | "closed" | "lost"
  assignedTo?: string
  lastContact?: string
  preferredChannel?: Channel
}

export interface Property {
  id: string
  name: string
  city: string
  priceRange: string
  bedrooms: number
  type: "villa" | "apartment" | "penthouse" | "townhouse"
  status: "available" | "reserved" | "sold"
  imageUrl?: string
  description: string
  features: string[]
}

export interface Conversation {
  id: string
  prospectId: string
  prospectName: string
  campaignId?: string
  timestamp: string
  duration: number
  channel: Channel
  outcome:
    | "connected"
    | "voicemail"
    | "no_answer"
    | "busy"
    | "qualified"
    | "not_interested"
    | "responded"
    | "opened"
    | "clicked"
  sentiment?: "positive" | "neutral" | "negative"
  transcript?: string
  agentActions?: AgentAction[]
  aiConfidence?: "high" | "medium" | "low"
  handoffSuggested?: boolean
  qualificationScore?: QualificationScore
  messageCount?: number
}

// Keep Call as alias for backward compatibility
export type Call = Conversation

export interface AgentAction {
  timestamp: string
  action: string
  details: string
  status: "completed" | "pending" | "failed"
}

export interface Campaign {
  id: string
  name: string
  segment: string
  status: "draft" | "active" | "paused" | "completed"
  channels: Channel[]
  attempts: number
  connectRate: number
  bookedAppointments: number
  createdBy: string
  createdAt: string
  channelMetrics?: {
    phone?: { sent: number; connected: number; rate: number }
    whatsapp?: { sent: number; responded: number; rate: number }
    sms?: { sent: number; responded: number; rate: number }
    email?: { sent: number; opened: number; clicked: number; rate: number }
  }
}

export interface Appointment {
  id: string
  prospectId: string
  prospectName: string
  propertyId: string
  propertyName: string
  assignedRepId: string
  assignedRepName: string
  scheduledDate: string
  location: string
  status: "scheduled" | "completed" | "no_show" | "rescheduled"
  notes?: string
  sourceChannel?: Channel
}

export interface Integration {
  id: string
  name: string
  type: "crm" | "telephony" | "calendar" | "messaging" | "email"
  status: "connected" | "disconnected" | "error"
  lastSync?: string
  icon?: string
}

export interface DetectedEntity {
  type: "budget" | "area" | "bedrooms" | "timeline" | "intent"
  value: string
  confidence: number
}

export interface LiveConversation {
  id: string
  prospectId: string
  prospectName: string
  channel: Channel
  status: "dialing" | "ringing" | "connected" | "ended" | "typing" | "waiting"
  duration: number
  transcript: TranscriptMessage[]
  detectedEntities: DetectedEntity[]
  nextBestQuestion: string
  agentPlan: AgentPlanStep[]
  sentiment: "positive" | "neutral" | "negative"
}

// Keep LiveCall as alias
export type LiveCall = LiveConversation

export interface TranscriptMessage {
  timestamp: string
  speaker: "agent" | "prospect"
  message: string
  type?: "text" | "image" | "document" | "location"
}

export interface AgentPlanStep {
  step: number
  name: string
  description: string
  status: "completed" | "in_progress" | "pending"
}

export interface QualificationScore {
  intentScore: number
  budgetFitScore: number
  urgency: "high" | "medium" | "low"
  propertyMatchConfidence: number
  riskFlags: string[]
  overallScore: number
}

export interface CampaignRun {
  id: string
  campaignId: string
  campaignName: string
  status: "running" | "paused" | "completed"
  queue: QueuedLead[]
  currentConversation?: LiveConversation
  metrics: CampaignRunMetrics
  startedAt: string
}

export interface QueuedLead {
  id: string
  prospectId: string
  prospectName: string
  phone: string
  channel: Channel
  whatsapp?: string
  email?: string
  status: "queued" | "dialing" | "connected" | "completed" | "failed" | "sending" | "delivered" | "responded"
  attempts: number
}

export interface CampaignRunMetrics {
  totalLeads: number
  contacted: number
  connected: number
  voicemails: number
  noAnswers: number
  booked: number
  connectRate: number
  byChannel?: {
    phone?: { contacted: number; connected: number }
    whatsapp?: { sent: number; responded: number }
    sms?: { sent: number; responded: number }
    email?: { sent: number; opened: number }
  }
}

export interface RoutingRule {
  id: string
  name: string
  conditions: RoutingCondition[]
  assignTo: string | "auto"
  priority: number
  enabled: boolean
}

export interface RoutingCondition {
  field: "city" | "budget" | "propertyType" | "language" | "urgency" | "channel"
  operator: "equals" | "contains" | "greaterThan" | "lessThan"
  value: string
}

export interface HandoffPackage {
  id: string
  conversationId: string
  prospectId: string
  prospectName: string
  prospectPhone: string
  prospectEmail: string
  prospectWhatsapp?: string
  timestamp: string
  priority: "high" | "medium" | "low"
  reason: string
  summary: string
  detectedNeeds: string[]
  suggestedProperties: string[]
  qualificationScore: QualificationScore
  conversationContext: string
  nextSteps: string[]
  status: "pending" | "claimed" | "completed" | "expired"
  claimedBy?: string
  claimedAt?: string
  sourceChannel: Channel
  suggestedFollowUpChannel?: Channel
}
