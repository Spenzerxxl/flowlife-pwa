-- ============================================
-- FLOWLIFE COMPLETE SETUP SCRIPT
-- ============================================
-- WARNUNG: Löscht ALLE alten Tabellen!
-- Nur ausführen wenn Supabase-Projekt zurückgesetzt werden soll

-- SCHRITT 1: CLEANUP (Alte Tabellen löschen)
-- ============================================

-- Drop all existing tables (CASCADE löscht abhängige Objekte)
DROP TABLE IF EXISTS mail_history CASCADE;
DROP TABLE IF EXISTS ai_suggestions CASCADE;
DROP TABLE IF EXISTS voice_inputs CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS task_category CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================
-- SCHRITT 2: FLOWLIFE SCHEMA NEU ERSTELLEN
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task Categories & Status
CREATE TYPE task_category AS ENUM (
  'Allgemein', 
  'Familie', 
  'Umzug', 
  'Loge', 
  'Termine', 
  'Business',
  'Gesundheit',
  'Finanzen',
  'Haushalt'
);

CREATE TYPE task_status AS ENUM (
  'open', 
  'in-progress', 
  'completed', 
  'urgent', 
  'cancelled',
  'delegated'
);

-- Tasks Table (Haupttabelle)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category task_category DEFAULT 'Allgemein',
  status task_status DEFAULT 'open',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  deadline DATE,
  reminder_date TIMESTAMPTZ,
  context TEXT,
  voice_created BOOLEAN DEFAULT FALSE,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  position INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- AI Suggestions Table
CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'mail', 'message', 'call', 'research', 'delegate'
  text TEXT NOT NULL,
  recipient TEXT,
  template TEXT,
  confidence_score FLOAT DEFAULT 0.0,
  executed BOOLEAN DEFAULT FALSE,
  executed_at TIMESTAMPTZ,
  execution_result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mail History Table
CREATE TABLE mail_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient TEXT NOT NULL,
  cc TEXT,
  bcc TEXT,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  ai_generated BOOLEAN DEFAULT FALSE,
  template_used TEXT,
  attachments JSONB DEFAULT '[]',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  n8n_workflow_id TEXT,
  status TEXT DEFAULT 'sent', -- 'draft', 'sent', 'failed', 'scheduled'
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Voice Inputs Table (für Analytics & History)
CREATE TABLE voice_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  transcript TEXT NOT NULL,
  confidence FLOAT DEFAULT 0.0,
  input_type TEXT, -- 'task', 'mail', 'command', 'search'
  language TEXT DEFAULT 'de-DE',
  duration_ms INTEGER,
  processed BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Executions Table (n8n Tracking)
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  workflow_name TEXT NOT NULL,
  workflow_id TEXT,
  trigger_type TEXT, -- 'manual', 'scheduled', 'webhook', 'voice'
  input_data JSONB,
  output_data JSONB,
  status TEXT DEFAULT 'running', -- 'running', 'success', 'failed'
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER
);

-- Templates Table (für wiederverwendbare Vorlagen)
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'mail', 'task', 'workflow'
  category TEXT,
  content JSONB NOT NULL,
  usage_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES für Performance
-- ============================================

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX idx_ai_suggestions_task_id ON ai_suggestions(task_id);
CREATE INDEX idx_mail_history_user_id ON mail_history(user_id);
CREATE INDEX idx_mail_history_task_id ON mail_history(task_id);
CREATE INDEX idx_voice_inputs_user_id ON voice_inputs(user_id);
CREATE INDEX idx_workflow_executions_user_id ON workflow_executions(user_id);
CREATE INDEX idx_templates_user_id ON templates(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mail_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only see their own data
CREATE POLICY "Users can view own profile" ON users 
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own tasks" ON tasks 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON tasks 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON tasks 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON tasks 
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view task suggestions" ON ai_suggestions 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = ai_suggestions.task_id AND tasks.user_id = auth.uid())
  );

CREATE POLICY "Users can view own mail history" ON mail_history 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own voice inputs" ON voice_inputs 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own workflows" ON workflow_executions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own templates" ON templates 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public templates are viewable" ON templates 
  FOR SELECT USING (is_public = true);

-- ============================================
-- TRIGGER FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-set completed_at when task is completed
CREATE OR REPLACE FUNCTION update_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
    NEW.progress = 100;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_task_completed_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_completed_at();

-- ============================================
-- INITIAL DATA (Demo/Test)
-- ============================================

-- Demo User (für Tests)
INSERT INTO users (id, email, name) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'demo@flowlife.app', 'Demo User');

-- Demo Tasks
INSERT INTO tasks (user_id, title, category, status, progress, context, deadline) VALUES
  ('11111111-1111-1111-1111-111111111111', 'FlowLife PWA fertigstellen', 'Business', 'in-progress', 50, 'Voice + Claude + n8n Integration', '2025-08-10'),
  ('11111111-1111-1111-1111-111111111111', 'Supabase Backend testen', 'Business', 'open', 0, 'API Endpoints validieren', '2025-08-07'),
  ('11111111-1111-1111-1111-111111111111', 'n8n Workflows einrichten', 'Business', 'open', 0, 'Gmail und Claude API', '2025-08-08');

-- ============================================
-- STORED PROCEDURES (Hilfsfunktionen)
-- ============================================

-- Get task statistics for a user
CREATE OR REPLACE FUNCTION get_user_task_stats(p_user_id UUID)
RETURNS TABLE (
  total_tasks BIGINT,
  open_tasks BIGINT,
  completed_tasks BIGINT,
  urgent_tasks BIGINT,
  avg_progress NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_tasks,
    COUNT(*) FILTER (WHERE status = 'open') as open_tasks,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
    COUNT(*) FILTER (WHERE status = 'urgent') as urgent_tasks,
    AVG(progress)::NUMERIC as avg_progress
  FROM tasks
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FERTIG! 🎉
-- ============================================
-- FlowLife Datenbank ist bereit für:
-- ✅ Voice-gesteuerte Task-Eingabe
-- ✅ KI-generierte Mail-Vorschläge
-- ✅ n8n Workflow-Integration
-- ✅ Multi-User mit RLS
-- ✅ Analytics & Tracking

COMMENT ON SCHEMA public IS 'FlowLife - Voice-Powered Life Management System';
