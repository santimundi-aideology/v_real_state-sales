"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  MoreVertical,
  Users,
  Phone,
  Calendar,
  TrendingUp,
  Eye,
  MessageCircle,
  Mail,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { getChannelColor } from "@/lib/mock-data"
import type { Campaign } from "@/lib/types"
import { CampaignRunView } from "@/components/campaign-run-view"
import { cn } from "@/lib/utils"

const channelIcons = {
  phone: Phone,
  whatsapp: MessageCircle,
  sms: MessageSquare,
  email: Mail,
}

interface CustomerData {
  name: string
  preferred_channel: "call" | "whatsapp" | "email"
  contact: string
  language: "english" | "arabic"
  city?: string | null
  primary_segment?: string | null
  budget_max?: number | null
  property_type_pref?: string | null
}

export function CampaignsContent() {
  const [open, setOpen] = useState(false)
  const [showCampaignRun, setShowCampaignRun] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showSummaryDialog, setShowSummaryDialog] = useState(false)
  const [customerData, setCustomerData] = useState<CustomerData[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [showViewRunDialog, setShowViewRunDialog] = useState(false)
  
  // Form state
  const [campaignName, setCampaignName] = useState("")
  const [targetSegment, setTargetSegment] = useState("")
  const [activeWindow, setActiveWindow] = useState("")
  const [channels, setChannels] = useState({
    whatsapp: true,
    email: true,
  })
  const [agentScript, setAgentScript] = useState("")
  const [complianceSettings, setComplianceSettings] = useState({
    respectDNC: true,
    requireConsent: true,
    recordConversations: true,
  })

  // Fetch campaigns from API
  useEffect(() => {
    async function fetchCampaigns() {
      try {
        setLoading(true)
        const response = await fetch("/api/campaigns")
        if (!response.ok) {
          throw new Error(`Failed to fetch campaigns: ${response.status}`)
        }
        
        const result = await response.json()
        const { data } = result
        
        if (!data || !Array.isArray(data)) {
          setCampaigns([])
          setError(null)
          return
        }
        
        if (data.length === 0) {
          setCampaigns([])
          setError(null)
          return
        }
        
        // Transform database format to UI format
        const transformed: Campaign[] = data.map((campaign: any) => {
          // Map target_segment to segment display name
          const segmentMap: Record<string, string> = {
            "hnw": "High-Net-Worth",
            "investor": "Property Investors",
            "first_time": "First-Time Buyers",
            "all": "All Segments"
          }
          
          const cityMap: Record<string, string> = {
            "riyadh": "Riyadh",
            "jeddah": "Jeddah",
            "all": "All Cities"
          }
          
          let segmentDisplay = segmentMap[campaign.target_segment] || campaign.target_segment
          if (campaign.target_city && campaign.target_city !== "all") {
            segmentDisplay += `, ${cityMap[campaign.target_city] || campaign.target_city}`
          }
          
          // Calculate channel metrics from contacted_prospects
          // Handle JSONB field - might be string or already parsed
          let contactedProspects = campaign.contacted_prospects || []
          
          // If it's a string, parse it
          if (typeof contactedProspects === 'string') {
            try {
              contactedProspects = JSON.parse(contactedProspects)
            } catch (e) {
              contactedProspects = []
            }
          }
          
          // Ensure it's an array
          if (!Array.isArray(contactedProspects)) {
            contactedProspects = []
          }
          
          const channelMetrics: Campaign["channelMetrics"] = {}
          
          // Count by channel
          const channelCounts: Record<string, number> = {}
          if (Array.isArray(contactedProspects)) {
            contactedProspects.forEach((prospect: any) => {
              const channel = prospect.channel
              channelCounts[channel] = (channelCounts[channel] || 0) + 1
            })
          }
          
          // Calculate metrics per channel
          if (campaign.channels.includes("whatsapp")) {
            const whatsappCount = channelCounts["whatsapp"] || 0
            channelMetrics.whatsapp = {
              sent: whatsappCount,
              responded: Math.round(whatsappCount * (campaign.response_rate / 100)),
              rate: campaign.response_rate
            }
          }
          
          if (campaign.channels.includes("email")) {
            const emailCount = channelCounts["email"] || 0
            channelMetrics.email = {
              sent: emailCount,
              opened: Math.round(emailCount * (campaign.response_rate / 100)),
              clicked: Math.round(emailCount * (campaign.click_rate / 100)),
              rate: campaign.click_rate
            }
          }
          
          // Determine status (default to "active" since schema doesn't have status field)
          const status: Campaign["status"] = "active"
          
          return {
            id: campaign.id,
            name: campaign.name,
            segment: segmentDisplay,
            status: status,
            channels: campaign.channels || [],
            attempts: campaign.total_outreach || 0,
            connectRate: campaign.connect_rate || 0,
            bookedAppointments: campaign.booked_appointments || 0,
            createdBy: campaign.created_by,
            createdAt: campaign.created_at,
            channelMetrics: channelMetrics,
            // Store contacted_prospects for View Run dialog
            contactedProspects: Array.isArray(contactedProspects) ? contactedProspects as CustomerData[] : [],
            // Store compliance settings for View Run dialog
            respectDNC: campaign.respect_dnc ?? true,
            requireConsent: campaign.require_consent ?? true,
          } as Campaign & { contactedProspects?: CustomerData[]; respectDNC?: boolean; requireConsent?: boolean }
        })
        
        setCampaigns(transformed)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        setCampaigns([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchCampaigns()
  }, [])
  
  // Refetch campaigns after creating a new one
  const refetchCampaigns = async () => {
    try {
      const response = await fetch("/api/campaigns")
      if (!response.ok) {
        throw new Error("Failed to fetch campaigns")
      }
      
      const { data } = await response.json()
      
      const transformed: Campaign[] = data.map((campaign: any) => {
        const segmentMap: Record<string, string> = {
          "hnw": "High-Net-Worth",
          "investor": "Property Investors",
          "first_time": "First-Time Buyers",
          "all": "All Segments"
        }
        
        const cityMap: Record<string, string> = {
          "riyadh": "Riyadh",
          "jeddah": "Jeddah",
          "all": "All Cities"
        }
        
        let segmentDisplay = segmentMap[campaign.target_segment] || campaign.target_segment
        if (campaign.target_city && campaign.target_city !== "all") {
          segmentDisplay += `, ${cityMap[campaign.target_city] || campaign.target_city}`
        }
        
        const contactedProspects = campaign.contacted_prospects || []
        const channelMetrics: Campaign["channelMetrics"] = {}
        
        const channelCounts: Record<string, number> = {}
        contactedProspects.forEach((prospect: any) => {
          const channel = prospect.channel
          channelCounts[channel] = (channelCounts[channel] || 0) + 1
        })
        
        if (campaign.channels.includes("whatsapp")) {
          const whatsappCount = channelCounts["whatsapp"] || 0
          channelMetrics.whatsapp = {
            sent: whatsappCount,
            responded: Math.round(whatsappCount * (campaign.response_rate / 100)),
            rate: campaign.response_rate
          }
        }
        
        if (campaign.channels.includes("email")) {
          const emailCount = channelCounts["email"] || 0
          channelMetrics.email = {
            sent: emailCount,
            opened: Math.round(emailCount * (campaign.response_rate / 100)),
            clicked: Math.round(emailCount * (campaign.click_rate / 100)),
            rate: campaign.click_rate
          }
        }
        
        return {
          id: campaign.id,
          name: campaign.name,
          segment: segmentDisplay,
          status: "active" as Campaign["status"],
          channels: campaign.channels || [],
          attempts: campaign.total_outreach || 0,
          connectRate: campaign.connect_rate || 0,
          bookedAppointments: campaign.booked_appointments || 0,
          createdBy: campaign.created_by,
          createdAt: campaign.created_at,
          channelMetrics: channelMetrics,
          // Store contacted_prospects for View Run dialog
          contactedProspects: contactedProspects as CustomerData[],
          // Store compliance settings for View Run dialog
          respectDNC: campaign.respect_dnc ?? true,
          requireConsent: campaign.require_consent ?? true,
        } as Campaign & { contactedProspects?: CustomerData[]; respectDNC?: boolean; requireConsent?: boolean }
      })
      
      setCampaigns(transformed)
    } catch (err) {
      // Silently handle refetch errors
    }
  }

  const handleStartCampaign = (campaign: Campaign & { contactedProspects?: CustomerData[] }) => {
    setSelectedCampaign(campaign)
    // Access contactedProspects from the campaign object
    const campaignWithProspects = campaign as any
    const prospects = campaignWithProspects.contactedProspects || []
    
    setCustomerData(prospects)
    setShowViewRunDialog(true)
  }

  const handleCreateCampaign = async () => {
    // Get current user role from localStorage
    const currentRole = typeof window !== "undefined" 
      ? localStorage.getItem("fph-current-role") || "system"
      : "system"
    
    // Build the formatted message
    const selectedChannels = Object.entries(channels)
      .filter(([_, selected]) => selected)
      .map(([channel]) => {
        const channelNames: Record<string, string> = {
          whatsapp: "WhatsApp",
          email: "Email",
        }
        return channelNames[channel] || channel
      })

    // Format compliance settings in LLM-friendly way
    const complianceOptions = []
    if (complianceSettings.respectDNC) {
      complianceOptions.push("require dnc")
    } else {
      complianceOptions.push("dnc not required")
    }
    if (complianceSettings.requireConsent) {
      complianceOptions.push("require consent")
    } else {
      complianceOptions.push("consent not required")
    }
    if (complianceSettings.recordConversations) {
      complianceOptions.push("record conversations")
    }

    // Format segment display name
    const segmentNames: Record<string, string> = {
      "hnw-riyadh": "High-Net-Worth, Riyadh",
      "hnw-jeddah": "High-Net-Worth, Jeddah",
      investors: "Property Investors",
      "first-home": "First-Time Buyers",
    }

    // Format window display name
    const windowNames: Record<string, string> = {
      morning: "9 AM - 12 PM",
      afternoon: "2 PM - 5 PM",
      evening: "6 PM - 9 PM",
    }

    const parts = []
    
    if (campaignName) parts.push(`campaign name: ${campaignName}`)
    if (targetSegment) parts.push(`target segment: ${segmentNames[targetSegment] || targetSegment}`)
    if (activeWindow) parts.push(`active window: ${windowNames[activeWindow] || activeWindow}`)
    if (selectedChannels.length > 0) parts.push(`channels: ${selectedChannels.join(", ")}`)
    if (complianceOptions.length > 0) parts.push(`compliance settings: ${complianceOptions.join(", ")}`)

    const message = `Find and query prospects matching these campaign criteria: ${parts.join("; ")}`
    
    setIsCreating(true)
    
    try {
      const response = await fetch("http://localhost:8000/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: message,
          agent_persona: agentScript || "", // Empty string, backend will use default
          user_role: currentRole,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // Check if response contains customer_data (new format)
      if (data && typeof data === 'object' && data.customer_data && Array.isArray(data.customer_data)) {
        // New format with customer data
        setCustomerData(data.customer_data)
        setShowSummaryDialog(true)
      } else if (data && typeof data === 'object' && Array.isArray(data)) {
        // Handle array response (if backend returns array directly)
        setCustomerData(data)
        setShowSummaryDialog(true)
      }
      
      // Close dialog on success (form will reset on close)
      setOpen(false)
      
      // Refetch campaigns to show the new one
      await refetchCampaigns()
    } catch (error) {
      alert("Failed to create campaign. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  if (showCampaignRun) {
    return <CampaignRunView onClose={() => setShowCampaignRun(false)} />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-balance">Campaigns</h1>
          <p className="text-muted-foreground mt-1">Manage AI-powered multichannel outreach campaigns</p>
        </div>
        <Dialog 
          open={open} 
          onOpenChange={(isOpen) => {
            setOpen(isOpen)
            if (!isOpen) {
              // Reset form when dialog closes
              setCampaignName("")
              setTargetSegment("")
              setActiveWindow("")
              setChannels({ whatsapp: true, email: true })
              setAgentScript("")
              setComplianceSettings({ respectDNC: true, requireConsent: true, recordConversations: true })
            }
          }}
        >
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 gold-glow">
              <Plus className="h-4 w-4" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Create New Campaign</DialogTitle>
              <DialogDescription>Configure your AI multichannel campaign parameters</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g., Riyadh Q1 Luxury Villas" 
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="segment">Target Segment</Label>
                  <Select value={targetSegment} onValueChange={setTargetSegment}>
                    <SelectTrigger id="segment">
                      <SelectValue placeholder="Select segment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hnw-riyadh">High-Net-Worth, Riyadh</SelectItem>
                      <SelectItem value="hnw-jeddah">High-Net-Worth, Jeddah</SelectItem>
                      <SelectItem value="investors">Property Investors</SelectItem>
                      <SelectItem value="first-home">First-Time Buyers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="window">Active Window</Label>
                  <Select value={activeWindow} onValueChange={setActiveWindow}>
                    <SelectTrigger id="window">
                      <SelectValue placeholder="Select time window" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">9 AM - 12 PM</SelectItem>
                      <SelectItem value="afternoon">2 PM - 5 PM</SelectItem>
                      <SelectItem value="evening">6 PM - 9 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-3">
                <Label>Channels</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50">
                    <Checkbox 
                      id="channel-whatsapp" 
                      checked={channels.whatsapp}
                      onCheckedChange={(checked) => setChannels({ ...channels, whatsapp: checked as boolean })}
                    />
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-emerald-500" />
                      <Label htmlFor="channel-whatsapp" className="text-sm font-normal cursor-pointer">
                        WhatsApp
                      </Label>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50">
                    <Checkbox 
                      id="channel-email" 
                      checked={channels.email}
                      onCheckedChange={(checked) => setChannels({ ...channels, email: checked as boolean })}
                    />
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-amber-500" />
                      <Label htmlFor="channel-email" className="text-sm font-normal cursor-pointer">
                        Email
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="script">Agent Script / Persona</Label>
                <Textarea
                  id="script"
                  placeholder="Describe the agent's tone and talking points..."
                  rows={4}
                  className="resize-none"
                  value={agentScript}
                  onChange={(e) => setAgentScript(e.target.value)}
                />
              </div>
              <div className="space-y-4">
                <Label>Compliance Settings</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">Respect DNC List</div>
                      <div className="text-xs text-muted-foreground">Skip numbers on do-not-call registry</div>
                    </div>
                    <Switch 
                      checked={complianceSettings.respectDNC}
                      onCheckedChange={(checked) => setComplianceSettings({ ...complianceSettings, respectDNC: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">Require Consent</div>
                      <div className="text-xs text-muted-foreground">Only contact prospects who opted in</div>
                    </div>
                    <Switch 
                      checked={complianceSettings.requireConsent}
                      onCheckedChange={(checked) => setComplianceSettings({ ...complianceSettings, requireConsent: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">Record Conversations</div>
                      <div className="text-xs text-muted-foreground">Save all interactions for QA review</div>
                    </div>
                    <Switch 
                      checked={complianceSettings.recordConversations}
                      onCheckedChange={(checked) => setComplianceSettings({ ...complianceSettings, recordConversations: checked })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setOpen(false)} disabled={isCreating}>
                  Cancel
                </Button>
                <Button 
                  className="bg-primary hover:bg-primary/90" 
                  onClick={handleCreateCampaign}
                  disabled={isCreating}
                >
                  {isCreating ? "Creating..." : "Create & Launch"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Customer Summary Dialog */}
        <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
          <DialogContent className="glass-panel max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Campaign Summary</DialogTitle>
              <DialogDescription>
                Summary of prospects contacted during this campaign
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="text-sm text-muted-foreground">
                Total prospects contacted: <span className="font-semibold text-foreground">{customerData.length}</span>
              </div>
              <div className="space-y-3">
                {customerData.map((customer, index) => {
                  // Map backend channel names to frontend icon keys
                  const channelMap: Record<string, keyof typeof channelIcons> = {
                    call: "phone",
                    whatsapp: "whatsapp",
                    email: "email",
                    sms: "sms",
                  }
                  const iconKey = channelMap[customer.preferred_channel] || "whatsapp"
                  const ChannelIcon = channelIcons[iconKey] || MessageCircle
                  const channelColors: Record<string, string> = {
                    phone: "text-blue-500",
                    call: "text-blue-500",
                    whatsapp: "text-emerald-500",
                    email: "text-amber-500",
                    sms: "text-violet-500",
                  }
                  
                  return (
                    <div
                      key={index}
                      className="p-4 rounded-lg border border-border/50 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{customer.name}</h4>
                            <Badge variant="outline" className={cn("text-xs", channelColors[customer.preferred_channel])}>
                              <ChannelIcon className="h-3 w-3 mr-1" />
                              {customer.preferred_channel}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {customer.language}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Contact:</span>
                              <span>{customer.contact}</span>
                            </div>
                            {customer.city && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">City:</span>
                                <span className="capitalize">{customer.city}</span>
                              </div>
                            )}
                            {customer.primary_segment && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Segment:</span>
                                <span className="capitalize">
                                  {customer.primary_segment === "hnw" ? "High-Net-Worth" :
                                   customer.primary_segment === "investor" ? "Property Investor" :
                                   customer.primary_segment === "first_time" ? "First-Time Buyer" :
                                   customer.primary_segment}
                                </span>
                              </div>
                            )}
                            {customer.budget_max && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Budget Max:</span>
                                <span>${customer.budget_max.toLocaleString()}</span>
                              </div>
                            )}
                            {customer.property_type_pref && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Property Type:</span>
                                <span className="capitalize">{customer.property_type_pref}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Run Dialog */}
        <Dialog open={showViewRunDialog} onOpenChange={setShowViewRunDialog}>
          <DialogContent className="glass-panel !w-[50vw] !max-w-[60vw] sm:!max-w-[95vw] h-[70vh] max-h-[70vh] overflow-hidden flex flex-col p-6">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="font-serif text-2xl flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                {selectedCampaign ? selectedCampaign.name : "Campaign Run"}
              </DialogTitle>
              <DialogDescription className="text-base">
                Detailed breakdown of prospects contacted during this campaign run
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto">
            {customerData.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-muted-foreground font-medium">
                  No prospects were contacted in this campaign run.
                </div>
                <div className="text-xs text-muted-foreground/70 max-w-md mx-auto">
                  This may indicate the campaign was created before prospects were contacted, or the workflow did not complete.
                </div>
              </div>
            ) : (
              <div className="space-y-4 flex-1 overflow-hidden flex flex-col min-h-0">
                {/* Compliance Settings */}
                {selectedCampaign && (
                  <Card className="glass-panel border-border/50 bg-muted/20 flex-shrink-0">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-6 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            (selectedCampaign as any).respectDNC !== false 
                              ? "bg-emerald-500" 
                              : "bg-gray-500"
                          )} />
                          <span className="text-sm font-medium">
                            DNC Required: {(selectedCampaign as any).respectDNC !== false ? "Yes" : "No"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            (selectedCampaign as any).requireConsent !== false 
                              ? "bg-emerald-500" 
                              : "bg-gray-500"
                          )} />
                          <span className="text-sm font-medium">
                            Consent Required: {(selectedCampaign as any).requireConsent !== false ? "Yes" : "No"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-sm font-medium">
                            Prospects Contacted: Only opted-in or unknown consent status
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Summary Statistics */}
                <div className="grid grid-cols-4 gap-4 flex-shrink-0">
                  <Card className="glass-panel border-primary/20 bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{customerData.length}</div>
                          <div className="text-xs text-muted-foreground">Total Contacted</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="glass-panel border-emerald-500/20 bg-emerald-500/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                          <MessageCircle className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">
                            {customerData.filter(c => {
                              // Check both 'channel' and 'preferred_channel' fields, or infer from contact type
                              const channel = (c as any).channel?.toLowerCase() || c.preferred_channel?.toLowerCase()
                              if (channel === "whatsapp") return true
                              // If no channel specified but contact is a phone number, assume WhatsApp
                              if (!channel && /^\+?\d/.test(c.contact)) return true
                              return false
                            }).length}
                          </div>
                          <div className="text-xs text-muted-foreground">WhatsApp</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="glass-panel border-amber-500/20 bg-amber-500/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10">
                          <Mail className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">
                            {customerData.filter(c => {
                              // Check both 'channel' and 'preferred_channel' fields, or infer from contact type
                              const channel = (c as any).channel?.toLowerCase() || c.preferred_channel?.toLowerCase()
                              if (channel === "email") return true
                              // If no channel specified but contact is an email, assume email
                              if (!channel && /@/.test(c.contact)) return true
                              return false
                            }).length}
                          </div>
                          <div className="text-xs text-muted-foreground">Email</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="glass-panel border-blue-500/20 bg-blue-500/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <MessageSquare className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">
                            {customerData.filter(c => c.language === "arabic").length} / {customerData.filter(c => c.language === "english").length}
                          </div>
                          <div className="text-xs text-muted-foreground">Arabic / English</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Prospects List */}
                <div className="space-y-3 flex-1 overflow-hidden flex flex-col min-h-0">
                  <div className="flex items-center justify-between flex-shrink-0 pb-2">
                    <h3 className="font-semibold text-lg">Contacted Prospects</h3>
                    <Badge variant="outline" className="text-sm">
                      {customerData.length} {customerData.length === 1 ? 'prospect' : 'prospects'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3 flex-1 overflow-y-auto pr-2 min-h-0">
                    {customerData.map((customer, index) => {
                      // Map backend channel names to frontend icon keys
                      const channelMap: Record<string, keyof typeof channelIcons> = {
                        call: "phone",
                        whatsapp: "whatsapp",
                        email: "email",
                        sms: "sms",
                      }
                      const iconKey = channelMap[customer.preferred_channel] || "whatsapp"
                      const ChannelIcon = channelIcons[iconKey] || MessageCircle
                      
                      const channelStyles: Record<string, { bg: string; border: string; text: string; icon: string }> = {
                        whatsapp: {
                          bg: "bg-emerald-500/10",
                          border: "border-emerald-500/30",
                          text: "text-emerald-500",
                          icon: "bg-emerald-500/20"
                        },
                        email: {
                          bg: "bg-amber-500/10",
                          border: "border-amber-500/30",
                          text: "text-amber-500",
                          icon: "bg-amber-500/20"
                        },
                        call: {
                          bg: "bg-blue-500/10",
                          border: "border-blue-500/30",
                          text: "text-blue-500",
                          icon: "bg-blue-500/20"
                        },
                        phone: {
                          bg: "bg-blue-500/10",
                          border: "border-blue-500/30",
                          text: "text-blue-500",
                          icon: "bg-blue-500/20"
                        },
                        sms: {
                          bg: "bg-violet-500/10",
                          border: "border-violet-500/30",
                          text: "text-violet-500",
                          icon: "bg-violet-500/20"
                        }
                      }
                      
                      // Get the actual channel used (from 'channel' field in contacted_prospects)
                      // Also ensure we have all fields from contacted_prospects
                      const customerData = customer as any
                      const actualChannel = customerData.channel || customer.preferred_channel || "whatsapp"
                      const channelForDisplay = actualChannel.toLowerCase()
                      const displayIconKey = channelMap[channelForDisplay] || "whatsapp"
                      const DisplayChannelIcon = channelIcons[displayIconKey] || MessageCircle
                      const styles = channelStyles[channelForDisplay] || channelStyles.whatsapp
                      
                      // Ensure we have all fields from contacted_prospects
                      const budgetMax = customerData.budget_max ?? customer.budget_max
                      const propertyTypePref = customerData.property_type_pref ?? customer.property_type_pref
                      const city = customerData.city ?? customer.city
                      const primarySegment = customerData.primary_segment ?? customer.primary_segment
                      const dnc = customerData.dnc ?? null
                      const consentStatus = customerData.consent_status ?? null
                      
                      return (
                        <Card
                          key={index}
                          className={cn("glass-panel transition-all hover:shadow-lg hover:scale-[1.01] flex-shrink-0", styles.border, styles.bg)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              {/* Channel Icon */}
                              <div className={cn("p-3 rounded-lg flex-shrink-0", styles.icon)}>
                                <DisplayChannelIcon className={cn("h-5 w-5", styles.text)} />
                              </div>
                              
                              {/* Customer Info */}
                              <div className="flex-1 space-y-3 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="space-y-1 flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-semibold text-lg whitespace-nowrap">{customer.name}</h4>
                                      <Badge variant="outline" className={cn("text-xs font-medium flex-shrink-0 px-2 py-1", styles.text, styles.border)}>
                                        <DisplayChannelIcon className={cn("h-3 w-3 mr-1.5", styles.text)} />
                                        Contacted via {channelForDisplay.charAt(0).toUpperCase() + channelForDisplay.slice(1)}
                                      </Badge>
                                      <Badge 
                                        variant="outline" 
                                        className={cn(
                                          "text-xs font-medium flex-shrink-0 px-2 py-1",
                                          customer.language === "arabic" 
                                            ? "text-blue-500 border-blue-500/30 bg-blue-500/10" 
                                            : "text-purple-500 border-purple-500/30 bg-purple-500/10"
                                        )}
                                      >
                                        {customer.language === "arabic" ? "🇸🇦" : "🇬🇧"} Contacted in {customer.language === "arabic" ? "Arabic" : "English"}
                                      </Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                                      {channelForDisplay === "email" ? (
                                        <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                      ) : (
                                        <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                      )}
                                      <span className="font-mono truncate">{customer.contact}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Details Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-border/50">
                                  {city && (
                                    <div className="space-y-1">
                                      <div className="text-xs text-muted-foreground font-medium">City</div>
                                      <div className="text-sm font-medium capitalize">{city}</div>
                                    </div>
                                  )}
                                  {primarySegment && (
                                    <div className="space-y-1">
                                      <div className="text-xs text-muted-foreground font-medium">Segment</div>
                                      <div className="text-sm font-medium">
                                        {primarySegment === "hnw" ? "High-Net-Worth" :
                                         primarySegment === "investor" ? "Property Investor" :
                                         primarySegment === "first_time" ? "First-Time Buyer" :
                                         primarySegment}
                                      </div>
                                    </div>
                                  )}
                                  {budgetMax && (
                                    <div className="space-y-1">
                                      <div className="text-xs text-muted-foreground font-medium">Budget Max</div>
                                      <div className="text-sm font-medium">${typeof budgetMax === 'number' ? budgetMax.toLocaleString() : budgetMax}</div>
                                    </div>
                                  )}
                                  {propertyTypePref && (
                                    <div className="space-y-1">
                                      <div className="text-xs text-muted-foreground font-medium">Preferred Property Type</div>
                                      <div className="text-sm font-medium capitalize">{propertyTypePref}</div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Compliance Status */}
                                <div className="flex items-center gap-4 pt-2 border-t border-border/50">
                                  {dnc !== null && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground font-medium">DNC:</span>
                                      <Badge 
                                        variant="outline" 
                                        className={cn(
                                          "text-xs font-medium px-2 py-0.5",
                                          dnc === true 
                                            ? "text-red-500 border-red-500/30 bg-red-500/10" 
                                            : "text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
                                        )}
                                      >
                                        {dnc === true ? "On DNC List" : "Not on DNC List"}
                                      </Badge>
                                    </div>
                                  )}
                                  {consentStatus && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground font-medium">Consent:</span>
                                      <Badge 
                                        variant="outline" 
                                        className={cn(
                                          "text-xs font-medium px-2 py-0.5",
                                          consentStatus === "opted_in" 
                                            ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
                                            : consentStatus === "opted_out"
                                            ? "text-red-500 border-red-500/30 bg-red-500/10"
                                            : "text-amber-500 border-amber-500/30 bg-amber-500/10"
                                        )}
                                      >
                                        {consentStatus === "opted_in" ? "Opted In" :
                                         consentStatus === "opted_out" ? "Opted Out" :
                                         consentStatus === "unknown" ? "Unknown" :
                                         consentStatus}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaign Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.filter(c => c.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Outreach</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + (c.attempts || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Response Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.length > 0
                ? Math.round(
                    campaigns.reduce((sum, c) => sum + (c.connectRate || 0), 0) / campaigns.length
                  )
                : 0}%
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + (c.bookedAppointments || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="font-serif">All Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading campaigns...</div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">Error: {error}</div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No campaigns found. Create your first campaign above.</div>
            ) : (
              campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{campaign.name}</h3>
                    <Badge
                      variant={campaign.status === "active" ? "default" : "outline"}
                      className={
                        campaign.status === "active" ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" : ""
                      }
                    >
                      {campaign.status}
                    </Badge>
                    <div className="flex gap-1">
                      {campaign.channels.map((channel) => {
                        const ChannelIcon = channelIcons[channel]
                        return (
                          <Badge key={channel} variant="outline" className={cn("text-xs", getChannelColor(channel))}>
                            <ChannelIcon className="h-3 w-3" />
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {campaign.segment}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {campaign.attempts} outreach
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {campaign.connectRate}% response
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {campaign.bookedAppointments} booked
                    </div>
                  </div>
                  {campaign.channelMetrics && (
                    <div className="flex gap-3 mt-2">
                      {campaign.channelMetrics.phone && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3 text-blue-500" />
                          {campaign.channelMetrics.phone.rate}% connect
                        </div>
                      )}
                      {campaign.channelMetrics.whatsapp && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <MessageCircle className="h-3 w-3 text-emerald-500" />
                          {campaign.channelMetrics.whatsapp.rate}% response
                        </div>
                      )}
                      {campaign.channelMetrics.sms && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <MessageSquare className="h-3 w-3 text-violet-500" />
                          {campaign.channelMetrics.sms.rate}% response
                        </div>
                      )}
                      {campaign.channelMetrics.email && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3 text-amber-500" />
                          {campaign.channelMetrics.email.rate}% click
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {campaign.status === "active" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 bg-transparent border-primary/30 text-primary"
                      onClick={() => handleStartCampaign(campaign)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Run
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit Campaign</DropdownMenuItem>
                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
