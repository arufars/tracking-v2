-- ============================================================================
-- MIGRATION: Add Missing Tables & Fields for RLS Policies
-- ============================================================================
-- Purpose: Update existing v3-skema-FIXED to support RLS policies
-- Date: January 8, 2026
-- Run After: v3-skema-FIXED.md already executed
-- Run Before: rls-policies-corrected.sql
-- ============================================================================

-- ============================================================================
-- STEP 1: ADD MISSING FIELDS TO EXISTING TABLES
-- ============================================================================

-- Add broadcaster_id to projects (CRITICAL for RLS!)
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS broadcaster_id uuid REFERENCES public.users(id);

-- Add updated_at to projects
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add updated_at to episodes
ALTER TABLE public.episodes 
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_projects_broadcaster_id ON public.projects(broadcaster_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects(updated_at);

-- ============================================================================
-- STEP 2: UPDATE users.role CONSTRAINT (Support 'admin')
-- ============================================================================

-- Drop old constraint
ALTER TABLE public.users 
  DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint (support both 'admin' and 'production')
ALTER TABLE public.users 
  ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'production', 'broadcaster', 'investor'));

-- Note: 'admin' and 'production' akan diperlakukan sama dalam RLS policies

-- ============================================================================
-- STEP 3: RENAME payments TO team_payments (CRITICAL!)
-- ============================================================================

-- Option A: Rename existing table
ALTER TABLE IF EXISTS public.payments 
  RENAME TO team_payments;

-- Add missing fields to team_payments
ALTER TABLE public.team_payments 
  ADD COLUMN IF NOT EXISTS member_name text;

-- Copy recipient_name to member_name if exists
UPDATE public.team_payments 
SET member_name = recipient_name 
WHERE member_name IS NULL AND recipient_name IS NOT NULL;

-- Update status enum constraint
ALTER TABLE public.team_payments 
  DROP CONSTRAINT IF EXISTS payments_status_check,
  DROP CONSTRAINT IF EXISTS team_payments_status_check;

ALTER TABLE public.team_payments 
  ADD CONSTRAINT team_payments_status_check 
  CHECK (status IN ('pending', 'paid', 'overdue'));

-- Add receipt_url field
ALTER TABLE public.team_payments 
  ADD COLUMN IF NOT EXISTS receipt_url text;

-- Add created_by field
ALTER TABLE public.team_payments 
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id);

-- Add updated_at field
ALTER TABLE public.team_payments 
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Update payment_type constraint
ALTER TABLE public.team_payments 
  DROP CONSTRAINT IF EXISTS payments_payment_type_check,
  DROP CONSTRAINT IF EXISTS team_payments_payment_type_check;

ALTER TABLE public.team_payments 
  ADD CONSTRAINT team_payments_payment_type_check 
  CHECK (payment_type IN ('honor', 'salary', 'petty_cash', 'vendor', 'other'));

-- Make member_name NOT NULL after migration
UPDATE public.team_payments SET member_name = 'Unknown' WHERE member_name IS NULL;
ALTER TABLE public.team_payments ALTER COLUMN member_name SET NOT NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_team_payments_project_id ON public.team_payments(project_id);
CREATE INDEX IF NOT EXISTS idx_team_payments_status ON public.team_payments(status);

-- ============================================================================
-- STEP 4: CREATE milestones TABLE (CRITICAL!)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.milestones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  
  name text NOT NULL,
  description text,
  
  due_date date,
  completed_at timestamptz,
  is_completed boolean DEFAULT false,
  
  -- Visibility controls (REQUIRED for RLS policies)
  visible_to_client boolean DEFAULT true,
  visible_to_investor boolean DEFAULT true,
  
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON public.milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_visible_to_client ON public.milestones(visible_to_client);
CREATE INDEX IF NOT EXISTS idx_milestones_visible_to_investor ON public.milestones(visible_to_investor);

COMMENT ON TABLE public.milestones IS 'Project milestones with visibility control for RBAC';
COMMENT ON COLUMN public.milestones.visible_to_client IS 'Controls visibility for broadcaster/client role';
COMMENT ON COLUMN public.milestones.visible_to_investor IS 'Controls visibility for investor role';

-- ============================================================================
-- STEP 5: CREATE financial_records TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.financial_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  
  record_type text CHECK (record_type IN ('budget', 'expense', 'income')),
  
  amount numeric NOT NULL,
  description text,
  
  category text, -- Production, Post-Production, Operational, etc
  subcategory text,
  
  recorded_date date DEFAULT current_date,
  
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_financial_records_project_id ON public.financial_records(project_id);
CREATE INDEX IF NOT EXISTS idx_financial_records_type ON public.financial_records(record_type);
CREATE INDEX IF NOT EXISTS idx_financial_records_category ON public.financial_records(category);

COMMENT ON TABLE public.financial_records IS 'Consolidated financial tracking for budget, expenses, and income';

-- ============================================================================
-- STEP 6: CREATE expenses TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  
  description text NOT NULL,
  amount numeric NOT NULL,
  
  category text, -- Budget category
  expense_date date DEFAULT current_date,
  
  receipt_url text,
  
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON public.expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date);

COMMENT ON TABLE public.expenses IS 'Detailed expense tracking per project (SENSITIVE - Production only)';

-- ============================================================================
-- STEP 7: CREATE income_records TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.income_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  
  description text NOT NULL,
  amount numeric NOT NULL,
  
  payment_status text CHECK (payment_status IN ('pending', 'received')) DEFAULT 'pending',
  expected_date date,
  received_date date,
  
  invoice_number text,
  
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_income_records_project_id ON public.income_records(project_id);
CREATE INDEX IF NOT EXISTS idx_income_records_status ON public.income_records(payment_status);
CREATE INDEX IF NOT EXISTS idx_income_records_expected_date ON public.income_records(expected_date);

COMMENT ON TABLE public.income_records IS 'Income/payment tracking from clients (SENSITIVE - Production only)';


CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- EPISODE_STAGE_SEGMENTS (editing per-segment progress)
CREATE TABLE IF NOT EXISTS public.episode_stage_segments (
  episode_id uuid REFERENCES public.episodes(id) ON DELETE CASCADE,
  stage text NOT NULL CHECK (stage IN ('editing')),
  segment_number int NOT NULL CHECK (segment_number BETWEEN 1 AND 3),
  cut_percent int NOT NULL DEFAULT 0 CHECK (cut_percent BETWEEN 0 AND 100),
  audio_percent int NOT NULL DEFAULT 0 CHECK (audio_percent BETWEEN 0 AND 100),
  graphics_percent int NOT NULL DEFAULT 0 CHECK (graphics_percent BETWEEN 0 AND 100),
  master_percent int NOT NULL DEFAULT 0 CHECK (master_percent BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (episode_id, stage, segment_number)
);

CREATE INDEX IF NOT EXISTS idx_episode_stage_segments_episode ON public.episode_stage_segments(episode_id);

-- RLS
ALTER TABLE public.episode_stage_segments ENABLE ROW LEVEL SECURITY;

-- Select
DROP POLICY IF EXISTS episode_stage_segments_select ON public.episode_stage_segments;
CREATE POLICY episode_stage_segments_select ON public.episode_stage_segments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_projects up
      JOIN public.episodes e ON e.id = episode_id
      WHERE up.project_id = e.project_id AND up.user_id = auth.uid()
    )
  );

-- Insert
DROP POLICY IF EXISTS episode_stage_segments_insert ON public.episode_stage_segments;
CREATE POLICY episode_stage_segments_insert ON public.episode_stage_segments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_projects up
      JOIN public.episodes e ON e.id = episode_id
      WHERE up.project_id = e.project_id AND up.user_id = auth.uid()
    )
  );

-- Update
DROP POLICY IF EXISTS episode_stage_segments_update ON public.episode_stage_segments;
CREATE POLICY episode_stage_segments_update ON public.episode_stage_segments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_projects up
      JOIN public.episodes e ON e.id = episode_id
      WHERE up.project_id = e.project_id AND up.user_id = auth.uid()
    )
  );

-- Delete
DROP POLICY IF EXISTS episode_stage_segments_delete ON public.episode_stage_segments;
CREATE POLICY episode_stage_segments_delete ON public.episode_stage_segments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_projects up
      JOIN public.episodes e ON e.id = episode_id
      WHERE up.project_id = e.project_id AND up.user_id = auth.uid()
    )
  );
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_type ON public.projects(type);

-- user_projects table
CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON public.user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_project_id ON public.user_projects(project_id);

-- episodes table
CREATE INDEX IF NOT EXISTS idx_episodes_project_id ON public.episodes(project_id);
CREATE INDEX IF NOT EXISTS idx_episodes_status ON public.episodes(status);
CREATE INDEX IF NOT EXISTS idx_episodes_priority ON public.episodes(priority);
CREATE INDEX IF NOT EXISTS idx_episodes_air_date ON public.episodes(air_date);

-- episode_stages table
CREATE INDEX IF NOT EXISTS idx_episode_stages_episode_id ON public.episode_stages(episode_id);
CREATE INDEX IF NOT EXISTS idx_episode_stages_stage ON public.episode_stages(stage);
CREATE INDEX IF NOT EXISTS idx_episode_stages_status ON public.episode_stages(status);

-- stage_tasks table
CREATE INDEX IF NOT EXISTS idx_stage_tasks_stage_id ON public.stage_tasks(stage_id);

-- audit_logs table
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_project_id ON public.audit_logs(project_id);

-- ============================================================================
-- STEP 9: VERIFICATION QUERIES
-- ============================================================================

-- Check if all required tables exist
DO $$
DECLARE
  missing_tables text[];
BEGIN
  SELECT array_agg(table_name)
  INTO missing_tables
  FROM (VALUES 
    ('users'), ('projects'), ('user_projects'), ('episodes'), 
    ('episode_stages'), ('stage_tasks'), ('milestones'), 
    ('team_payments'), ('financial_records'), ('expenses'), 
    ('income_records'), ('audit_logs')
  ) AS required(table_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = required.table_name
  );
  
  IF missing_tables IS NOT NULL THEN
    RAISE EXCEPTION 'Missing tables: %', array_to_string(missing_tables, ', ');
  ELSE
    RAISE NOTICE '✅ All required tables exist';
  END IF;
END $$;

-- Check if broadcaster_id exists in projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'broadcaster_id'
  ) THEN
    RAISE EXCEPTION '❌ projects.broadcaster_id is missing!';
  ELSE
    RAISE NOTICE '✅ projects.broadcaster_id exists';
  END IF;
END $$;

-- Check if milestones has visibility columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'milestones' 
    AND column_name IN ('visible_to_client', 'visible_to_investor')
  ) THEN
    RAISE EXCEPTION '❌ milestones visibility columns are missing!';
  ELSE
    RAISE NOTICE '✅ milestones visibility columns exist';
  END IF;
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ MIGRATION COMPLETED SUCCESSFULLY';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Changes Applied:';
  RAISE NOTICE '   • Added projects.broadcaster_id (CRITICAL for RLS)';
  RAISE NOTICE '   • Added projects.updated_at';
  RAISE NOTICE '   • Updated users.role constraint (support admin & production)';
  RAISE NOTICE '   • Renamed payments → team_payments';
  RAISE NOTICE '   • Created milestones table (CRITICAL for RLS)';
  RAISE NOTICE '   • Created financial_records table';
  RAISE NOTICE '   • Created expenses table';
  RAISE NOTICE '   • Created income_records table';
  RAISE NOTICE '   • Added 30+ performance indexes';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NEXT STEP:';
  RAISE NOTICE '   Execute: rls-policies-corrected.sql';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
