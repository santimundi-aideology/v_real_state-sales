"use client"

import * as React from "react"
import { MessageCircle, X, Mic, Sparkles, User, Headphones } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export interface VoiceAgent {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  status: "available" | "preparing" | "unavailable"
}

const voiceAgents: VoiceAgent[] = [
  {
    id: "agent-1",
    name: "Option 1",
    description: "Expert in property sales and customer relations",
    icon: <User className="h-5 w-5" />,
    color: "bg-blue-500",
    status: "preparing",
  },
  {
    id: "agent-2",
    name: "Option 2",
    description: "Specialized in high-end properties and VIP clients",
    icon: <Sparkles className="h-5 w-5" />,
    color: "bg-purple-500",
    status: "preparing",
  },
  {
    id: "agent-3",
    name: "Option 3",
    description: "Focused on understanding client needs and preferences",
    icon: <Headphones className="h-5 w-5" />,
    color: "bg-emerald-500",
    status: "preparing",
  },
  {
    id: "agent-4",
    name: "Option 4",
    description: "Handles inquiries and provides general assistance",
    icon: <Mic className="h-5 w-5" />,
    color: "bg-amber-500",
    status: "preparing",
  },
]

export function VoiceAgentSelector() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedAgent, setSelectedAgent] = React.useState<VoiceAgent | null>(null)

  const handleAgentSelect = (agent: VoiceAgent) => {
    if (agent.status === "available") {
      setSelectedAgent(agent)
      // TODO: Initialize the selected voice agent here
      console.log("Selected agent:", agent.id)
      // Optionally close the sheet after selection
      // setIsOpen(false)
    } else if (agent.status === "preparing") {
      // Show feedback that agent is still being prepared
      setSelectedAgent(null)
      console.log("Agent is still being prepared:", agent.id)
    }
  }

  const availableAgents = voiceAgents.filter((agent) => agent.status === "available")
  const hasAvailableAgents = availableAgents.length > 0

  return (
    <>
      {/* Floating Chat Bubble */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className={cn(
            "h-16 w-16 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300",
            "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
            "flex items-center justify-center",
            "relative group",
            "border-2 border-primary/20",
            "hover:scale-110 active:scale-95"
          )}
          aria-label="Open voice agent selector"
        >
          <MessageCircle className="h-7 w-7 text-primary-foreground" />
          {hasAvailableAgents && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-background animate-pulse flex items-center justify-center">
              <span className="h-2 w-2 rounded-full bg-white" />
            </span>
          )}
        </Button>
      </div>

      {/* Agent Selection Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:w-[400px] p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="px-6 pt-6 pb-4 border-b">
              <SheetTitle className="text-xl font-semibold">Select Voice Agent</SheetTitle>
              <SheetDescription>
                Choose an AI voice agent to assist you with your real estate needs
              </SheetDescription>
            </SheetHeader>

            {/* Agent List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {voiceAgents.map((agent) => {
                const isPreparing = agent.status === "preparing"
                const isSelected = selectedAgent?.id === agent.id

                return (
                  <button
                    key={agent.id}
                    onClick={() => handleAgentSelect(agent)}
                    disabled={isPreparing}
                    className={cn(
                      "w-full p-4 rounded-xl border-2 transition-all duration-200",
                      "text-left hover:shadow-lg hover:scale-[1.02]",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20"
                        : "border-border bg-card hover:border-primary/50 hover:bg-accent/50",
                      isPreparing && "opacity-60 cursor-not-allowed",
                      !isPreparing && "cursor-pointer"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Agent Icon */}
                      <div
                        className={cn(
                          "h-14 w-14 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md",
                          "transition-transform duration-200",
                          agent.color,
                          isPreparing && "opacity-50",
                          !isPreparing && "group-hover:scale-110"
                        )}
                      >
                        {agent.icon}
                      </div>

                      {/* Agent Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="font-semibold text-base">{agent.name}</h3>
                          {isPreparing && (
                            <span className="px-2.5 py-1 text-xs rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              Preparing
                            </span>
                          )}
                          {agent.status === "available" && (
                            <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Available
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {agent.description}
                        </p>
                      </div>
                    </div>

                    {/* Selected Indicator */}
                    {isSelected && (
                      <div className="mt-4 pt-4 border-t border-primary/20 bg-primary/5 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                          <p className="text-xs text-primary font-medium">
                            Agent selected - Ready to connect
                          </p>
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-muted/30">
              <p className="text-xs text-muted-foreground text-center">
                Voice agents are being configured. They will be available soon.
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

