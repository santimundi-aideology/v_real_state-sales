"use client"

import { useState } from "react"
import {
  MessageSquare,
  Phone,
  Clock,
  ChevronRight,
  Database,
  Building2,
  Calendar,
  AlertTriangle,
  Radio,
  MessageCircle,
  Mail,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { mockConversations, mockProspects, getChannelColor } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import Link from "next/link"
import type { Channel } from "@/lib/types"

const channelIcons = {
  phone: Phone,
  whatsapp: MessageCircle,
  sms: MessageSquare,
  email: Mail,
}

export function ConversationsContent() {
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0])
  const [channelFilter, setChannelFilter] = useState<Channel | "all">("all")

  const filteredConversations =
    channelFilter === "all" ? mockConversations : mockConversations.filter((c) => c.channel === channelFilter)

  return (
    <div className="h-[calc(100vh-4rem)]">
      <div className="flex h-full">
        {/* Conversation List */}
        <div className="w-full md:w-96 border-r border-border/50 flex flex-col glass-panel">
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-serif font-semibold">Conversations</h2>
              <Link href="/conversations/live">
                <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                  <Radio className="h-3.5 w-3.5" />
                  Live
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mb-3">All channel transcripts</p>
            <div className="flex gap-1.5 flex-wrap">
              <Button
                size="sm"
                variant={channelFilter === "all" ? "default" : "outline"}
                className={cn("text-xs h-7", channelFilter === "all" && "bg-primary")}
                onClick={() => setChannelFilter("all")}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={channelFilter === "phone" ? "default" : "outline"}
                className={cn("text-xs h-7 gap-1", channelFilter === "phone" && "bg-blue-600")}
                onClick={() => setChannelFilter("phone")}
              >
                <Phone className="h-3 w-3" />
                Calls
              </Button>
              <Button
                size="sm"
                variant={channelFilter === "whatsapp" ? "default" : "outline"}
                className={cn("text-xs h-7 gap-1", channelFilter === "whatsapp" && "bg-emerald-600")}
                onClick={() => setChannelFilter("whatsapp")}
              >
                <MessageCircle className="h-3 w-3" />
                WhatsApp
              </Button>
              <Button
                size="sm"
                variant={channelFilter === "sms" ? "default" : "outline"}
                className={cn("text-xs h-7 gap-1", channelFilter === "sms" && "bg-violet-600")}
                onClick={() => setChannelFilter("sms")}
              >
                <MessageSquare className="h-3 w-3" />
                SMS
              </Button>
              <Button
                size="sm"
                variant={channelFilter === "email" ? "default" : "outline"}
                className={cn("text-xs h-7 gap-1", channelFilter === "email" && "bg-amber-600")}
                onClick={() => setChannelFilter("email")}
              >
                <Mail className="h-3 w-3" />
                Email
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {filteredConversations.map((conversation) => {
                const ChannelIcon = channelIcons[conversation.channel]
                return (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all",
                      selectedConversation?.id === conversation.id
                        ? "border-primary/30 bg-primary/5 gold-glow"
                        : "border-border/50 hover:border-primary/20 hover:bg-accent/30",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <ChannelIcon
                          className={cn(
                            "h-4 w-4",
                            conversation.channel === "phone" && "text-blue-500",
                            conversation.channel === "whatsapp" && "text-emerald-500",
                            conversation.channel === "sms" && "text-violet-500",
                            conversation.channel === "email" && "text-amber-500",
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="font-medium text-sm truncate">{conversation.prospectName}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {conversation.channel === "phone"
                              ? `${Math.floor(conversation.duration / 60)} min`
                              : `${conversation.messageCount || 0} msgs`}
                          </span>
                          <Separator orientation="vertical" className="h-3" />
                          <span>{new Date(conversation.timestamp).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={cn("text-xs", getChannelColor(conversation.channel))}>
                            {conversation.channel}
                          </Badge>
                          <Badge
                            variant={conversation.outcome === "qualified" ? "default" : "outline"}
                            className={cn(
                              "text-xs",
                              conversation.outcome === "qualified" && "bg-primary/20 text-primary border-primary/30",
                              conversation.outcome === "connected" && "bg-blue-500/20 text-blue-500 border-blue-500/30",
                              conversation.outcome === "responded" &&
                                "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
                              conversation.outcome === "opened" && "bg-amber-500/20 text-amber-500 border-amber-500/30",
                              conversation.outcome === "no_answer" && "bg-muted",
                            )}
                          >
                            {conversation.outcome.replace("_", " ")}
                          </Badge>
                          {conversation.aiConfidence && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                conversation.aiConfidence === "high" && "border-emerald-500/30 text-emerald-500",
                                conversation.aiConfidence === "medium" && "border-amber-500/30 text-amber-500",
                                conversation.aiConfidence === "low" && "border-red-500/30 text-red-500",
                              )}
                            >
                              AI: {conversation.aiConfidence}
                            </Badge>
                          )}
                          {conversation.handoffSuggested && (
                            <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-500">
                              <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                              Handoff
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Transcript & Agent Timeline */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-6 border-b border-border/50 glass-panel">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-serif font-semibold">{selectedConversation.prospectName}</h3>
                      <Badge variant="outline" className={cn("text-xs", getChannelColor(selectedConversation.channel))}>
                        {channelIcons[selectedConversation.channel] && (
                          <>
                            {(() => {
                              const Icon = channelIcons[selectedConversation.channel]
                              return <Icon className="h-3 w-3 mr-1" />
                            })()}
                          </>
                        )}
                        {selectedConversation.channel}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        {mockProspects.find((p) => p.id === selectedConversation.prospectId)?.phone}
                      </div>
                      <Separator orientation="vertical" className="h-4" />
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(selectedConversation.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      <MessageCircle className="h-3.5 w-3.5" />
                      WhatsApp
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      <Phone className="h-3.5 w-3.5" />
                      Call
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      Escalate
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 grid lg:grid-cols-2 overflow-hidden">
                {/* Transcript */}
                <ScrollArea className="p-6 border-r border-border/50">
                  <div className="space-y-4">
                    <h4 className="font-serif font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                      {selectedConversation.channel === "phone"
                        ? "Call Transcript"
                        : selectedConversation.channel === "email"
                          ? "Email Thread"
                          : "Message History"}
                    </h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="mt-0.5 bg-primary/10 text-primary border-primary/30">
                            Agent
                          </Badge>
                          <div className="flex-1 text-sm leading-relaxed">
                            Good afternoon! This is the AI assistant from First Projects Holding. Am I speaking with{" "}
                            {selectedConversation.prospectName}?
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="mt-0.5">
                            Prospect
                          </Badge>
                          <div className="flex-1 text-sm leading-relaxed">
                            Yes, this is {selectedConversation.prospectName.split(" ")[0]} speaking.
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="mt-0.5 bg-primary/10 text-primary border-primary/30">
                            Agent
                          </Badge>
                          <div className="flex-1 text-sm leading-relaxed">
                            Excellent! I'm reaching out regarding our exclusive luxury property collection. I understand
                            you've expressed interest in premium real estate. Do you have a few moments to discuss?
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="mt-0.5">
                            Prospect
                          </Badge>
                          <div className="flex-1 text-sm leading-relaxed">
                            Actually yes, I'm looking for something in the 3 to 5 million SAR range. What do you have
                            available?
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="mt-0.5 bg-primary/10 text-primary border-primary/30">
                            Agent
                          </Badge>
                          <div className="flex-1 text-sm leading-relaxed">
                            Perfect! We have several stunning options in your budget. I'd particularly recommend Azure
                            Heights - a 4-bedroom villa with smart home integration, private pool, and 24/7 security.
                            Would you be interested in scheduling a private viewing?
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="mt-0.5">
                            Prospect
                          </Badge>
                          <div className="flex-1 text-sm leading-relaxed">
                            That sounds interesting. I'd like to see it. What times are available?
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                {/* Agent Actions Timeline */}
                <ScrollArea className="p-6 bg-accent/5">
                  <div className="space-y-4">
                    <h4 className="font-serif font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                      Agent Actions Timeline
                    </h4>
                    <div className="space-y-3">
                      <div className="relative pl-6 pb-6 border-l-2 border-primary/30">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-2 border-background" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Database className="h-3.5 w-3.5 text-primary" />
                            <span className="text-sm font-medium">Retrieved CRM Record</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Loaded prospect profile with preferences and history
                          </p>
                          <Badge variant="outline" className="text-xs mt-1 bg-emerald-500/10 border-emerald-500/30">
                            Completed
                          </Badge>
                        </div>
                      </div>

                      <div className="relative pl-6 pb-6 border-l-2 border-primary/30">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-2 border-background" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-primary" />
                            <span className="text-sm font-medium">Matched Properties</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Found 3 properties matching budget: 3-5M SAR, location: Riyadh
                          </p>
                          <Badge variant="outline" className="text-xs mt-1 bg-emerald-500/10 border-emerald-500/30">
                            Completed
                          </Badge>
                        </div>
                      </div>

                      <div className="relative pl-6 pb-6 border-l-2 border-primary/30">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-2 border-background" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-3.5 w-3.5 text-primary" />
                            <span className="text-sm font-medium">Asked Qualification Questions</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Confirmed budget, timeline (3-6 months), and property type
                          </p>
                          <Badge variant="outline" className="text-xs mt-1 bg-emerald-500/10 border-emerald-500/30">
                            Completed
                          </Badge>
                        </div>
                      </div>

                      <div className="relative pl-6 pb-6 border-l-2 border-primary/30">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-2 border-background" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            <span className="text-sm font-medium">Proposed Appointment</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Offered viewing slots for next week</p>
                          <Badge variant="outline" className="text-xs mt-1 bg-emerald-500/10 border-emerald-500/30">
                            Completed
                          </Badge>
                        </div>
                      </div>

                      <div className="relative pl-6">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-2 border-background gold-glow" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="h-3.5 w-3.5 text-primary" />
                            <span className="text-sm font-medium">Logged to CRM</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Updated prospect status to "Qualified"</p>
                          <Badge
                            variant="outline"
                            className="text-xs mt-1 bg-primary/10 text-primary border-primary/30"
                          >
                            In Progress
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
