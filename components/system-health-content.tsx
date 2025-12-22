"use client"

import { Activity, Database, Phone, Calendar, Webhook, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { mockIntegrations } from "@/lib/mock-data"

export function SystemHealthContent() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-balance">System Health</h1>
        <p className="text-muted-foreground mt-1">Monitor integrations, services, and infrastructure</p>
      </div>

      {/* Overall Health */}
      <Card className="glass-panel border-emerald-500/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Activity className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <CardTitle className="font-serif">System Status: Operational</CardTitle>
              <CardDescription>All systems running normally</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <div className="text-sm text-muted-foreground">Uptime</div>
              <div className="text-2xl font-bold text-emerald-500">99.97%</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Active Agents</div>
              <div className="text-2xl font-bold">12/15</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">API Response</div>
              <div className="text-2xl font-bold">147ms</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Error Rate</div>
              <div className="text-2xl font-bold">0.03%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Status */}
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="font-serif">Integration Status</CardTitle>
          <CardDescription>Health of connected services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockIntegrations.map((integration) => {
            const icons = {
              crm: Database,
              telephony: Phone,
              calendar: Calendar,
            }
            const Icon = icons[integration.type as keyof typeof icons] || Database

            return (
              <div key={integration.id} className="flex items-center gap-4 p-4 rounded-xl border border-border/50">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{integration.name}</h4>
                    {integration.status === "connected" ? (
                      <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-500/30 text-amber-500">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {integration.status}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="text-xs text-muted-foreground">
                      {integration.lastSync ? `Last sync: ${integration.lastSync}` : "Not synced"}
                    </div>
                    {integration.status === "connected" && (
                      <>
                        <div className="text-xs text-muted-foreground">Latency: 142ms</div>
                        <div className="text-xs text-emerald-500">Uptime: 99.9%</div>
                      </>
                    )}
                  </div>
                </div>
                <Progress value={integration.status === "connected" ? 100 : 0} className="w-24 h-2" />
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Webhook Events */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="font-serif">Webhook Event Log</CardTitle>
            <CardDescription>Recent webhook deliveries</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {[
                  {
                    event: "appointment.booked",
                    status: "delivered",
                    timestamp: "2024-01-15 14:32:15",
                    response: 200,
                  },
                  {
                    event: "lead.qualified",
                    status: "delivered",
                    timestamp: "2024-01-15 14:28:42",
                    response: 200,
                  },
                  {
                    event: "call.completed",
                    status: "delivered",
                    timestamp: "2024-01-15 14:25:18",
                    response: 200,
                  },
                  {
                    event: "appointment.completed",
                    status: "failed",
                    timestamp: "2024-01-15 14:20:03",
                    response: 500,
                  },
                  {
                    event: "lead.qualified",
                    status: "delivered",
                    timestamp: "2024-01-15 14:15:47",
                    response: 200,
                  },
                ].map((log, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-border/50">
                    <Webhook className="h-4 w-4 text-primary mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{log.event}</span>
                        {log.status === "delivered" ? (
                          <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 text-xs">
                            {log.response}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-red-500/30 text-red-500 text-xs">
                            {log.response}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{log.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Error Log */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="font-serif">Error & Retry Log</CardTitle>
            <CardDescription>System errors and recovery attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {[
                  {
                    error: "CRM sync timeout",
                    service: "Salesforce",
                    timestamp: "2024-01-15 14:20:03",
                    status: "retrying",
                  },
                  {
                    error: "Rate limit exceeded",
                    service: "Twilio",
                    timestamp: "2024-01-15 13:45:22",
                    status: "resolved",
                  },
                  {
                    error: "Calendar booking conflict",
                    service: "Google Calendar",
                    timestamp: "2024-01-15 12:30:15",
                    status: "resolved",
                  },
                ].map((log, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-border/50 space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{log.error}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {log.service} • {log.timestamp}
                        </div>
                      </div>
                      {log.status === "resolved" ? (
                        <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 text-xs">
                          Resolved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-500/30 text-amber-500 text-xs">
                          <Clock className="h-3 w-3 mr-1 animate-spin" />
                          Retrying
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
