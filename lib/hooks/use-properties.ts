"use client"

import { useEffect, useState } from 'react'
import type { Property } from '@/lib/types'

export function useProperties(filters?: { city?: string; status?: string; type?: string }) {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (filters?.city) params.append('city', filters.city)
        if (filters?.status) params.append('status', filters.status)
        if (filters?.type) params.append('type', filters.type)
        
        const response = await fetch(`/api/properties?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch properties')
        }
        
        const { data } = await response.json()
        
        // Transform database format to component format
        const transformed = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          city: p.city,
          priceRange: p.price_range,
          bedrooms: p.bedrooms,
          type: p.type,
          status: p.status,
          imageUrl: p.image_url,
          description: p.description,
          features: p.features || []
        }))
        
        setProperties(transformed)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setProperties([])
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [filters?.city, filters?.status, filters?.type])

  return { properties, loading, error }
}


