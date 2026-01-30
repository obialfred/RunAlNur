-- Contact socials
-- Migration: 2026-01-20
-- Description: Add contacts.socials JSONB for instagram/linkedin/etc.

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS socials JSONB DEFAULT '{}'::jsonb;

