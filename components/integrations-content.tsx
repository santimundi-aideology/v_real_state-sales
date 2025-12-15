"use client"

import { useState } from "react"
import { Plug2, Database, PhoneIcon, Calendar, Webhook, Key, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { mockIntegrations } from "@/lib/mock-data"

const integrationTemplates = [
  {
    id: "salesforce",
    name: "Salesforce",
    type: "crm",
    icon: Database,
    description: "Sync leads, contacts, and opportunities",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    type: "crm",
    icon: Database,
    description: "Marketing and sales automation",
  },
  {
    id: "zoho",
    name: "Zoho CRM",
    type: "crm",
    icon: Database,
    description: "Customer relationship management",
  },
  {
    id: "custom",
    name: "Custom CRM",
    type: "crm",
    icon: Database,
    description: "Connect via REST API",
  },
  {
    id: "twilio",
    name: "Twilio",
    type: "telephony",
    icon: PhoneIcon,
    description: "Voice calling and SMS",
  },
  {
    id: "sip",
    name: "SIP Trunk",
    type: "telephony",
    icon: PhoneIcon,
    description: "Enterprise VoIP integration",
  },
  {
    id: "google-cal",
    name: "Google Calendar",
    type: "calendar",
    icon: Calendar,
    description: "Appointment scheduling",
  },
  {
    id: "ms-cal",
    name: "Microsoft Calendar",
    type: "calendar",
    icon: Calendar,
    description: "Outlook calendar sync",
  },
]

export function IntegrationsContent() {
  const [configOpen, setConfigOpen] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null)

  const selected = integrationTemplates.find((i) => i.id === selectedIntegration)

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-balance">CRM & Integrations</h1>
        <p className="text-muted-foreground mt-1">Connect your tools and platforms</p>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList className="glass-panel">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-6">
          {/* Connected Integrations */}
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="font-serif">Connected Integrations</CardTitle>
              <CardDescription>Active connections to external platforms</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {mockIntegrations.map((integration) => {
                const template = integrationTemplates.find((t) => t.name === integration.name)
                const Icon = template?.icon || Plug2
                return (
                  <div key={integration.id} className="flex items-center gap-4 p-4 rounded-xl border border-border/50">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{integration.name}</h4>
                        {integration.status === "connected" ? (
                          <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                            <Check className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Disconnected
                          </Badge>
                        )}
                      </div>
                      {integration.lastSync && (
                        <p className="text-xs text-muted-foreground">Last sync: {integration.lastSync}</p>
                      )}
                    </div>
                    <Button
                      variant={integration.status === "connected" ? "outline" : "default"}
                      size="sm"
                      className={integration.status === "connected" ? "bg-transparent" : ""}
                      onClick={() => {
                        setSelectedIntegration(integration.id)
                        setConfigOpen(true)
                      }}
                    >
                      {integration.status === "connected" ? "Configure" : "Connect"}
                    </Button>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Available Integrations */}
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="font-serif">Available Integrations</CardTitle>
              <CardDescription>Add new connections to expand capabilities</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {integrationTemplates
                .filter((t) => !mockIntegrations.find((i) => i.name === t.name))
                .map((integration) => {
                  const Icon = integration.icon
                  return (
                    <button
                      key={integration.id}
                      onClick={() => {
                        setSelectedIntegration(integration.id)
                        setConfigOpen(true)
                      }}
                      className="text-left p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-all space-y-3"
                    >
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{integration.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{integration.description}</p>
                      </div>
                    </button>
                  )
                })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="font-serif">Webhook Configuration</CardTitle>
              <CardDescription>Send real-time events to external endpoints</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input id="webhook-url" placeholder="https://your-domain.com/webhook" className="font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label>Events to Subscribe</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  {["call.completed", "lead.qualified", "appointment.booked", "appointment.completed"].map((event) => (
                    <div key={event} className="flex items-center gap-2 p-2 rounded border border-border/50">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-sm font-mono">{event}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Webhook className="h-4 w-4 mr-2" />
                Create Webhook
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="font-serif">API Keys</CardTitle>
              <CardDescription>Manage API access credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "Production API Key", key: "fph_prod_*********************7x9k", created: "2024-01-15" },
                { name: "Development API Key", key: "fph_dev_*********************3m2p", created: "2024-01-10" },
              ].map((apiKey) => (
                <div
                  key={apiKey.name}
                  className="flex items-center justify-between p-4 rounded-xl border border-border/50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">{apiKey.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">{apiKey.key}</p>
                    <p className="text-xs text-muted-foreground">Created: {apiKey.created}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="bg-transparent">
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive bg-transparent">
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full bg-transparent">
                <Key className="h-4 w-4 mr-2" />
                Generate New API Key
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Integration Config Dialog */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="glass-panel max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Connect {selected?.name}</DialogTitle>
            <DialogDescription>{selected?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input id="api-key" type="password" placeholder="Enter your API key" className="font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-secret">API Secret</Label>
              <Input
                id="api-secret"
                type="password"
                placeholder="Enter your API secret"
                className="font-mono text-sm"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setConfigOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-primary hover:bg-primary/90">Connect</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
