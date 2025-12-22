"use client"

import { useState } from "react"
import {
  Plus,
  Play,
  Pause,
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
import { mockCampaigns, getChannelColor } from "@/lib/mock-data"
import { CampaignRunView } from "@/components/campaign-run-view"
import { cn } from "@/lib/utils"

const channelIcons = {
  phone: Phone,
  whatsapp: MessageCircle,
  sms: MessageSquare,
  email: Mail,
}

export function CampaignsContent() {
  const [open, setOpen] = useState(false)
  const [showCampaignRun, setShowCampaignRun] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  // Form state
  const [campaignName, setCampaignName] = useState("")
  const [targetSegment, setTargetSegment] = useState("")
  const [activeWindow, setActiveWindow] = useState("")
  const [channels, setChannels] = useState({
    phone: true,
    whatsapp: true,
    sms: false,
    email: true,
  })
  const [agentScript, setAgentScript] = useState("")
  const [complianceSettings, setComplianceSettings] = useState({
    respectDNC: true,
    requireConsent: true,
    recordConversations: true,
  })

  const handleStartCampaign = () => {
    setShowCampaignRun(true)
  }

  const handleCreateCampaign = async () => {
    // Build the formatted message
    const selectedChannels = Object.entries(channels)
      .filter(([_, selected]) => selected)
      .map(([channel]) => {
        const channelNames: Record<string, string> = {
          phone: "Phone Calls",
          whatsapp: "WhatsApp",
          sms: "SMS",
          email: "Email",
        }
        return channelNames[channel] || channel
      })

    const complianceOptions = []
    if (complianceSettings.respectDNC) complianceOptions.push("Respect DNC List")
    if (complianceSettings.requireConsent) complianceOptions.push("Require Consent")
    if (complianceSettings.recordConversations) complianceOptions.push("Record Conversations")

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
    if (agentScript) parts.push(`agent script: ${agentScript}`)
    if (complianceOptions.length > 0) parts.push(`compliance settings: ${complianceOptions.join(", ")}`)

    const message = `Create a campaign for the following: ${parts.join("; ")}`
    
    setIsCreating(true)
    
    try {
      const response = await fetch("http://localhost:8000/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: message,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Campaign creation response:", data)
      
      // Close dialog on success (form will reset on close)
      setOpen(false)
    } catch (error) {
      console.error("Error creating campaign:", error)
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
              setChannels({ phone: true, whatsapp: true, sms: false, email: true })
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
                      id="channel-phone" 
                      checked={channels.phone}
                      onCheckedChange={(checked) => setChannels({ ...channels, phone: checked as boolean })}
                    />
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-blue-500" />
                      <Label htmlFor="channel-phone" className="text-sm font-normal cursor-pointer">
                        Phone Calls
                      </Label>
                    </div>
                  </div>
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
                      id="channel-sms" 
                      checked={channels.sms}
                      onCheckedChange={(checked) => setChannels({ ...channels, sms: checked as boolean })}
                    />
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-violet-500" />
                      <Label htmlFor="channel-sms" className="text-sm font-normal cursor-pointer">
                        SMS
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
      </div>

      {/* Campaign Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Outreach</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,847</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Response Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">52%</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">428</div>
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
            {mockCampaigns.map((campaign) => (
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
                      onClick={handleStartCampaign}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Run
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    {campaign.status === "active" ? (
                      <>
                        <Pause className="h-3.5 w-3.5" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        Resume
                      </>
                    )}
                  </Button>
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
