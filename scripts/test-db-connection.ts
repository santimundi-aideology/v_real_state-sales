/**
 * Simple script to test database connection
 * Run with: pnpm tsx scripts/test-db-connection.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Make sure .env.local exists with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  console.log('🔍 Testing Supabase database connection...\n')
  
  try {
    // Test 1: Check if properties table exists and is accessible
    console.log('1. Testing properties table...')
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, name')
      .limit(1)
    
    if (propertiesError) {
      console.error('   ❌ Error:', propertiesError.message)
    } else {
      console.log('   ✅ Properties table accessible')
      console.log(`   📊 Found ${properties?.length || 0} properties`)
    }
    
    // Test 2: Check if integrations table exists and is accessible
    console.log('\n2. Testing integrations table...')
    const { data: integrations, error: integrationsError } = await supabase
      .from('integrations')
      .select('id, name')
      .limit(1)
    
    if (integrationsError) {
      console.error('   ❌ Error:', integrationsError.message)
    } else {
      console.log('   ✅ Integrations table accessible')
      console.log(`   📊 Found ${integrations?.length || 0} integrations`)
    }
    
    // Test 3: Check if users table exists
    console.log('\n3. Testing users table...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (usersError) {
      console.error('   ❌ Error:', usersError.message)
    } else {
      console.log('   ✅ Users table accessible')
      console.log(`   📊 Found ${users?.length || 0} users`)
    }
    
    // Summary
    console.log('\n' + '='.repeat(50))
    if (!propertiesError && !integrationsError && !usersError) {
      console.log('✅ Database connection test PASSED!')
      console.log('\nNext steps:')
      console.log('1. Run the seed script to add sample data: supabase/seed.sql')
      console.log('2. Start building API routes to replace mock data')
      console.log('3. Set up authentication with Supabase Auth')
    } else {
      console.log('❌ Database connection test FAILED')
      console.log('Please check:')
      console.log('- Migration was run successfully')
      console.log('- Environment variables are correct')
      console.log('- RLS policies allow access')
    }
    console.log('='.repeat(50))
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
    process.exit(1)
  }
}

testConnection()

