/**
 * Database types for Supabase
 * 
 * This file can be auto-generated using Supabase CLI:
 * npx supabase gen types typescript --project-id your-project-id > lib/supabase/types.ts
 * 
 * For now, this file serves as a placeholder. After running migrations,
 * generate types using the command above or manually maintain types here.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: 'sales_rep' | 'sales_manager' | 'admin' | 'qa_supervisor' | 'compliance_officer' | 'operations'
          avatar: string | null
          last_active: string
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          role: 'sales_rep' | 'sales_manager' | 'admin' | 'qa_supervisor' | 'compliance_officer' | 'operations'
          avatar?: string | null
          last_active?: string
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'sales_rep' | 'sales_manager' | 'admin' | 'qa_supervisor' | 'compliance_officer' | 'operations'
          avatar?: string | null
          last_active?: string
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      // Add other table types as needed
      // This is a simplified version - generate full types using Supabase CLI
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

