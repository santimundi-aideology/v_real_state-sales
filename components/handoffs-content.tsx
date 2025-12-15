"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  UserPlus,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Mail,
  DollarSign,
  ArrowRight,
  User,
  X,
  MessageCircle,
  MessageSquare,
} from "lucide-react"
import { mockHandoffPackages, mockUsers, getChannelColor } from "@/lib/mock-data"
import type { HandoffPackage, Channel } from "@/lib/types"
import { cn } from "@/lib/utils"

const channelIcons: Record<Channel, React.ElementType> = {
  phone: Phone,
  whatsapp: MessageCircle,
  sms: MessageSquare,
  email: Mail,
}

export function HandoffsContent() {
  const [selectedTab, setSelectedTab] = React.useState("pending")
  const [selectedHandoff, setSelectedHandoff] = React.useState<HandoffPackage | null>(null)

  const pendingHandoffs = mockHandoffPackages.filter((h) => h.status === "pending")
  const claimedHandoffs = mockHandoffPackages.filter((h) => h.status === "claimed")
  const completedHandoffs = mockHandoffPackages.filter((h) => h.status === "completed")

  const handleClaim = (handoffId: string) => {
    console.log("Claiming handoff:", handoffId)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "low":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    return `${Math.floor(diffInHours / 24)}d ago`
  }

  const renderHandoffCard = (handoff: HandoffPackage) => {
    const claimedByUser = handoff.claimedBy ? mockUsers.find((u) => u.name === handoff.claimedBy) : null
    const SourceChannelIcon = channelIcons[handoff.sourceChannel]
    const FollowUpChannelIcon = handoff.suggestedFollowUpChannel ? channelIcons[handoff.suggestedFollowUpChannel] : null

    return (
      <Card key={handoff.id} className="glass-panel border p-5 hover:border-primary/30 transition-all gold-glow-hover">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-lg mb-1 truncate">{handoff.prospectName}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(handoff.timestamp)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-xs", getChannelColor(handoff.sourceChannel))}>
                <SourceChannelIcon className="h-3 w-3 mr-1" />
                {handoff.sourceChannel}
              </Badge>
              <Badge variant="outline" className={getPriorityColor(handoff.priority)}>
                {handoff.priority}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span className="truncate">{handoff.prospectPhone}</span>
            </div>
            {handoff.prospectWhatsapp && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                <span className="truncate">{handoff.prospectWhatsapp}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{handoff.prospectEmail}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-accent/50 border border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-1">Handoff Reason</p>
            <p className="text-sm text-foreground">{handoff.reason}</p>
          </div>

          {handoff.suggestedFollowUpChannel && FollowUpChannelIcon && (
            <div
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg border",
                getChannelColor(handoff.suggestedFollowUpChannel).replace("text-", "bg-").replace("/20", "/5"),
              )}
            >
              <FollowUpChannelIcon className="h-4 w-4" />
              <span className="text-xs">Suggested follow-up: {handoff.suggestedFollowUpChannel}</span>
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">AI Score</p>
                <p className="text-sm font-bold text-primary">{handoff.qualificationScore.overallScore}/100</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Budget Fit</p>
                <p className="text-sm font-bold text-foreground">{handoff.qualificationScore.budgetFitScore}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-xs text-muted-foreground">Urgency</p>
                <p className="text-sm font-bold text-foreground capitalize">{handoff.qualificationScore.urgency}</p>
              </div>
            </div>
          </div>

          {claimedByUser && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <User className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-blue-500">Claimed by {handoff.claimedBy}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedHandoff(handoff)}
              className="flex-1 bg-transparent"
            >
              View Details
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            {handoff.status === "pending" && (
              <Button
                size="sm"
                onClick={() => handleClaim(handoff.id)}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Claim Lead
              </Button>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl glass-panel border flex items-center justify-center gold-glow">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">Handoff Packages</h1>
            <p className="text-sm text-muted-foreground">AI-suggested leads requiring human expertise</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-panel border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
              <p className="text-2xl font-bold text-foreground mt-1">{pendingHandoffs.length}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
          </div>
        </Card>

        <Card className="glass-panel border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Claimed</p>
              <p className="text-2xl font-bold text-foreground mt-1">{claimedHandoffs.length}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="glass-panel border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-foreground mt-1">{completedHandoffs.length}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="glass-panel border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">High Priority</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {mockHandoffPackages.filter((h) => h.priority === "high").length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="glass-panel border">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingHandoffs.length})
          </TabsTrigger>
          <TabsTrigger value="claimed" className="gap-2">
            <User className="h-4 w-4" />
            Claimed ({claimedHandoffs.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Completed ({completedHandoffs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingHandoffs.length === 0 ? (
            <Card className="glass-panel border p-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending handoffs</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{pendingHandoffs.map(renderHandoffCard)}</div>
          )}
        </TabsContent>

        <TabsContent value="claimed" className="space-y-4 mt-6">
          {claimedHandoffs.length === 0 ? (
            <Card className="glass-panel border p-12 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No claimed handoffs</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{claimedHandoffs.map(renderHandoffCard)}</div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {completedHandoffs.length === 0 ? (
            <Card className="glass-panel border p-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No completed handoffs</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{completedHandoffs.map(renderHandoffCard)}</div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Modal */}
      {selectedHandoff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="glass-panel border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-serif font-bold">{selectedHandoff.prospectName}</h2>
                <p className="text-sm text-muted-foreground">{selectedHandoff.prospectEmail}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("text-xs", getChannelColor(selectedHandoff.sourceChannel))}>
                  {(() => {
                    const Icon = channelIcons[selectedHandoff.sourceChannel]
                    return <Icon className="h-3 w-3 mr-1" />
                  })()}
                  via {selectedHandoff.sourceChannel}
                </Badge>
                <Button variant="ghost" size="icon" onClick={() => setSelectedHandoff(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Summary</h3>
                <p className="text-sm leading-relaxed">{selectedHandoff.summary}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Detected Needs</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedHandoff.detectedNeeds.map((need, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {need}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Suggested Properties</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedHandoff.suggestedProperties.map((prop, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs bg-primary/10 border-primary/30 text-primary">
                      {prop}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Conversation Context</h3>
                <p className="text-sm leading-relaxed p-3 rounded-lg bg-accent/50 border border-border/50">
                  {selectedHandoff.conversationContext}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Recommended Next Steps</h3>
                <ul className="space-y-2">
                  {selectedHandoff.nextSteps.map((step, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <ArrowRight className="h-3.5 w-3.5 text-primary" />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>

              {selectedHandoff.suggestedFollowUpChannel && (
                <div
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    getChannelColor(selectedHandoff.suggestedFollowUpChannel)
                      .replace("text-", "bg-")
                      .replace("/20", "/5"),
                  )}
                >
                  {(() => {
                    const Icon = channelIcons[selectedHandoff.suggestedFollowUpChannel]
                    return <Icon className="h-5 w-5" />
                  })()}
                  <div>
                    <p className="text-sm font-medium">Suggested Follow-up Channel</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {selectedHandoff.suggestedFollowUpChannel}
                    </p>
                  </div>
                </div>
              )}

              {selectedHandoff.status === "pending" && (
                <Button
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => {
                    handleClaim(selectedHandoff.id)
                    setSelectedHandoff(null)
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Claim This Lead
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
