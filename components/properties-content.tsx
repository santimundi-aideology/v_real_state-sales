"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Building2, MapPin, BedDouble, Home, Search, Filter, X, ChevronLeft, ChevronRight, Sparkles, MessageCircle, Send, Minimize2, Maximize2 } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { mockProperties } from "@/lib/mock-data"
import { useUser } from "@/lib/hooks/use-user"

const PROPERTIES_PER_PAGE = 12
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  propertyIds?: string[] // Property IDs mentioned in this message
}

/**
 * Sanitizes assistant markdown content by removing unwanted elements
 * while preserving newlines (required for markdown tables).
 */
const sanitizeAssistantMarkdown = (content: string): string => {
  let out = content

  // Remove properties_summary block
  out = out.replace(/<properties_summary>[\s\S]*?<\/properties_summary>/gi, "")

  // Remove UUIDs in various formats
  out = out.replace(/\([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\)/gi, "")
  out = out.replace(/\[[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\]/gi, "")
  out = out.replace(/ID:\s*[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "")
  out = out.replace(/uuid:\s*[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "")
  // Remove standalone UUIDs (with word boundaries to avoid partial matches)
  out = out.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "")

  // Collapse ONLY spaces/tabs (keep newlines for markdown tables)
  out = out.replace(/[ \t]+/g, " ")

  // Clean up empty brackets left behind
  out = out.replace(/\(\s*\)/g, "").replace(/\[\s*\]/g, "")

  return out.trim()
}

export function PropertiesContent() {
  const { user } = useUser()
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [cityFilter, setCityFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [agentQuery, setAgentQuery] = useState("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isChatExpanded, setIsChatExpanded] = useState(false)
  const [isChatMaximized, setIsChatMaximized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [threadId] = useState(() => crypto.randomUUID())
  const chatEndRef = useRef<HTMLDivElement>(null)

  const property = useMemo(
    () => mockProperties.find((p) => p.id === selectedProperty),
    [selectedProperty]
  )

  // Filter properties based on search, city, and type
  const filteredProperties = useMemo(() => {
    return mockProperties.filter((prop) => {
      // Search filter - matches name, city, description, or features
      const matchesSearch =
        searchQuery === "" ||
        prop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prop.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prop.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prop.features.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()))

      // City filter
      const matchesCity = cityFilter === "all" || prop.city.toLowerCase() === cityFilter.toLowerCase()

      // Type filter
      const matchesType = typeFilter === "all" || prop.type === typeFilter

      return matchesSearch && matchesCity && matchesType
    })
  }, [searchQuery, cityFilter, typeFilter])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, cityFilter, typeFilter])

  // Pagination logic with filtered results
  const totalPages = Math.ceil(filteredProperties.length / PROPERTIES_PER_PAGE)
  const startIndex = (currentPage - 1) * PROPERTIES_PER_PAGE
  const endIndex = startIndex + PROPERTIES_PER_PAGE
  const currentProperties = filteredProperties.slice(startIndex, endIndex)

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  // Helper chip suggestions
  const helperChips = [
    "Best for first-time buyers",
    "Compare 3 listings",
    "Investor picks",
    "Under 5M SAR",
    "Family-friendly",
    "Luxury properties",
  ]

  const handleChipClick = (chip: string) => {
    setAgentQuery(chip)
  }

  // Parse properties_summary from LLM response
  const parsePropertiesSummary = (message: string): string[] => {
    try {
      // Look for <properties_summary>...</properties_summary> tags
      const summaryMatch = message.match(/<properties_summary>([\s\S]*?)<\/properties_summary>/i)
      if (!summaryMatch) return []

      const summaryContent = summaryMatch[1].trim()
      
      // Try to parse as JSON (the dict format we specified)
      try {
        const propertiesDict = JSON.parse(summaryContent)
        // Extract all IDs from the dictionary values
        return Object.values(propertiesDict) as string[]
      } catch (e) {
        // If JSON parsing fails, try to extract UUIDs from the content
        const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi
        const matches = summaryContent.match(uuidRegex)
        return matches || []
      }
    } catch (error) {
      console.error("Error parsing properties summary:", error)
      return []
    }
  }

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages, isLoading])

  const handleAgentQuery = async () => {
    if (!agentQuery.trim() || isLoading) return

    const userMessage = agentQuery.trim()
    
    // Add user message to chat
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, timestamp: new Date() },
    ])
    
    // Clear input
    setAgentQuery("")
    
    // Expand chat panel in maximized state
    setIsChatExpanded(true)
    setIsChatMaximized(true)
    
    // Set loading state
    setIsLoading(true)

    try {
      // Call backend query endpoint
      const response = await fetch(`${BACKEND_URL}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: userMessage,
          user_role: "admin", // Default role, can be updated based on user context
          thread_id: threadId,
          agent_persona: "Be formal, warm and polite",
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const assistantMessage = data.message || "I apologize, but I couldn't process your request."

      // Parse properties_summary from the response
      const propertyIds = parsePropertiesSummary(assistantMessage)

      // Add assistant response to chat
      setChatMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: assistantMessage, 
          timestamp: new Date(),
          propertyIds: propertyIds.length > 0 ? propertyIds : undefined
        },
      ])
    } catch (error) {
      console.error("Error calling query endpoint:", error)
      // Add error message to chat
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

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
          <Input
            placeholder="Search properties..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={cityFilter} onValueChange={setCityFilter}>
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
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="villa">Villa</SelectItem>
            <SelectItem value="apartment">Apartment</SelectItem>
            <SelectItem value="penthouse">Penthouse</SelectItem>
            <SelectItem value="townhouse">Townhouse</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Filter className="h-4 w-4" />
          More Filters
        </Button>
      </div>

      {/* AI Command Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
          <Input
            placeholder="Compare Azure Heights Villa vs Golden Oasis Residence vs Royal Palm Estate and recommend one for a family relocating from Dubai"
            className="pl-9 pr-20"
            value={agentQuery}
            onChange={(e) => setAgentQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAgentQuery()
              }
            }}
          />
          {agentQuery && (
            <Button
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7"
              onClick={handleAgentQuery}
              disabled={isLoading}
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              Send
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {helperChips.map((chip, idx) => (
            <Button
              key={idx}
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => handleChipClick(chip)}
            >
              {chip}
            </Button>
          ))}
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {currentProperties.map((prop) => (
          <Card
            key={prop.id}
            className="glass-panel hover:border-primary/30 transition-all cursor-pointer group"
            onClick={() => setSelectedProperty(prop.id)}
          >
            <CardHeader className="p-0">
              <div className="relative h-48 w-full bg-gradient-to-br from-primary/20 to-secondary/20 rounded-t-xl overflow-hidden">
                {prop.imageUrl ? (
                  <Image
                    src={prop.imageUrl}
                    alt={prop.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    loading="lazy"
                    quality={85}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Building2 className="h-16 w-16 text-primary/40" />
                  </div>
                )}
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

      {/* Pagination */}
      {filteredProperties.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No properties found matching your criteria.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 pt-6 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredProperties.length)} of {filteredProperties.length} properties
          </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="text-sm text-muted-foreground px-4">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      )}

      {/* Expandable Chat Panel */}
      <div
        className={`
          fixed inset-0 z-50 transition-all duration-300 ease-in-out
          ${isChatExpanded ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
      >
        {/* Backdrop */}
        {isChatExpanded && (
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsChatExpanded(false)}
          />
        )}
        
        {/* Chat Panel - Centered */}
        {isChatExpanded && (
          <div
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
              isChatMaximized ? "w-[90vw] h-[90vh] max-w-[1200px] max-h-[800px]" : "w-[500px]"
            }`}
          >
            <Card 
              className={`flex flex-col shadow-2xl border-2 ${
                isChatMaximized ? "h-full" : "h-auto max-h-[90vh] min-h-[400px]"
              } bg-card backdrop-blur-xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <h3 className="font-serif font-semibold text-foreground">AI Assistant</h3>
                  </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsChatMaximized(!isChatMaximized)
                    }}
                    title={isChatMaximized ? "Minimize" : "Maximize"}
                  >
                    {isChatMaximized ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsChatExpanded(false)
                      setIsChatMaximized(false)
                    }}
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className={`flex flex-col p-0 ${isChatMaximized ? "flex-1 overflow-hidden" : "overflow-visible"} bg-background`}>
                {isChatMaximized ? (
                  <ScrollArea className="flex-1 h-full">
                    <div className="p-6 space-y-4 w-full">
                      {chatMessages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary/60" />
                          <p className="text-sm">Start a conversation with the AI assistant</p>
                        </div>
                      ) : (
                        chatMessages.map((msg, idx) => {
                        // Get properties mentioned in this message
                        const mentionedProperties = msg.propertyIds
                          ? msg.propertyIds
                              .map((id) => mockProperties.find((p) => p.id === id))
                              .filter((p): p is NonNullable<typeof p> => p !== undefined)
                          : []

                        // Sanitize content (removes UUIDs and properties_summary, preserves newlines for markdown tables)
                        const displayContent = sanitizeAssistantMarkdown(msg.content)

                        return (
                          <div
                            key={idx}
                            className={`flex gap-3 ${
                              msg.role === "user" ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`
                                ${msg.role === "user" ? "max-w-[85%]" : "w-full"} rounded-lg p-4
                                ${
                                  msg.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-card text-card-foreground border border-border"
                                }
                              `}
                            >
                              <div className={`text-sm leading-relaxed ${msg.role === "user" ? "" : "max-w-none w-full"}`}>
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    code: ({ node, inline, className, children, ...props }: any) => {
                                      return inline ? (
                                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                                          {children}
                                        </code>
                                      ) : (
                                        <code className={className} {...props}>
                                          {children}
                                        </code>
                                      )
                                    },
                                    a: ({ node, ...props }: any) => (
                                      <a className="text-primary hover:underline" {...props} />
                                    ),
                                    ul: ({ node, ...props }: any) => (
                                      <ul className="list-disc list-inside space-y-1 my-2" {...props} />
                                    ),
                                    ol: ({ node, ...props }: any) => (
                                      <ol className="list-decimal list-inside space-y-1 my-2" {...props} />
                                    ),
                                    h1: ({ node, ...props }: any) => (
                                      <h1 className="text-lg font-semibold mt-2 mb-1" {...props} />
                                    ),
                                    h2: ({ node, ...props }: any) => (
                                      <h2 className="text-base font-semibold mt-2 mb-1" {...props} />
                                    ),
                                    h3: ({ node, ...props }: any) => (
                                      <h3 className="text-sm font-semibold mt-1 mb-1" {...props} />
                                    ),
                                    p: ({ node, ...props }: any) => (
                                      <p className="mb-2 last:mb-0" {...props} />
                                    ),
                                    blockquote: ({ node, ...props }: any) => (
                                      <blockquote className="border-l-4 border-primary/30 pl-3 italic my-2" {...props} />
                                    ),
                                    table: ({ node, children, ...props }: any) => (
                                      <div className="overflow-x-auto my-4 w-full">
                                        <table className="min-w-full border-collapse border border-border rounded-md" {...props}>
                                          {children}
                                        </table>
                                      </div>
                                    ),
                                    thead: ({ node, children, ...props }: any) => (
                                      <thead className="bg-muted" {...props}>
                                        {children}
                                      </thead>
                                    ),
                                    tbody: ({ node, children, ...props }: any) => (
                                      <tbody {...props}>
                                        {children}
                                      </tbody>
                                    ),
                                    tr: ({ node, children, ...props }: any) => (
                                      <tr className="border-b border-border hover:bg-muted/50 transition-colors" {...props}>
                                        {children}
                                      </tr>
                                    ),
                                    th: ({ node, children, ...props }: any) => (
                                      <th className="px-4 py-3 border-r border-border bg-muted font-semibold text-left last:border-r-0" {...props}>
                                        {children}
                                      </th>
                                    ),
                                    td: ({ node, children, ...props }: any) => (
                                      <td className="px-4 py-3 border-r border-border last:border-r-0" {...props}>
                                        {children}
                                      </td>
                                    ),
                                  }}
                                >
                                  {displayContent}
                                </ReactMarkdown>
                              </div>
                              
                              {/* Display property cards if properties are mentioned */}
                              {mentionedProperties.length > 0 && (
                                <div className="mt-4 space-y-2">
                                  <div className="text-xs font-medium text-muted-foreground mb-2">
                                    Properties mentioned:
                                  </div>
                                  <div className="grid grid-cols-1 gap-2">
                                    {mentionedProperties.map((property) => (
                                      <Card
                                        key={property.id}
                                        className="p-2 cursor-pointer hover:border-primary/50 transition-colors bg-muted/50"
                                        onClick={() => setSelectedProperty(property.id)}
                                      >
                                        <div className="flex gap-2">
                                          {property.imageUrl && (
                                            <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                                              <Image
                                                src={property.imageUrl}
                                                alt={property.name}
                                                fill
                                                className="object-cover"
                                                sizes="64px"
                                              />
                                            </div>
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium text-xs truncate">
                                              {property.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate">
                                              {property.city} • {property.bedrooms} Bed • {property.type}
                                            </div>
                                            <div className="text-xs font-semibold text-primary mt-0.5">
                                              {property.priceRange}
                                            </div>
                                          </div>
                                        </div>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div
                                className={`text-xs mt-2 ${
                                  msg.role === "user"
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {msg.timestamp.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                    {isLoading && (
                      <div className="flex gap-3 justify-start">
                        <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                          <div className="flex gap-1">
                            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}
                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>
                ) : (
                  <ScrollArea className="max-h-[calc(90vh-120px)]">
                    <div className="p-6 space-y-4 w-full">
                    {chatMessages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary/60" />
                        <p className="text-sm">Start a conversation with the AI assistant</p>
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => {
                        // Get properties mentioned in this message
                        const mentionedProperties = msg.propertyIds
                          ? msg.propertyIds
                              .map((id) => mockProperties.find((p) => p.id === id))
                              .filter((p): p is NonNullable<typeof p> => p !== undefined)
                          : []

                        // Sanitize content (removes UUIDs and properties_summary, preserves newlines for markdown tables)
                        const displayContent = sanitizeAssistantMarkdown(msg.content)

                        return (
                          <div
                            key={idx}
                            className={`flex gap-3 ${
                              msg.role === "user" ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`
                                w-full rounded-lg p-4
                                ${
                                  msg.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-card text-card-foreground border border-border"
                                }
                              `}
                            >
                              <div className="text-sm leading-relaxed max-w-none w-full">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    code: ({ node, inline, className, children, ...props }: any) => {
                                      return inline ? (
                                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                                          {children}
                                        </code>
                                      ) : (
                                        <code className={className} {...props}>
                                          {children}
                                        </code>
                                      )
                                    },
                                    a: ({ node, ...props }: any) => (
                                      <a className="text-primary hover:underline" {...props} />
                                    ),
                                    ul: ({ node, ...props }: any) => (
                                      <ul className="list-disc list-inside space-y-1 my-2" {...props} />
                                    ),
                                    ol: ({ node, ...props }: any) => (
                                      <ol className="list-decimal list-inside space-y-1 my-2" {...props} />
                                    ),
                                    h1: ({ node, ...props }: any) => (
                                      <h1 className="text-lg font-semibold mt-2 mb-1" {...props} />
                                    ),
                                    h2: ({ node, ...props }: any) => (
                                      <h2 className="text-base font-semibold mt-2 mb-1" {...props} />
                                    ),
                                    h3: ({ node, ...props }: any) => (
                                      <h3 className="text-sm font-semibold mt-1 mb-1" {...props} />
                                    ),
                                    p: ({ node, ...props }: any) => (
                                      <p className="mb-2 last:mb-0" {...props} />
                                    ),
                                    blockquote: ({ node, ...props }: any) => (
                                      <blockquote className="border-l-4 border-primary/30 pl-3 italic my-2" {...props} />
                                    ),
                                    table: ({ node, children, ...props }: any) => (
                                      <div className="overflow-x-auto my-4 w-full">
                                        <table className="min-w-full border-collapse border border-border rounded-md" {...props}>
                                          {children}
                                        </table>
                                      </div>
                                    ),
                                    thead: ({ node, children, ...props }: any) => (
                                      <thead className="bg-muted" {...props}>
                                        {children}
                                      </thead>
                                    ),
                                    tbody: ({ node, children, ...props }: any) => (
                                      <tbody {...props}>
                                        {children}
                                      </tbody>
                                    ),
                                    tr: ({ node, children, ...props }: any) => (
                                      <tr className="border-b border-border hover:bg-muted/50 transition-colors" {...props}>
                                        {children}
                                      </tr>
                                    ),
                                    th: ({ node, children, ...props }: any) => (
                                      <th className="px-4 py-3 border-r border-border bg-muted font-semibold text-left last:border-r-0" {...props}>
                                        {children}
                                      </th>
                                    ),
                                    td: ({ node, children, ...props }: any) => (
                                      <td className="px-4 py-3 border-r border-border last:border-r-0" {...props}>
                                        {children}
                                      </td>
                                    ),
                                  }}
                                >
                                  {displayContent}
                                </ReactMarkdown>
                              </div>
                              
                              {mentionedProperties.length > 0 && (
                                <div className="mt-4 space-y-2">
                                  <div className="text-xs font-medium text-muted-foreground mb-2">
                                    Properties mentioned:
                                  </div>
                                  <div className="grid grid-cols-1 gap-2">
                                    {mentionedProperties.map((property) => (
                                      <Card
                                        key={property.id}
                                        className="p-2 cursor-pointer hover:border-primary/50 transition-colors bg-muted/50"
                                        onClick={() => setSelectedProperty(property.id)}
                                      >
                                        <div className="flex gap-2">
                                          {property.imageUrl && (
                                            <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                                              <Image
                                                src={property.imageUrl}
                                                alt={property.name}
                                                fill
                                                className="object-cover"
                                                sizes="64px"
                                              />
                                            </div>
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium text-xs truncate">
                                              {property.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate">
                                              {property.city} • {property.bedrooms} Bed • {property.type}
                                            </div>
                                            <div className="text-xs font-semibold text-primary mt-0.5">
                                              {property.priceRange}
                                            </div>
                                          </div>
                                        </div>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div
                                className={`text-xs mt-2 ${
                                  msg.role === "user"
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {msg.timestamp.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                    {isLoading && (
                      <div className="flex gap-3 justify-start">
                        <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                          <div className="flex gap-1">
                            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Chat Toggle Button - Only show when chat is collapsed */}
      {!isChatExpanded && chatMessages.length > 0 && (
        <Button
          onClick={() => setIsChatExpanded(true)}
          size="lg"
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90"
        >
          <MessageCircle className="h-6 w-6" />
          {chatMessages.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center text-xs">
              {chatMessages.length}
            </span>
          )}
        </Button>
      )}

      {/* Property Detail Dialog */}
      <Dialog open={!!selectedProperty} onOpenChange={(open) => !open && setSelectedProperty(null)}>
        <DialogContent className="glass-panel sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          {property && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">{property.name}</DialogTitle>
                <DialogDescription className="flex items-center gap-1.5 mt-2">
                  <MapPin className="h-3.5 w-3.5" />
                  {property.city}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-6 space-y-6">
                {/* Property Image */}
                <div className="relative h-96 w-full bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl overflow-hidden">
                  {property.imageUrl ? (
                    <Image
                      src={property.imageUrl}
                      alt={property.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 768px"
                      priority
                      quality={90}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Building2 className="h-24 w-24 text-primary/40" />
                    </div>
                  )}
                </div>

                {/* Price & Status */}
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-serif font-semibold text-primary">{property.priceRange}</div>
                  <Badge
                    variant="outline"
                    className={
                      property.status === "available"
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                        : property.status === "reserved"
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
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
                  <Label className="font-serif text-base">Features</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {property.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
