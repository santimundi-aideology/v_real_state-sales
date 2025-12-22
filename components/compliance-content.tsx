"use client"

import { Shield, Clock, FileText, AlertTriangle, Upload } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ComplianceContent() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-balance">Compliance Center</h1>
        <p className="text-muted-foreground mt-1">Manage regulatory compliance and data governance</p>
      </div>

      {/* Compliance Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">DNC List Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Consent Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8,532</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Compliance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">98%</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dnc" className="space-y-6">
        <TabsList className="glass-panel">
          <TabsTrigger value="dnc">DNC List</TabsTrigger>
          <TabsTrigger value="consent">Consent</TabsTrigger>
          <TabsTrigger value="dialing">Dialing Windows</TabsTrigger>
          <TabsTrigger value="disclosures">Disclosures</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="dnc" className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="font-serif">Do Not Call Registry</CardTitle>
              <CardDescription>Manage numbers that should not be contacted</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Upload className="h-4 w-4" />
                  Upload DNC List
                </Button>
                <Button variant="outline" className="bg-transparent">
                  Download Current List
                </Button>
              </div>
              <div className="space-y-2">
                {[
                  { phone: "+966 50 123 4567", added: "2024-01-15", reason: "User request" },
                  { phone: "+966 55 234 5678", added: "2024-01-14", reason: "Regulatory" },
                  { phone: "+966 56 345 6789", added: "2024-01-13", reason: "User request" },
                ].map((entry) => (
                  <div
                    key={entry.phone}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50"
                  >
                    <div>
                      <div className="font-mono text-sm">{entry.phone}</div>
                      <div className="text-xs text-muted-foreground">
                        Added {entry.added} • {entry.reason}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consent" className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="font-serif">Consent Records</CardTitle>
              <CardDescription>Track prospect opt-in and communication preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "Khalid Abdullah", phone: "+966 50 123 4567", consent: "Full consent", date: "2024-01-15" },
                { name: "Fatima Al-Zahrani", phone: "+966 55 234 5678", consent: "Call only", date: "2024-01-14" },
                { name: "Mohammed Al-Farsi", phone: "+966 56 345 6789", consent: "Full consent", date: "2024-01-13" },
              ].map((record) => (
                <div
                  key={record.phone}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{record.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{record.phone}</div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">{record.consent}</Badge>
                    <div className="text-xs text-muted-foreground mt-1">{record.date}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dialing" className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="font-serif">Dialing Window Rules</CardTitle>
              <CardDescription>Configure permitted calling hours by timezone</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="ast">
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ast">Arabia Standard Time (AST)</SelectItem>
                      <SelectItem value="gst">Gulf Standard Time (GST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="days">Allowed Days</Label>
                  <Select defaultValue="weekdays">
                    <SelectTrigger id="days">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekdays">Sunday - Thursday</SelectItem>
                      <SelectItem value="all">All days</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Select defaultValue="09:00">
                    <SelectTrigger id="start-time">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="09:00">9:00 AM</SelectItem>
                      <SelectItem value="10:00">10:00 AM</SelectItem>
                      <SelectItem value="11:00">11:00 AM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Select defaultValue="21:00">
                    <SelectTrigger id="end-time">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="19:00">7:00 PM</SelectItem>
                      <SelectItem value="20:00">8:00 PM</SelectItem>
                      <SelectItem value="21:00">9:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Clock className="h-4 w-4 mr-2" />
                Update Dialing Rules
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disclosures" className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="font-serif">Mandatory Disclosures</CardTitle>
              <CardDescription>Legal statements that must be included in calls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="opening">Opening Disclosure</Label>
                <Textarea
                  id="opening"
                  rows={3}
                  defaultValue="This call may be recorded for quality and training purposes. By continuing this call, you consent to being recorded."
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data">Data Usage Disclosure</Label>
                <Textarea
                  id="data"
                  rows={3}
                  defaultValue="Your information will be used in accordance with our privacy policy. We will not share your data with third parties without your consent."
                  className="resize-none"
                />
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <FileText className="h-4 w-4 mr-2" />
                Save Disclosures
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="font-serif">Compliance Audit Trail</CardTitle>
              <CardDescription>History of compliance-related events and actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  event: "DNC list updated",
                  user: "Ahmed Al-Mansour",
                  timestamp: "2024-01-15 14:32",
                  type: "info",
                },
                {
                  event: "Dialing window rule modified",
                  user: "Sarah Al-Rashid",
                  timestamp: "2024-01-15 10:15",
                  type: "info",
                },
                {
                  event: "Consent record added",
                  user: "System",
                  timestamp: "2024-01-15 09:47",
                  type: "info",
                },
                {
                  event: "Attempted call outside dialing window",
                  user: "Agent-B07",
                  timestamp: "2024-01-14 22:15",
                  type: "warning",
                },
              ].map((log, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-border/50">
                  {log.type === "warning" ? (
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                  ) : (
                    <Shield className="h-4 w-4 text-primary mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{log.event}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {log.user} • {log.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
