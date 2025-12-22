"use client"

import {
  TrendingUp,
  Phone,
  UserCheck,
  CalendarCheck,
  ArrowUpRight,
  PlayCircle,
  Plug2,
  MessageCircle,
  Mail,
  MessageSquare,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { mockAppointments, mockConversations, getChannelColor } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const channelIcons = {
  phone: Phone,
  whatsapp: MessageCircle,
  sms: MessageSquare,
  email: Mail,
}

export function DashboardContent() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-balance">Command Center</h1>
          <p className="text-muted-foreground mt-1">Real-time AI sales agent operations across all channels</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="lg" className="gap-2 bg-transparent">
            <Plug2 className="h-4 w-4" />
            Connect CRM
          </Button>
          <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 gold-glow">
            <PlayCircle className="h-4 w-4" />
            Start Campaign
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversations Today</CardTitle>
            <MessageSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2,847</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs bg-blue-500/10 border-blue-500/30 text-blue-500">
                <Phone className="h-2.5 w-2.5 mr-1" />
                1,247
              </Badge>
              <Badge variant="outline" className="text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-500">
                <MessageCircle className="h-2.5 w-2.5 mr-1" />
                1,200
              </Badge>
              <Badge variant="outline" className="text-xs bg-amber-500/10 border-amber-500/30 text-amber-500">
                <Mail className="h-2.5 w-2.5 mr-1" />
                400
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Response Rate</CardTitle>
            <UserCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">58%</div>
            <div className="flex items-center gap-1 text-xs text-emerald-500 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>+12% from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Qualified Leads</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">287</div>
            <div className="flex items-center gap-1 text-xs text-emerald-500 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>+18% conversion</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Appointments</CardTitle>
            <CalendarCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">127</div>
            <div className="flex items-center gap-1 text-xs text-emerald-500 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>44% booking rate</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="font-serif">Conversion Funnel</CardTitle>
            <CardDescription>Today's multichannel pipeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Outreach Sent</span>
                <span className="font-medium">2,847</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Engaged / Responded</span>
                <span className="font-medium">1,651 (58%)</span>
              </div>
              <Progress value={58} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Qualified</span>
                <span className="font-medium">287 (17%)</span>
              </div>
              <Progress value={17} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Booked</span>
                <span className="font-medium">127 (44%)</span>
              </div>
              <Progress value={8} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="font-serif">Agent Status</CardTitle>
            <CardDescription>Current AI agent activity across channels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <div className="font-medium text-sm flex items-center gap-2">
                    Agent-A12
                    <Badge variant="outline" className="text-xs bg-blue-500/10 border-blue-500/30 text-blue-500">
                      <Phone className="h-2.5 w-2.5 mr-1" />
                      Call
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">Speaking with: Khalid Abdullah</div>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <div>
                  <div className="font-medium text-sm flex items-center gap-2">
                    Agent-B07
                    <Badge
                      variant="outline"
                      className="text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                    >
                      <MessageCircle className="h-2.5 w-2.5 mr-1" />
                      WhatsApp
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">Chatting: Fatima Al-Zahrani</div>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                Typing
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <div>
                  <div className="font-medium text-sm flex items-center gap-2">
                    Agent-C15
                    <Badge variant="outline" className="text-xs bg-amber-500/10 border-amber-500/30 text-amber-500">
                      <Mail className="h-2.5 w-2.5 mr-1" />
                      Email
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">Sending follow-up sequence...</div>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                Sending
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="font-serif">Upcoming Appointments</CardTitle>
            <CardDescription>Next face-to-face meetings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockAppointments.slice(0, 3).map((appointment) => {
                const ChannelIcon = appointment.sourceChannel ? channelIcons[appointment.sourceChannel] : Phone
                return (
                  <div key={appointment.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/50">
                    <CalendarCheck className="h-4 w-4 text-primary mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <div className="font-medium text-sm">{appointment.prospectName}</div>
                      <div className="text-xs text-muted-foreground">{appointment.propertyName}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{new Date(appointment.scheduledDate).toLocaleDateString()}</span>
                        <Separator orientation="vertical" className="h-3" />
                        <span>{appointment.assignedRepName}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className="text-xs">
                        {appointment.status}
                      </Badge>
                      {appointment.sourceChannel && (
                        <Badge variant="outline" className={cn("text-xs", getChannelColor(appointment.sourceChannel))}>
                          <ChannelIcon className="h-2.5 w-2.5 mr-1" />
                          {appointment.sourceChannel}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="font-serif">Recent Conversations</CardTitle>
            <CardDescription>Latest AI agent interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockConversations.slice(0, 3).map((conversation) => {
                const ChannelIcon = channelIcons[conversation.channel]
                return (
                  <div key={conversation.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/50">
                    <ChannelIcon className="h-4 w-4 text-primary mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <div className="font-medium text-sm">{conversation.prospectName}</div>
                      <div className="text-xs text-muted-foreground">
                        {conversation.channel === "phone"
                          ? `${Math.floor(conversation.duration / 60)} min call`
                          : `${conversation.messageCount || 0} messages`}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{new Date(conversation.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={conversation.outcome === "qualified" ? "default" : "outline"}
                        className={
                          conversation.outcome === "qualified" ? "bg-primary/20 text-primary border-primary/30" : ""
                        }
                      >
                        {conversation.outcome}
                      </Badge>
                      <Badge variant="outline" className={cn("text-xs", getChannelColor(conversation.channel))}>
                        {conversation.channel}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
