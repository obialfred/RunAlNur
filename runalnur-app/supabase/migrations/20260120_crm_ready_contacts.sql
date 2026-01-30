-- CRM-ready Contacts + Gemini integration provider
-- Migration: 2026-01-20
-- Description:
-- 1) Add contacts.external_refs for CRM-agnostic external IDs (HubSpot-first, Salesforce-capable)
-- 2) Extend user_integrations provider check to include 'gemini'

-- ============================================================================
-- Contacts: external_refs
-- ============================================================================
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS external_refs JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- User Integrations: include gemini provider
-- ============================================================================
DO $$
BEGIN
  -- Default constraint name when created inline is usually: user_integrations_provider_check
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_integrations_provider_check'
  ) THEN
    ALTER TABLE user_integrations DROP CONSTRAINT user_integrations_provider_check;
  END IF;
END $$;

ALTER TABLE user_integrations
  ADD CONSTRAINT user_integrations_provider_check
  CHECK (provider IN (
    'clickup', 'hubspot', 'process_street', 'guru',
    'openai', 'anthropic', 'gemini', 'webpush'
  ));

