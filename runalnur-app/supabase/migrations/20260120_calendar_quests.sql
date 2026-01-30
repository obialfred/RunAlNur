-- Dynasty Calendar & Quest System
-- Migration: 2026-01-20
-- Description: Tables for focus blocks, employee shifts, gamification, and quests

-- ============================================================================
-- FOCUS BLOCKS - Chairman's time allocation across ventures
-- ============================================================================
CREATE TABLE IF NOT EXISTS focus_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Block content
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Context (which venture/area)
  context VARCHAR(50) NOT NULL CHECK (context IN (
    'nova', 'janna', 'obx', 'silk', 'atw', 'house', 'maison',
    'personal', 'admin', 'training', 'other'
  )),
  
  -- Timing
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone VARCHAR(50) DEFAULT 'America/Chicago',
  
  -- Recurrence (iCal RRULE format)
  recurrence_rule TEXT,
  recurrence_end_date DATE,
  parent_block_id UUID REFERENCES focus_blocks(id) ON DELETE CASCADE, -- For recurring instances
  
  -- Visual
  color VARCHAR(7), -- Override color (hex)
  
  -- Calendar sync
  google_event_id TEXT,
  google_calendar_id TEXT,
  last_synced_at TIMESTAMPTZ,
  sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN (
    'pending', 'synced', 'error', 'local_only'
  )),
  
  -- Status
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- ============================================================================
-- EMPLOYEE SHIFTS - Shift scheduling for House Al Nur employees
-- ============================================================================
CREATE TABLE IF NOT EXISTS employee_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Shift details
  arm_id TEXT REFERENCES arms(id) ON DELETE SET NULL,
  shift_type VARCHAR(50) DEFAULT 'standard' CHECK (shift_type IN (
    'morning', 'afternoon', 'evening', 'night', 'split', 'custom'
  )),
  
  -- Timing
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone VARCHAR(50) DEFAULT 'America/Chicago',
  break_minutes INTEGER DEFAULT 0,
  
  -- Recurrence
  recurrence_rule TEXT,
  parent_shift_id UUID REFERENCES employee_shifts(id) ON DELETE CASCADE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'confirmed', 'in_progress', 'completed', 
    'missed', 'cancelled', 'swap_pending'
  )),
  
  -- Calendar sync
  google_event_id TEXT,
  last_synced_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  
  -- Swap tracking
  swap_requested_by UUID REFERENCES auth.users(id),
  swap_with_shift_id UUID REFERENCES employee_shifts(id),
  swap_status VARCHAR(20) CHECK (swap_status IN (
    'pending', 'approved', 'rejected'
  )),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_shift_time CHECK (end_time > start_time)
);

-- ============================================================================
-- STANDING POINTS - Gamification domain scores
-- ============================================================================
CREATE TABLE IF NOT EXISTS standing_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Domain
  domain VARCHAR(50) NOT NULL CHECK (domain IN (
    'command', 'capital', 'influence', 'reliability', 'growth'
  )),
  
  -- Points and level
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  
  -- Streak tracking
  streak_days INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  streak_shields INTEGER DEFAULT 0, -- Earned protection
  last_activity_at TIMESTAMPTZ,
  streak_broken_at TIMESTAMPTZ,
  
  -- Progress to next level
  points_to_next_level INTEGER DEFAULT 100,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, domain)
);

-- ============================================================================
-- QUESTS - Gamified tasks with rewards
-- ============================================================================
CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Quest content
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Classification
  context VARCHAR(50), -- Which venture/area
  quest_type VARCHAR(20) DEFAULT 'task' CHECK (quest_type IN (
    'task', 'daily', 'weekly', 'milestone', 'side', 'challenge'
  )),
  
  -- Rewards
  points_reward INTEGER DEFAULT 10,
  domain VARCHAR(50) CHECK (domain IN (
    'command', 'capital', 'influence', 'reliability', 'growth'
  )),
  bonus_multiplier DECIMAL(3,2) DEFAULT 1.0, -- For streak bonuses
  
  -- Timing
  due_date TIMESTAMPTZ,
  available_from TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- For daily/weekly quests
  
  -- Status
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN (
    'available', 'in_progress', 'completed', 'failed', 'expired', 'locked'
  )),
  completed_at TIMESTAMPTZ,
  
  -- Dependencies
  prerequisite_quest_id UUID REFERENCES quests(id),
  
  -- External sync
  clickup_task_id TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ACHIEVEMENTS - Unlockable badges/milestones
-- ============================================================================
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Achievement info
  achievement_key VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Classification
  category VARCHAR(50) CHECK (category IN (
    'streak', 'completion', 'domain', 'special', 'social'
  )),
  rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN (
    'common', 'uncommon', 'rare', 'epic', 'legendary'
  )),
  
  -- Visual
  icon VARCHAR(50),
  color VARCHAR(7),
  
  -- Progress (for progressive achievements)
  progress INTEGER DEFAULT 0,
  target INTEGER DEFAULT 1,
  
  -- Unlock status
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_key)
);

-- ============================================================================
-- QUEST COMPLETIONS - History of completed quests
-- ============================================================================
CREATE TABLE IF NOT EXISTS quest_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  
  -- Completion details
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  points_earned INTEGER NOT NULL,
  bonus_earned INTEGER DEFAULT 0,
  time_spent_minutes INTEGER,
  
  -- Streak info at time of completion
  streak_day INTEGER,
  streak_multiplier DECIMAL(3,2) DEFAULT 1.0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CALENDAR SYNC CONFIG - User's calendar integration settings
-- ============================================================================
CREATE TABLE IF NOT EXISTS calendar_sync_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Google Calendar
  google_calendar_enabled BOOLEAN DEFAULT FALSE,
  google_calendar_id TEXT, -- Primary calendar to sync to
  google_access_token_enc TEXT,
  google_refresh_token_enc TEXT,
  google_token_expires_at TIMESTAMPTZ,
  
  -- Sync preferences
  sync_focus_blocks BOOLEAN DEFAULT TRUE,
  sync_shifts BOOLEAN DEFAULT TRUE,
  sync_quests BOOLEAN DEFAULT FALSE,
  
  -- Default colors per context
  context_colors JSONB DEFAULT '{
    "nova": "#3B82F6",
    "janna": "#10B981",
    "obx": "#8B5CF6",
    "silk": "#F59E0B",
    "atw": "#EF4444",
    "house": "#F59E0B",
    "maison": "#6B7280",
    "personal": "#EC4899",
    "admin": "#6B7280",
    "training": "#EF4444"
  }',
  
  last_sync_at TIMESTAMPTZ,
  sync_errors JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_focus_blocks_user ON focus_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_blocks_start ON focus_blocks(start_time);
CREATE INDEX IF NOT EXISTS idx_focus_blocks_context ON focus_blocks(context);
CREATE INDEX IF NOT EXISTS idx_focus_blocks_google ON focus_blocks(google_event_id) WHERE google_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_employee_shifts_employee ON employee_shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_start ON employee_shifts(start_time);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_status ON employee_shifts(status);

CREATE INDEX IF NOT EXISTS idx_standing_user ON standing_points(user_id);
CREATE INDEX IF NOT EXISTS idx_standing_domain ON standing_points(domain);

CREATE INDEX IF NOT EXISTS idx_quests_user ON quests(user_id);
CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(status);
CREATE INDEX IF NOT EXISTS idx_quests_type ON quests(quest_type);
CREATE INDEX IF NOT EXISTS idx_quests_due ON quests(due_date);
CREATE INDEX IF NOT EXISTS idx_quests_clickup ON quests(clickup_task_id) WHERE clickup_task_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_key ON achievements(achievement_key);

CREATE INDEX IF NOT EXISTS idx_quest_completions_user ON quest_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_quest_completions_quest ON quest_completions(quest_id);
CREATE INDEX IF NOT EXISTS idx_quest_completions_date ON quest_completions(completed_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE focus_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE standing_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can manage own focus blocks" ON focus_blocks;
CREATE POLICY "Users can manage own focus blocks" ON focus_blocks 
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own shifts" ON employee_shifts;
CREATE POLICY "Users can manage own shifts" ON employee_shifts 
  FOR ALL USING (auth.uid() = employee_id);

DROP POLICY IF EXISTS "Users can manage own standing" ON standing_points;
CREATE POLICY "Users can manage own standing" ON standing_points 
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own quests" ON quests;
CREATE POLICY "Users can manage own quests" ON quests 
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own achievements" ON achievements;
CREATE POLICY "Users can manage own achievements" ON achievements 
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own completions" ON quest_completions;
CREATE POLICY "Users can view own completions" ON quest_completions 
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own calendar config" ON calendar_sync_config;
CREATE POLICY "Users can manage own calendar config" ON calendar_sync_config 
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
DROP TRIGGER IF EXISTS update_focus_blocks_updated_at ON focus_blocks;
CREATE TRIGGER update_focus_blocks_updated_at
  BEFORE UPDATE ON focus_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employee_shifts_updated_at ON employee_shifts;
CREATE TRIGGER update_employee_shifts_updated_at
  BEFORE UPDATE ON employee_shifts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_standing_points_updated_at ON standing_points;
CREATE TRIGGER update_standing_points_updated_at
  BEFORE UPDATE ON standing_points
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quests_updated_at ON quests;
CREATE TRIGGER update_quests_updated_at
  BEFORE UPDATE ON quests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_sync_updated_at ON calendar_sync_config;
CREATE TRIGGER update_calendar_sync_updated_at
  BEFORE UPDATE ON calendar_sync_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STANDING LEVEL CALCULATION FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_standing_level(total_points INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Level thresholds: 0, 100, 500, 1500, 5000
  IF total_points >= 5000 THEN RETURN 5;
  ELSIF total_points >= 1500 THEN RETURN 4;
  ELSIF total_points >= 500 THEN RETURN 3;
  ELSIF total_points >= 100 THEN RETURN 2;
  ELSE RETURN 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DEFAULT ACHIEVEMENTS
-- ============================================================================
-- Note: These are achievement definitions, not user unlocks
-- In practice, you'd have a separate achievement_definitions table
-- For now, these serve as documentation of available achievements

/*
Achievement Keys:
- first_quest: Complete first quest
- week_warrior: 7-day streak
- month_focus: 30-day streak
- century: 100-day streak
- domain_command: Reach max level in Command
- domain_capital: Reach max level in Capital
- domain_influence: Reach max level in Influence
- domain_reliability: Reach max level in Reliability
- domain_growth: Reach max level in Growth
- renaissance: High standing in all domains
- early_bird: Complete a quest before 7 AM
- night_owl: Complete a quest after 10 PM
- marathon: Complete 10 quests in one day
- perfectionist: Complete all daily quests for a week
*/
