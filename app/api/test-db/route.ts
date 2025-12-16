import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerClient()
    
    // Test query to check if tables exist
    const { data: properties, error: propertiesError, count: propertiesCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
    
    const { data: integrations, error: integrationsError, count: integrationsCount } = await supabase
      .from('integrations')
      .select('*', { count: 'exact', head: true })
    
    if (propertiesError || integrationsError) {
      return NextResponse.json(
        {
          success: false,
          error: propertiesError?.message || integrationsError?.message,
          message: 'Database connection test failed'
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful!',
      tables: {
        properties: {
          accessible: true,
          count: propertiesCount || 0
        },
        integrations: {
          accessible: true,
          count: integrationsCount || 0
        }
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to connect to database'
      },
      { status: 500 }
    )
  }
}

