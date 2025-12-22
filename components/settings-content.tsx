"use client"

import { Settings } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function SettingsContent() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-balance">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your AI agent and system preferences</p>
      </div>

      <Tabs defaultValue="agent" className="space-y-6">
        <TabsList className="glass-panel">
          <TabsTrigger value="agent">Agent</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="localization">Localization</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="agent" className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="font-serif">Agent Voice & Persona</CardTitle>
              <CardDescription>Configure how the AI agent communicates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="persona">Agent Persona</Label>
                <Select defaultValue="luxury">
                  <SelectTrigger id="persona">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional & Direct</SelectItem>
                    <SelectItem value="luxury">Luxury Concierge</SelectItem>
                    <SelectItem value="friendly">Warm & Friendly</SelectItem>
                    <SelectItem value="consultative">Expert Consultant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tone">Tone Adjustments</Label>
                <Textarea
                  id="tone"
                  placeholder="Additional instructions for the agent's communication style..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="font-serif">Qualification Questions</CardTitle>
              <CardDescription>Define what makes a lead qualified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Budget Range</div>
                    <div className="text-xs text-muted-foreground">What is your budget for a property?</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Timeline</div>
                    <div className="text-xs text-muted-foreground">When are you looking to purchase?</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Property Type</div>
                    <div className="text-xs text-muted-foreground">What type of property interests you?</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Location Preference</div>
                    <div className="text-xs text-muted-foreground">Which area are you interested in?</div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="font-serif">Appointment Rules</CardTitle>
              <CardDescription>Configure booking behavior and constraints</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="buffer">Buffer Time Between Appointments</Label>
                <Select defaultValue="30">
                  <SelectTrigger id="buffer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="advance">Minimum Advance Notice</Label>
                <Select defaultValue="24">
                  <SelectTrigger id="advance">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="48">48 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Auto-assign Representatives</div>
                    <div className="text-xs text-muted-foreground">Automatically assign based on availability</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Send Confirmation SMS</div>
                    <div className="text-xs text-muted-foreground">Text confirmation to prospect</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Send Reminder 24h Before</div>
                    <div className="text-xs text-muted-foreground">Automated reminder notification</div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="localization" className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="font-serif">Language & Region</CardTitle>
              <CardDescription>Configure language and localization settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Primary Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">Arabic (العربية)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select defaultValue="ast">
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ast">Arabia Standard Time (AST)</SelectItem>
                    <SelectItem value="gst">Gulf Standard Time (GST)</SelectItem>
                    <SelectItem value="utc">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select defaultValue="sar">
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sar">Saudi Riyal (SAR)</SelectItem>
                    <SelectItem value="usd">US Dollar (USD)</SelectItem>
                    <SelectItem value="eur">Euro (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="font-serif">Security Settings</CardTitle>
              <CardDescription>Manage authentication and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Two-Factor Authentication</div>
                  <div className="text-xs text-muted-foreground">Require 2FA for all users</div>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Session Timeout</div>
                  <div className="text-xs text-muted-foreground">Auto-logout after 30 minutes of inactivity</div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">IP Whitelisting</div>
                  <div className="text-xs text-muted-foreground">Restrict access to specific IPs</div>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="font-serif">Data Retention</CardTitle>
              <CardDescription>Control how long data is stored</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="call-retention">Call Recordings</Label>
                <Select defaultValue="90">
                  <SelectTrigger id="call-retention">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="forever">Forever</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transcript-retention">Transcripts</Label>
                <Select defaultValue="365">
                  <SelectTrigger id="transcript-retention">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="forever">Forever</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="log-retention">Audit Logs</Label>
                <Select defaultValue="365">
                  <SelectTrigger id="log-retention">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="180">6 months</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="730">2 years</SelectItem>
                    <SelectItem value="forever">Forever</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button size="lg" className="bg-primary hover:bg-primary/90">
          <Settings className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  )
}
