-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable JSONB support (already available in PostgreSQL)
-- Enable array support (already available in PostgreSQL)

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('sales_rep', 'sales_manager', 'admin', 'qa_supervisor', 'compliance_officer', 'operations')),
  avatar TEXT,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prospects table
CREATE TABLE public.prospects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  budget TEXT,
  city TEXT,
  timeline TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'appointment_set', 'closed', 'lost')),
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  last_contact TIMESTAMPTZ,
  preferred_channel TEXT CHECK (preferred_channel IN ('phone', 'whatsapp', 'sms', 'email')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties table
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  price_range TEXT NOT NULL,
  bedrooms INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('villa', 'apartment', 'penthouse', 'townhouse')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
  image_url TEXT,
  description TEXT NOT NULL,
  features TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  segment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  channels TEXT[] NOT NULL DEFAULT '{}',
  attempts INTEGER NOT NULL DEFAULT 0,
  connect_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  booked_appointments INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospect_id UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  prospect_name TEXT NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration INTEGER NOT NULL DEFAULT 0, -- in seconds
  channel TEXT NOT NULL CHECK (channel IN ('phone', 'whatsapp', 'sms', 'email')),
  outcome TEXT NOT NULL CHECK (outcome IN ('connected', 'voicemail', 'no_answer', 'busy', 'qualified', 'not_interested', 'responded', 'opened', 'clicked')),
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  transcript TEXT,
  ai_confidence TEXT CHECK (ai_confidence IN ('high', 'medium', 'low')),
  handoff_suggested BOOLEAN DEFAULT FALSE,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Actions table (for conversation actions)
CREATE TABLE public.agent_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'pending', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Qualification Scores table
CREATE TABLE public.qualification_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  intent_score DECIMAL(5, 2) NOT NULL DEFAULT 0,
  budget_fit_score DECIMAL(5, 2) NOT NULL DEFAULT 0,
  urgency TEXT NOT NULL CHECK (urgency IN ('high', 'medium', 'low')),
  property_match_confidence DECIMAL(5, 2) NOT NULL DEFAULT 0,
  risk_flags TEXT[] DEFAULT '{}',
  overall_score DECIMAL(5, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospect_id UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  prospect_name TEXT NOT NULL,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  property_name TEXT NOT NULL,
  assigned_rep_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_rep_name TEXT NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'no_show', 'rescheduled')),
  notes TEXT,
  source_channel TEXT CHECK (source_channel IN ('phone', 'whatsapp', 'sms', 'email')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integrations table
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('crm', 'telephony', 'calendar', 'messaging', 'email')),
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  last_sync TIMESTAMPTZ,
  icon TEXT,
  config JSONB DEFAULT '{}', -- Store integration-specific configuration
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Detected Entities table (for live conversations)
CREATE TABLE public.detected_entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  live_conversation_id UUID, -- Will reference live_conversations table
  type TEXT NOT NULL CHECK (type IN ('budget', 'area', 'bedrooms', 'timeline', 'intent')),
  value TEXT NOT NULL,
  confidence DECIMAL(5, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Live Conversations table
CREATE TABLE public.live_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospect_id UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  prospect_name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('phone', 'whatsapp', 'sms', 'email')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('dialing', 'ringing', 'connected', 'ended', 'typing', 'waiting')),
  duration INTEGER NOT NULL DEFAULT 0, -- in seconds
  next_best_question TEXT,
  sentiment TEXT NOT NULL DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Transcript Messages table
CREATE TABLE public.transcript_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  live_conversation_id UUID NOT NULL REFERENCES public.live_conversations(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  speaker TEXT NOT NULL CHECK (speaker IN ('agent', 'prospect')),
  message TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'document', 'location')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Plan Steps table
CREATE TABLE public.agent_plan_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  live_conversation_id UUID NOT NULL REFERENCES public.live_conversations(id) ON DELETE CASCADE,
  step INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'in_progress', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Runs table
CREATE TABLE public.campaign_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'completed')),
  current_conversation_id UUID REFERENCES public.live_conversations(id) ON DELETE SET NULL,
  metrics JSONB NOT NULL DEFAULT '{}', -- Store CampaignRunMetrics as JSONB
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Queued Leads table
CREATE TABLE public.queued_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_run_id UUID NOT NULL REFERENCES public.campaign_runs(id) ON DELETE CASCADE,
  prospect_id UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  prospect_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('phone', 'whatsapp', 'sms', 'email')),
  whatsapp TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'dialing', 'connected', 'completed', 'failed', 'sending', 'delivered', 'responded')),
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routing Rules table
CREATE TABLE public.routing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]', -- Store RoutingCondition[] as JSONB
  assign_to TEXT NOT NULL, -- UUID or 'auto'
  priority INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Handoff Packages table
CREATE TABLE public.handoff_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  prospect_id UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  prospect_name TEXT NOT NULL,
  prospect_phone TEXT NOT NULL,
  prospect_email TEXT NOT NULL,
  prospect_whatsapp TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  reason TEXT NOT NULL,
  summary TEXT NOT NULL,
  detected_needs TEXT[] DEFAULT '{}',
  suggested_properties TEXT[] DEFAULT '{}',
  qualification_score JSONB NOT NULL DEFAULT '{}', -- Store QualificationScore as JSONB
  conversation_context TEXT NOT NULL,
  next_steps TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'completed', 'expired')),
  claimed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  source_channel TEXT NOT NULL CHECK (source_channel IN ('phone', 'whatsapp', 'sms', 'email')),
  suggested_follow_up_channel TEXT CHECK (suggested_follow_up_channel IN ('phone', 'whatsapp', 'sms', 'email')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update detected_entities to reference live_conversations
ALTER TABLE public.detected_entities
ADD CONSTRAINT fk_live_conversation
FOREIGN KEY (live_conversation_id) REFERENCES public.live_conversations(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX idx_prospects_assigned_to ON public.prospects(assigned_to);
CREATE INDEX idx_prospects_status ON public.prospects(status);
CREATE INDEX idx_prospects_city ON public.prospects(city);
CREATE INDEX idx_conversations_prospect_id ON public.conversations(prospect_id);
CREATE INDEX idx_conversations_campaign_id ON public.conversations(campaign_id);
CREATE INDEX idx_conversations_timestamp ON public.conversations(timestamp);
CREATE INDEX idx_conversations_channel ON public.conversations(channel);
CREATE INDEX idx_appointments_prospect_id ON public.appointments(prospect_id);
CREATE INDEX idx_appointments_assigned_rep_id ON public.appointments(assigned_rep_id);
CREATE INDEX idx_appointments_scheduled_date ON public.appointments(scheduled_date);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_campaigns_created_by ON public.campaigns(created_by);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_live_conversations_prospect_id ON public.live_conversations(prospect_id);
CREATE INDEX idx_live_conversations_status ON public.live_conversations(status);
CREATE INDEX idx_transcript_messages_live_conversation_id ON public.transcript_messages(live_conversation_id);
CREATE INDEX idx_transcript_messages_conversation_id ON public.transcript_messages(conversation_id);
CREATE INDEX idx_handoff_packages_status ON public.handoff_packages(status);
CREATE INDEX idx_handoff_packages_claimed_by ON public.handoff_packages(claimed_by);
CREATE INDEX idx_queued_leads_campaign_run_id ON public.queued_leads(campaign_run_id);
CREATE INDEX idx_queued_leads_status ON public.queued_leads(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prospects_updated_at BEFORE UPDATE ON public.prospects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_plan_steps_updated_at BEFORE UPDATE ON public.agent_plan_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_runs_updated_at BEFORE UPDATE ON public.campaign_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_queued_leads_updated_at BEFORE UPDATE ON public.queued_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routing_rules_updated_at BEFORE UPDATE ON public.routing_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_handoff_packages_updated_at BEFORE UPDATE ON public.handoff_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualification_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detected_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcript_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_plan_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queued_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handoff_packages ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be customized based on your needs)
-- Users can read their own data
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can read all users
CREATE POLICY "Admins can read all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- For now, allow all authenticated users to read/write (you can refine these later)
CREATE POLICY "Authenticated users can read prospects" ON public.prospects
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert prospects" ON public.prospects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update prospects" ON public.prospects
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Similar policies for other tables (simplified for now)
CREATE POLICY "Authenticated users can read properties" ON public.properties
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read campaigns" ON public.campaigns
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read conversations" ON public.conversations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read appointments" ON public.appointments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read integrations" ON public.integrations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read live conversations" ON public.live_conversations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read handoff packages" ON public.handoff_packages
  FOR SELECT USING (auth.role() = 'authenticated');

-- Note: You'll want to refine these RLS policies based on your specific role-based access requirements

