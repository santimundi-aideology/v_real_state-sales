"use client"

import { useState } from "react"
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Building2,
  MoreVertical,
  FileText,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { mockAppointments, mockUsers } from "@/lib/mock-data"

export function AppointmentsContent() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedUserId, setSelectedUserId] = useState<string>("all")
  const [viewMonth, setViewMonth] = useState(new Date())

  const currentRole = typeof window !== "undefined" ? localStorage.getItem("fph-current-role") : "sales_rep"
  const canViewTeamAgenda = currentRole === "admin" || currentRole === "sales_manager"

  const teamMembers = mockUsers.filter((u) => u.role === "sales_rep" || u.role === "sales_manager")

  const filteredAppointments = mockAppointments.filter((apt) => {
    const aptDate = new Date(apt.scheduledDate)
    const matchesDate = aptDate.toDateString() === selectedDate.toDateString()
    const matchesUser = selectedUserId === "all" || apt.assignedRepId === selectedUserId
    return matchesDate && matchesUser
  })

  const getMonthAppointments = () => {
    const year = viewMonth.getFullYear()
    const month = viewMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    return mockAppointments.filter((apt) => {
      const aptDate = new Date(apt.scheduledDate)
      const matchesMonth = aptDate >= firstDay && aptDate <= lastDay
      const matchesUser = selectedUserId === "all" || apt.assignedRepId === selectedUserId
      return matchesMonth && matchesUser
    })
  }

  const buildCalendarDays = () => {
    const year = viewMonth.getFullYear()
    const month = viewMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startingDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days = []

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const calendarDays = buildCalendarDays()
  const monthAppointments = getMonthAppointments()

  const getAppointmentCountForDay = (date: Date | null) => {
    if (!date) return 0
    return monthAppointments.filter((apt) => new Date(apt.scheduledDate).toDateString() === date.toDateString()).length
  }

  const previousMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-balance">Appointments</h1>
          <p className="text-muted-foreground mt-1">Scheduled face-to-face meetings with prospects</p>
        </div>

        {canViewTeamAgenda && (
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-[200px] bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Team Members</SelectItem>
                <SelectItem value="my-agenda">My Agenda</SelectItem>
                <Separator className="my-2" />
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Show Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Calendar View */}
        <Card className="glass-panel">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-serif">Calendar</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={previousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium min-w-[140px] text-center">
                  {viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </div>
                <Button variant="ghost" size="sm" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="space-y-2">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  const count = getAppointmentCountForDay(day)
                  const isSelected = day && day.toDateString() === selectedDate.toDateString()
                  const isToday = day && day.toDateString() === new Date().toDateString()

                  return (
                    <button
                      key={index}
                      onClick={() => day && setSelectedDate(day)}
                      disabled={!day}
                      className={`
                        aspect-square p-1 rounded-lg text-sm relative
                        transition-all duration-200
                        ${!day ? "invisible" : ""}
                        ${isSelected ? "bg-primary/20 border-2 border-primary" : "hover:bg-accent/50 border-2 border-transparent"}
                        ${isToday && !isSelected ? "border-primary/40" : ""}
                        ${day && day.getMonth() !== viewMonth.getMonth() ? "text-muted-foreground/40" : ""}
                      `}
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className={isToday ? "font-bold text-primary" : ""}>{day?.getDate()}</span>
                        {count > 0 && (
                          <div className="flex gap-0.5 mt-1">
                            {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                              <div key={i} className="w-1 h-1 rounded-full bg-primary" />
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="font-serif">
              {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? "s" : ""}
            </p>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No appointments scheduled for this date</p>
              </div>
            ) : (
              filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex flex-col gap-3 p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{appointment.prospectName}</h4>
                      <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        {appointment.propertyName}
                      </div>
                    </div>
                    <Badge
                      variant={appointment.status === "scheduled" ? "default" : "outline"}
                      className={
                        appointment.status === "scheduled"
                          ? "bg-primary/20 text-primary border-primary/30"
                          : appointment.status === "completed"
                            ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
                            : ""
                      }
                    >
                      {appointment.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(appointment.scheduledDate).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      {appointment.assignedRepName}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {appointment.location}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent flex-1">
                      <FileText className="h-3.5 w-3.5" />
                      Handoff Package
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Reschedule</DropdownMenuItem>
                        <DropdownMenuItem>Reassign Rep</DropdownMenuItem>
                        <DropdownMenuItem>Send Reminder</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Cancel</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
