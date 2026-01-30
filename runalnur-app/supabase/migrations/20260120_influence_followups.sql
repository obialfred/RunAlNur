-- Influence Follow-ups (Relationship ops)
-- Migration: 2026-01-20
-- Description: Track follow-ups due for contacts (drives Influence alerts + COO inputs)

-- ============================================================================
-- Influence Follow-ups
-- ============================================================================
CREATE TABLE IF NOT EXISTS influence_followups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  due_at DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'cancelled')),
  note TEXT,
  source VARCHAR(50) DEFAULT 'manual', -- manual | ai | interaction
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_influence_followups_user_due ON influence_followups(user_id, due_at);
CREATE INDEX IF NOT EXISTS idx_influence_followups_contact ON influence_followups(contact_id);
CREATE INDEX IF NOT EXISTS idx_influence_followups_status ON influence_followups(status);

ALTER TABLE influence_followups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own influence followups" ON influence_followups;
CREATE POLICY "Users can manage own influence followups" ON influence_followups
  FOR ALL USING (auth.uid() = user_id);

-- updated_at trigger
DROP TRIGGER IF EXISTS update_influence_followups_updated_at ON influence_followups;
CREATE TRIGGER update_influence_followups_updated_at
  BEFORE UPDATE ON influence_followups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

