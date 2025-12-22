"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  PhoneOff,
  UserCheck,
  Calendar,
  ChevronRight,
  TrendingUp,
  Lightbulb,
  CheckCircle2,
  Clock,
  Radio,
  Phone,
  MessageCircle,
  Mail,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockLiveConversation, mockLiveWhatsApp, getChannelColor } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import type { Channel } from "@/lib/types"

const channelIcons: Record<Channel, React.ElementType> = {
  phone: Phone,
  whatsapp: MessageCircle,
  sms: MessageSquare,
  email: Mail,
}

export function LiveCallContent() {
  const [activeTab, setActiveTab] = useState<"phone" | "whatsapp">("phone")
  const [phoneDuration, setPhoneDuration] = useState(mockLiveConversation.duration)
  const phoneCall = mockLiveConversation
  const whatsappChat = mockLiveWhatsApp

  useEffect(() => {
    const interval = setInterval(() => {
      setPhoneDuration((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const currentConversation = activeTab === "phone" ? phoneCall : whatsappChat
  const ChannelIcon = channelIcons[currentConversation.channel]

  return (
    <div className="h-[calc(100vh-4rem)]">
      <div className="flex h-full">
        {/* Main Conversation Area */}
        <div className="flex-1 flex flex-col">
          {/* Header with channel tabs */}
          <div className="p-6 border-b border-border/50 glass-panel">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-serif font-bold">Live Monitor</h2>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "phone" | "whatsapp")}>
                  <TabsList className="h-8">
                    <TabsTrigger value="phone" className="gap-1.5 text-xs h-7 px-3">
                      <Phone className="h-3 w-3" />
                      Call
                      <Badge
                        variant="outline"
                        className="ml-1 h-4 px-1 text-[10px] bg-emerald-500/20 border-emerald-500/30 text-emerald-500"
                      >
                        Live
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="whatsapp" className="gap-1.5 text-xs h-7 px-3">
                      <MessageCircle className="h-3 w-3" />
                      WhatsApp
                      <Badge
                        variant="outline"
                        className="ml-1 h-4 px-1 text-[10px] bg-emerald-500/20 border-emerald-500/30 text-emerald-500"
                      >
                        Live
                      </Badge>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <Radio className="h-5 w-5 text-emerald-500 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl font-serif font-bold">{currentConversation.prospectName}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={cn("text-xs", getChannelColor(currentConversation.channel))}>
                        <ChannelIcon className="h-3 w-3 mr-1" />
                        {currentConversation.channel}
                      </Badge>
                      <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
                        Live
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {activeTab === "phone"
                          ? formatTime(phoneDuration)
                          : `${currentConversation.transcript.length} msgs`}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90">
                  <UserCheck className="h-4 w-4" />
                  Handoff Now
                </Button>
                <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <Calendar className="h-4 w-4" />
                  Book Appointment
                </Button>
                {activeTab === "phone" && (
                  <Button size="lg" variant="destructive" className="gap-2">
                    <PhoneOff className="h-4 w-4" />
                    End Call
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 grid lg:grid-cols-2 overflow-hidden">
            {/* Real-time Transcript */}
            <div className="flex flex-col border-r border-border/50">
              <div className="p-4 border-b border-border/50 bg-accent/5">
                <h3 className="font-serif font-semibold flex items-center gap-2">
                  <Radio className="h-4 w-4 text-primary" />
                  {activeTab === "phone" ? "Real-Time Transcript" : "Live Chat"}
                </h3>
              </div>
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {currentConversation.transcript.map((msg, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-start gap-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "mt-0.5 shrink-0",
                            msg.speaker === "agent" && "bg-primary/10 text-primary border-primary/30",
                          )}
                        >
                          {msg.speaker === "agent" ? "AI Agent" : "Prospect"}
                        </Badge>
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground mb-1">{msg.timestamp}</div>
                          <div className="text-sm leading-relaxed">{msg.message}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Typing indicator */}
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded-full bg-primary/50 animate-bounce" />
                      <div className="h-2 w-2 rounded-full bg-primary/50 animate-bounce [animation-delay:0.2s]" />
                      <div className="h-2 w-2 rounded-full bg-primary/50 animate-bounce [animation-delay:0.4s]" />
                    </div>
                    <span>{activeTab === "phone" ? "AI is listening..." : "AI is typing..."}</span>
                  </div>
                </div>
              </ScrollArea>
            </div>

            {/* Detected Entities & Insights */}
            <div className="flex flex-col">
              <div className="p-4 border-b border-border/50 bg-accent/5">
                <h3 className="font-serif font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Conversation Intelligence
                </h3>
              </div>
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {/* Detected Entities */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Detected Information
                    </h4>
                    <div className="space-y-2">
                      {currentConversation.detectedEntities.map((entity, idx) => (
                        <Card key={idx} className="glass-panel">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <div className="text-xs text-muted-foreground capitalize">{entity.type}</div>
                                <div className="font-medium text-sm">{entity.value}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Progress value={entity.confidence * 100} className="w-16 h-2" />
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(entity.confidence * 100)}%
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Next Best Question */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      AI Suggestion
                    </h4>
                    <Card className="glass-panel border-amber-500/30 bg-amber-500/5">
                      <CardContent className="p-4">
                        <p className="text-sm leading-relaxed">{currentConversation.nextBestQuestion}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  {/* Sentiment */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Conversation Sentiment
                    </h4>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={cn(
                          "text-sm py-1.5 px-3",
                          currentConversation.sentiment === "positive" &&
                            "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
                          currentConversation.sentiment === "neutral" &&
                            "bg-blue-500/20 text-blue-500 border-blue-500/30",
                          currentConversation.sentiment === "negative" &&
                            "bg-red-500/20 text-red-500 border-red-500/30",
                        )}
                      >
                        {currentConversation.sentiment === "positive" && "Positive"}
                        {currentConversation.sentiment === "neutral" && "Neutral"}
                        {currentConversation.sentiment === "negative" && "Negative"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">Prospect is engaged and interested</span>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Agent Plan & Tools Panel */}
        <div className="w-80 border-l border-border/50 glass-panel flex flex-col">
          <div className="p-4 border-b border-border/50">
            <h3 className="font-serif font-semibold">Agent Execution Plan</h3>
            <p className="text-xs text-muted-foreground mt-1">AI workflow progress</p>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {currentConversation.agentPlan.map((step) => (
                <Card
                  key={step.step}
                  className={cn("glass-panel", step.status === "in_progress" && "ring-2 ring-primary/30")}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0",
                          step.status === "completed" && "bg-emerald-500/20 border-emerald-500/30",
                          step.status === "in_progress" && "bg-primary/20 border-primary/30 gold-glow",
                          step.status === "pending" && "bg-muted border-border",
                        )}
                      >
                        {step.status === "completed" ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : step.status === "in_progress" ? (
                          <ChevronRight className="h-4 w-4 text-primary animate-pulse" />
                        ) : (
                          <span className="text-xs text-muted-foreground">{step.step}</span>
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="font-medium text-sm">{step.name}</div>
                        <div className="text-xs text-muted-foreground">{step.description}</div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs mt-1",
                            step.status === "completed" && "bg-emerald-500/10 border-emerald-500/30 text-emerald-500",
                            step.status === "in_progress" && "bg-primary/10 border-primary/30 text-primary",
                            step.status === "pending" && "bg-muted",
                          )}
                        >
                          {step.status === "completed" && "Completed"}
                          {step.status === "in_progress" && "In Progress"}
                          {step.status === "pending" && "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
