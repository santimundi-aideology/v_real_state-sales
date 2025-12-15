"use client"

import { useState } from "react"
import { Building2, MapPin, BedDouble, Home, Search, Filter, X } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { mockProperties } from "@/lib/mock-data"

export function PropertiesContent() {
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null)

  const property = mockProperties.find((p) => p.id === selectedProperty)

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-balance">Property Catalog</h1>
          <p className="text-muted-foreground mt-1">Available luxury properties for AI agent presentation</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search properties..." className="pl-9" />
        </div>
        <Select>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            <SelectItem value="riyadh">Riyadh</SelectItem>
            <SelectItem value="jeddah">Jeddah</SelectItem>
            <SelectItem value="dammam">Dammam</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="villa">Villa</SelectItem>
            <SelectItem value="apartment">Apartment</SelectItem>
            <SelectItem value="penthouse">Penthouse</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Filter className="h-4 w-4" />
          More Filters
        </Button>
      </div>

      {/* Properties Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockProperties.map((prop) => (
          <Card
            key={prop.id}
            className="glass-panel hover:border-primary/30 transition-all cursor-pointer group"
            onClick={() => setSelectedProperty(prop.id)}
          >
            <CardHeader className="p-0">
              <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-t-xl flex items-center justify-center">
                <Building2 className="h-16 w-16 text-primary/40" />
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif font-semibold text-lg">{prop.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {prop.city}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    prop.status === "available"
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                      : "bg-muted/10"
                  }
                >
                  {prop.status}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <BedDouble className="h-4 w-4 text-muted-foreground" />
                  <span>{prop.bedrooms} Bed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{prop.type}</span>
                </div>
              </div>
              <div className="text-xl font-serif font-semibold text-primary">{prop.priceRange}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Property Detail Drawer */}
      <Sheet open={!!selectedProperty} onOpenChange={(open) => !open && setSelectedProperty(null)}>
        <SheetContent className="glass-panel sm:max-w-2xl overflow-y-auto">
          {property && (
            <>
              <SheetHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <SheetTitle className="font-serif text-2xl">{property.name}</SheetTitle>
                    <SheetDescription className="flex items-center gap-1.5 mt-2">
                      <MapPin className="h-3.5 w-3.5" />
                      {property.city}
                    </SheetDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedProperty(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Image Placeholder */}
                <div className="h-64 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center">
                  <Building2 className="h-24 w-24 text-primary/40" />
                </div>

                {/* Price & Status */}
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-serif font-semibold text-primary">{property.priceRange}</div>
                  <Badge
                    variant="outline"
                    className={
                      property.status === "available"
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                        : "bg-muted/10"
                    }
                  >
                    {property.status}
                  </Badge>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Bedrooms</Label>
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-primary" />
                      <span className="font-medium">{property.bedrooms}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Type</Label>
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-primary" />
                      <span className="font-medium capitalize">{property.type}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div className="space-y-2">
                  <Label className="font-serif text-base">Description</Label>
                  <p className="text-sm text-muted-foreground leading-relaxed">{property.description}</p>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <Label className="font-serif text-base">Feature Highlights</Label>
                  <div className="grid gap-2">
                    {property.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Agent Talking Points */}
                <div className="space-y-3">
                  <Label className="font-serif text-base">Agent Talking Points</Label>
                  <div className="space-y-2 p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-sm leading-relaxed">
                      This is an exceptional opportunity in a prime location. The property features premium finishes and
                      world-class amenities. Ideal for families seeking luxury and security.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
