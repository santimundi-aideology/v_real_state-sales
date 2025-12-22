"use client"

import { TrendingUp, Phone, UserCheck, Calendar, Award } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function AnalyticsContent() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-balance">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">Performance metrics and insights</p>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8,247</div>
            <div className="flex items-center gap-1 text-xs text-emerald-500 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>+24% this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Connect Rate</CardTitle>
            <UserCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">41%</div>
            <div className="flex items-center gap-1 text-xs text-emerald-500 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>+3% improvement</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Qualification Rate</CardTitle>
            <Award className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">36%</div>
            <div className="flex items-center gap-1 text-xs text-emerald-500 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>+8% this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Booking Rate</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">47%</div>
            <div className="flex items-center gap-1 text-xs text-emerald-500 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>+12% this month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Calls Trend */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="font-serif">Calls Per Day</CardTitle>
            <CardDescription>Last 7 days performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { day: "Monday", calls: 1247, percent: 100 },
              { day: "Tuesday", calls: 1189, percent: 95 },
              { day: "Wednesday", calls: 1356, percent: 108 },
              { day: "Thursday", calls: 1298, percent: 104 },
              { day: "Friday", calls: 1421, percent: 114 },
              { day: "Saturday", calls: 987, percent: 79 },
              { day: "Sunday", calls: 749, percent: 60 },
            ].map((item) => (
              <div key={item.day} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.day}</span>
                  <span className="font-medium">{item.calls}</span>
                </div>
                <Progress value={item.percent} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Rep Performance Leaderboard */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="font-serif">Rep Performance Leaderboard</CardTitle>
            <CardDescription>Top performers this month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Mohammed Al-Farsi", appointments: 42, rate: 52 },
              { name: "Sarah Al-Rashid", appointments: 38, rate: 48 },
              { name: "Ahmed Al-Mansour", appointments: 35, rate: 44 },
              { name: "Fatima Al-Zahrani", appointments: 31, rate: 38 },
              { name: "Khalid Abdullah", appointments: 28, rate: 35 },
            ].map((rep, idx) => (
              <div key={rep.name} className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{rep.name}</span>
                    <span className="text-sm text-muted-foreground">{rep.appointments} bookings</span>
                  </div>
                  <Progress value={rep.rate} className="h-1.5" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Campaign Effectiveness */}
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="font-serif">Campaign Effectiveness</CardTitle>
          <CardDescription>Conversion metrics by campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Riyadh Q1 Luxury Villas", attempts: 1250, connects: 525, qualified: 189, booked: 87 },
              { name: "Jeddah Waterfront Collection", attempts: 980, connects: 412, qualified: 156, booked: 68 },
              { name: "Premium Penthouses Campaign", attempts: 756, connects: 298, qualified: 98, booked: 42 },
            ].map((campaign) => (
              <div key={campaign.name} className="p-4 rounded-xl border border-border/50 space-y-3">
                <h4 className="font-semibold">{campaign.name}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">Attempts</div>
                    <div className="font-medium mt-1">{campaign.attempts}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Connects</div>
                    <div className="font-medium mt-1">
                      {campaign.connects} ({Math.round((campaign.connects / campaign.attempts) * 100)}%)
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Qualified</div>
                    <div className="font-medium mt-1">
                      {campaign.qualified} ({Math.round((campaign.qualified / campaign.connects) * 100)}%)
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Booked</div>
                    <div className="font-medium mt-1 text-primary">
                      {campaign.booked} ({Math.round((campaign.booked / campaign.qualified) * 100)}%)
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
