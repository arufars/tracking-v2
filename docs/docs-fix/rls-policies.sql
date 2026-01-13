-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Dreamlight World Media Production Tracking System
-- ============================================================================
-- Purpose: Implement database-level data isolation for role-based access
-- Roles: production, broadcaster, investor
-- Date: January 8, 2026
-- ============================================================================

-- ============================================================================
-- STEP 1: ENABLE RLS ON TABLES
-- ============================================================================

-- Enable RLS pada semua tabel yang memerlukan data isolation
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_records ENABLE ROW LEVEL SECURITY;

-- Force RLS pada tabel yang sangat sensitif (tidak bisa di-bypass bahkan oleh owner)
ALTER TABLE team_payments FORCE ROW LEVEL SECURITY;
ALTER TABLE expenses FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: PRODUCTION POLICIES (FULL ACCESS)
-- ============================================================================

-- Production: Full access ke Projects
CREATE POLICY "production_full_access_projects" ON projects
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'production'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'production'
    )
  );

-- Production: Full access ke Milestones
CREATE POLICY "production_full_access_milestones" ON milestones
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'production'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'production'
    )
  );

-- Production: Full access ke Episodes
CREATE POLICY "production_full_access_episodes" ON episodes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'production'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'production'
    )
  );

-- Production: Full access ke Team Payments (CRITICAL - ONLY Production)
CREATE POLICY "team_payments_production_only" ON team_payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'production'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'production'
    )
  );

-- Production: Full access ke Financial Records
CREATE POLICY "production_full_access_financials" ON financial_records
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'production'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'production'
    )
  );

-- Production: Full access ke Expenses
CREATE POLICY "production_full_access_expenses" ON expenses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'production'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'production'
    )
  );

-- Production: Full access ke Income Records
CREATE POLICY "production_full_access_income" ON income_records
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'production'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'production'
    )
  );

-- Production: Full visibility editing segments (episode_stage_segments) tanpa perlu assignment
ALTER TABLE episode_stage_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "production_full_access_episode_segments" ON episode_stage_segments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('production', 'admin')
    )
  );

-- Production: Full visibility user_projects (agar sesama production bisa lihat assignments)
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "production_view_user_projects" ON user_projects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('production', 'admin')
    )
  );

-- ============================================================================
-- STEP 3: BROADCASTER POLICIES (OWN PROJECTS ONLY, READ-ONLY)
-- ============================================================================

-- Broadcaster: READ only, own projects
CREATE POLICY "broadcaster_own_projects" ON projects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'broadcaster'
      AND projects.broadcaster_id = users.id
    )
  );

-- Broadcaster: READ only, visible milestones
CREATE POLICY "broadcaster_visible_milestones" ON milestones
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN projects p ON p.id = milestones.project_id
      WHERE u.id = auth.uid()
      AND u.role = 'broadcaster'
      AND p.broadcaster_id = u.id
      AND milestones.visible_to_client = true
    )
  );

-- Broadcaster: READ only, episodes dari own projects
CREATE POLICY "broadcaster_episode_view" ON episodes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN projects p ON p.id = episodes.project_id
      WHERE u.id = auth.uid()
      AND u.role = 'broadcaster'
      AND p.broadcaster_id = u.id
    )
  );

-- Broadcaster: NO ACCESS ke team_payments (no policy = denied)
-- Broadcaster: NO ACCESS ke expenses (no policy = denied)
-- Broadcaster: NO ACCESS ke income_records (no policy = denied)

-- ============================================================================
-- STEP 4: INVESTOR POLICIES (ALL PROJECTS SUMMARY, READ-ONLY)
-- ============================================================================

-- Investor: READ only, all projects (summary)
CREATE POLICY "investor_summary_access" ON projects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'investor'
    )
  );

-- Investor: READ only, visible milestones
CREATE POLICY "investor_visible_milestones" ON milestones
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'investor'
      AND milestones.visible_to_investor = true
    )
  );

-- Investor: READ only, financial summary (percentage data)
-- Note: Application layer MUST filter out actual amounts
CREATE POLICY "investor_financial_summary" ON financial_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'investor'
    )
  );

-- Investor: NO ACCESS ke episodes (no policy = denied)
-- Investor: NO ACCESS ke team_payments (no policy = denied)
-- Investor: NO ACCESS ke expenses (no policy = denied)
-- Investor: NO ACCESS ke income_records (no policy = denied)

-- ============================================================================
-- STEP 5: HELPER FUNCTIONS
-- ============================================================================

-- Function untuk get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function untuk check project ownership
CREATE OR REPLACE FUNCTION is_project_owner(project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects p
    JOIN users u ON u.id = auth.uid()
    WHERE p.id = project_id
    AND p.broadcaster_id = u.id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function untuk check milestone visibility
CREATE OR REPLACE FUNCTION can_view_milestone(milestone_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := get_user_role();
  
  CASE user_role
    WHEN 'production' THEN
      RETURN TRUE;
    
    WHEN 'broadcaster' THEN
      RETURN EXISTS (
        SELECT 1 FROM milestones m
        JOIN projects p ON p.id = m.project_id
        WHERE m.id = milestone_id
        AND p.broadcaster_id = auth.uid()
        AND m.visible_to_client = true
      );
    
    WHEN 'investor' THEN
      RETURN EXISTS (
        SELECT 1 FROM milestones m
        WHERE m.id = milestone_id
        AND m.visible_to_investor = true
      );
    
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 6: AUDIT LOGGING
-- ============================================================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS rls_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  user_role TEXT NOT NULL,
  table_name TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_id UUID,
  blocked BOOLEAN DEFAULT false,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  policy_name TEXT,
  error_message TEXT,
  ip_address INET,
  user_agent TEXT
);

-- Index untuk performance
CREATE INDEX IF NOT EXISTS idx_rls_audit_user_id ON rls_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_rls_audit_attempted_at ON rls_audit_log(attempted_at);
CREATE INDEX IF NOT EXISTS idx_rls_audit_blocked ON rls_audit_log(blocked);

-- View untuk monitoring violations
CREATE OR REPLACE VIEW rls_violation_summary AS
SELECT 
  u.email,
  u.role,
  a.table_name,
  a.action,
  COUNT(*) as attempt_count,
  MAX(a.attempted_at) as last_attempt
FROM rls_audit_log a
JOIN users u ON u.id = a.user_id
WHERE a.blocked = true
GROUP BY u.email, u.role, a.table_name, a.action
ORDER BY attempt_count DESC;

-- View untuk recent activity
CREATE OR REPLACE VIEW rls_recent_activity AS
SELECT 
  u.email,
  u.role,
  a.table_name,
  a.action,
  a.resource_id,
  a.blocked,
  a.attempted_at
FROM rls_audit_log a
JOIN users u ON u.id = a.user_id
ORDER BY a.attempted_at DESC
LIMIT 100;

-- ============================================================================
-- STEP 7: TESTING QUERIES
-- ============================================================================

-- Test sebagai Production (should see all)
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claim.sub = 'user-production-id';
-- SELECT * FROM projects;           -- Should return all projects
-- SELECT * FROM team_payments;      -- Should return all payments
-- SELECT * FROM milestones;         -- Should return all milestones

-- Test sebagai Broadcaster (should see only own)
-- SET LOCAL request.jwt.claim.sub = 'user-broadcaster-id';
-- SELECT * FROM projects;           -- Should return only own projects
-- SELECT * FROM team_payments;      -- Should return 0 rows (denied)
-- SELECT * FROM milestones WHERE visible_to_client = true; -- Should return only public milestones

-- Test sebagai Investor (should see summary only)
-- SET LOCAL request.jwt.claim.sub = 'user-investor-id';
-- SELECT * FROM projects;           -- Should return all projects
-- SELECT * FROM episodes;           -- Should return 0 rows (denied)
-- SELECT * FROM team_payments;      -- Should return 0 rows (denied)
-- SELECT * FROM milestones WHERE visible_to_investor = true; -- Should return only public milestones

-- ============================================================================
-- STEP 8: GRANT PERMISSIONS
-- ============================================================================

-- Grant select pada helper functions
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_project_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_view_milestone(UUID) TO authenticated;

-- Grant select pada audit views (only for Tim Produksi)
-- This will be handled by application layer

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. RLS policies work in conjunction with application-layer authorization
-- 2. For Investor financial data, application layer MUST still filter amounts
-- 3. Audit logging should be triggered from application layer
-- 4. Regularly review rls_violation_summary for security issues
-- 5. Test policies thoroughly after any schema changes
-- ============================================================================
