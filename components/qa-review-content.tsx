"use client"

import { useState } from "react"
import { ClipboardCheck, Star, AlertTriangle, CheckCircle, Play } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { mockCalls } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const qaCriteria = [
  { id: "greeting", name: "Professional Greeting", weight: 10 },
  { id: "needs", name: "Needs Discovery", weight: 20 },
  { id: "presentation", name: "Property Presentation", weight: 20 },
  { id: "objections", name: "Objection Handling", weight: 15 },
  { id: "closing", name: "Closing Technique", weight: 20 },
  { id: "compliance", name: "Compliance Adherence", weight: 15 },
]

export function QAReviewContent() {
  const [selectedCall, setSelectedCall] = useState(mockCalls[0])
  const [scores, setScores] = useState<Record<string, number>>({})

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-balance">QA Review</h1>
        <p className="text-muted-foreground mt-1">Quality assurance and call scoring</p>
      </div>

      {/* QA Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.7/10</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Issues Flagged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reviews Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Call Queue */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="font-serif">Review Queue</CardTitle>
            <CardDescription>Calls awaiting quality review</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-2">
                {mockCalls.map((call) => (
                  <button
                    key={call.id}
                    onClick={() => setSelectedCall(call)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all",
                      selectedCall?.id === call.id
                        ? "border-primary/30 bg-primary/5 gold-glow"
                        : "border-border/50 hover:border-primary/20 hover:bg-accent/30",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <ClipboardCheck className="h-4 w-4 text-primary mt-1" />
                      <div className="flex-1 space-y-1">
                        <div className="font-medium text-sm">{call.prospectName}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(call.timestamp).toLocaleString()} • {Math.floor(call.duration / 60)} min
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            call.sentiment === "positive" && "border-emerald-500/30 text-emerald-500",
                          )}
                        >
                          {call.sentiment}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* QA Scorecard */}
        <Card className="glass-panel">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-serif">QA Scorecard</CardTitle>
                <CardDescription>Score call quality metrics</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Play className="h-3.5 w-3.5" />
                Play Call
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-3 rounded-lg bg-accent/20 border border-border/50">
              <div className="font-semibold text-sm">{selectedCall.prospectName}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(selectedCall.timestamp).toLocaleString()}
              </div>
            </div>

            <div className="space-y-4">
              {qaCriteria.map((criterion) => (
                <div key={criterion.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{criterion.name}</Label>
                    <span className="text-xs text-muted-foreground">Weight: {criterion.weight}%</span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => setScores({ ...scores, [criterion.id]: score })}
                        className={cn(
                          "flex-1 h-10 rounded-lg border transition-all",
                          scores[criterion.id] === score
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-border/50 hover:border-primary/30",
                        )}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Coaching Notes</Label>
              <Textarea placeholder="Add feedback and coaching points..." rows={4} className="resize-none" />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 gap-2 bg-transparent text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Flag Issue
              </Button>
              <Button className="flex-1 gap-2 bg-primary hover:bg-primary/90">
                <CheckCircle className="h-4 w-4" />
                Submit Review
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reviews */}
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="font-serif">Recent Reviews</CardTitle>
          <CardDescription>Completed quality assessments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              prospect: "Khalid Abdullah",
              score: 9.2,
              reviewer: "Ahmed Al-Mansour",
              date: "2024-01-15",
              status: "passed",
            },
            {
              prospect: "Fatima Al-Zahrani",
              score: 7.8,
              reviewer: "Sarah Al-Rashid",
              date: "2024-01-15",
              status: "passed",
            },
            {
              prospect: "Mohammed Al-Farsi",
              score: 6.5,
              reviewer: "Ahmed Al-Mansour",
              date: "2024-01-14",
              status: "flagged",
            },
          ].map((review, idx) => (
            <div key={idx} className="flex items-center gap-4 p-3 rounded-lg border border-border/50">
              <div className="flex-1 space-y-1">
                <div className="font-medium text-sm">{review.prospect}</div>
                <div className="text-xs text-muted-foreground">
                  Reviewed by {review.reviewer} • {review.date}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                    <span className="font-semibold">{review.score}/10</span>
                  </div>
                </div>
                {review.status === "passed" ? (
                  <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Passed
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-500/30 text-amber-500">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Flagged
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
