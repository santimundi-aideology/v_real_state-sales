"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ArrowLeft, Phone, Calendar, Radio, Clock, MessageCircle, Mail, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { mockCampaignRun, getChannelColor } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import type { Channel } from "@/lib/types"

interface CampaignRunViewProps {
  onClose: () => void
}

const channelIcons: Record<Channel, React.ElementType> = {
  phone: Phone,
  whatsapp: MessageCircle,
  sms: MessageSquare,
  email: Mail,
}

export function CampaignRunView({ onClose }: CampaignRunViewProps) {
  const [run] = useState(mockCampaignRun)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const startTime = new Date(run.startedAt).getTime()
    const interval = setInterval(() => {
      const now = Date.now()
      setElapsed(Math.floor((now - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [run.startedAt])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-serif font-bold">{run.campaignName}</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
                Campaign Running
              </Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(elapsed)} elapsed
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="lg">
            Pause Campaign
          </Button>
          <Button variant="destructive" size="lg">
            Stop Campaign
          </Button>
        </div>
      </div>

      {/* Metrics - Updated for multichannel */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{run.metrics.totalLeads}</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contacted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{run.metrics.contacted}</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Responded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{run.metrics.connected}</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Response Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{run.metrics.connectRate}%</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Booked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{run.metrics.booked}</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">By Channel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {run.metrics.byChannel?.phone && (
                <Badge variant="outline" className="text-xs bg-blue-500/10 border-blue-500/30 text-blue-500">
                  <Phone className="h-2.5 w-2.5 mr-1" />
                  {run.metrics.byChannel.phone.connected}
                </Badge>
              )}
              {run.metrics.byChannel?.whatsapp && (
                <Badge variant="outline" className="text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-500">
                  <MessageCircle className="h-2.5 w-2.5 mr-1" />
                  {run.metrics.byChannel.whatsapp.responded}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Outreach Queue - Updated for multichannel */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Outreach Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {run.queue.map((lead) => {
                  const ChannelIcon = channelIcons[lead.channel]
                  return (
                    <div
                      key={lead.id}
                      className={cn(
                        "p-3 rounded-lg border transition-all",
                        (lead.status === "connected" || lead.status === "responded") &&
                          "border-emerald-500/30 bg-emerald-500/5",
                        (lead.status === "dialing" || lead.status === "sending") &&
                          "border-primary/30 bg-primary/5 animate-pulse",
                        lead.status === "queued" && "border-border/50",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{lead.prospectName}</div>
                          <div className="text-xs text-muted-foreground">
                            {lead.channel === "phone" && lead.phone}
                            {lead.channel === "whatsapp" && (lead.whatsapp || lead.phone)}
                            {lead.channel === "email" && lead.email}
                            {lead.channel === "sms" && lead.phone}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("text-xs", getChannelColor(lead.channel))}>
                            <ChannelIcon className="h-2.5 w-2.5 mr-1" />
                            {lead.channel}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              (lead.status === "connected" || lead.status === "responded") &&
                                "bg-emerald-500/20 border-emerald-500/30 text-emerald-500",
                              (lead.status === "dialing" || lead.status === "sending") &&
                                "bg-primary/20 border-primary/30 text-primary",
                            )}
                          >
                            {(lead.status === "connected" || lead.status === "responded") && (
                              <Radio className="h-2.5 w-2.5 mr-1" />
                            )}
                            {lead.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Current Conversation Status */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <Radio className="h-5 w-5 text-emerald-500 animate-pulse" />
              Active Conversation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {run.currentConversation ? (
              <>
                <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold text-lg">{run.currentConversation.prospectName}</div>
                      <div className="text-sm text-muted-foreground">
                        {run.currentConversation.channel === "phone"
                          ? `Duration: ${formatTime(run.currentConversation.duration)}`
                          : `${run.currentConversation.transcript.length} messages`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn("text-xs", getChannelColor(run.currentConversation.channel))}
                      >
                        {(() => {
                          const Icon = channelIcons[run.currentConversation.channel]
                          return <Icon className="h-3 w-3 mr-1" />
                        })()}
                        {run.currentConversation.channel}
                      </Badge>
                      <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
                        Active
                      </Badge>
                    </div>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Latest Messages
                  </h4>
                  <ScrollArea className="h-48">
                    <div className="space-y-3">
                      {run.currentConversation.transcript.slice(-3).map((msg, idx) => (
                        <div key={idx} className="text-sm">
                          <div className="flex items-start gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs shrink-0",
                                msg.speaker === "agent" && "bg-primary/10 text-primary border-primary/30",
                              )}
                            >
                              {msg.speaker === "agent" ? "AI" : "Prospect"}
                            </Badge>
                            <p className="text-sm leading-relaxed">{msg.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Detected Entities
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {run.currentConversation.detectedEntities.slice(0, 3).map((entity, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {entity.type}: {entity.value}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active conversation</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Channel Statistics */}
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="font-serif">Channel Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {run.metrics.byChannel?.phone && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 text-blue-500" />
                  <span>Phone Calls</span>
                </div>
                <div className="text-2xl font-bold">{run.metrics.byChannel.phone.connected}</div>
                <div className="text-xs text-muted-foreground">{run.metrics.byChannel.phone.contacted} contacted</div>
                <Progress
                  value={(run.metrics.byChannel.phone.connected / run.metrics.byChannel.phone.contacted) * 100}
                  className="h-2"
                />
              </div>
            )}
            {run.metrics.byChannel?.whatsapp && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageCircle className="h-4 w-4 text-emerald-500" />
                  <span>WhatsApp</span>
                </div>
                <div className="text-2xl font-bold">{run.metrics.byChannel.whatsapp.responded}</div>
                <div className="text-xs text-muted-foreground">{run.metrics.byChannel.whatsapp.sent} sent</div>
                <Progress
                  value={(run.metrics.byChannel.whatsapp.responded / run.metrics.byChannel.whatsapp.sent) * 100}
                  className="h-2"
                />
              </div>
            )}
            {run.metrics.byChannel?.email && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 text-amber-500" />
                  <span>Email</span>
                </div>
                <div className="text-2xl font-bold">{run.metrics.byChannel.email.opened}</div>
                <div className="text-xs text-muted-foreground">{run.metrics.byChannel.email.sent} sent</div>
                <Progress
                  value={(run.metrics.byChannel.email.opened / run.metrics.byChannel.email.sent) * 100}
                  className="h-2"
                />
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Appointments Booked</span>
              </div>
              <div className="text-2xl font-bold text-primary">{run.metrics.booked}</div>
              <div className="text-xs text-muted-foreground">across all channels</div>
              <Progress value={(run.metrics.booked / run.metrics.totalLeads) * 100} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
