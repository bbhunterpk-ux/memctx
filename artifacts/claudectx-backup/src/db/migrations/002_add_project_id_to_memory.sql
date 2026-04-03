-- Migration: Add project_id to memory tables
-- Date: 2026-04-03
-- Description: Make memory project-specific instead of global

-- Add project_id to preferences
ALTER TABLE preferences ADD COLUMN project_id TEXT REFERENCES projects(id);
CREATE INDEX IF NOT EXISTS idx_preferences_project ON preferences(project_id);

-- Add project_id to knowledge_items
ALTER TABLE knowledge_items ADD COLUMN project_id TEXT REFERENCES projects(id);
CREATE INDEX IF NOT EXISTS idx_knowledge_project ON knowledge_items(project_id);

-- Add project_id to learned_patterns
ALTER TABLE learned_patterns ADD COLUMN project_id TEXT REFERENCES projects(id);
CREATE INDEX IF NOT EXISTS idx_patterns_project ON learned_patterns(project_id);

-- Add project_id to contacts
ALTER TABLE contacts ADD COLUMN project_id TEXT REFERENCES projects(id);
CREATE INDEX IF NOT EXISTS idx_contacts_project ON contacts(project_id);

-- Update existing test data with project_id
UPDATE preferences SET project_id = 'c6d8edec13ba353f' WHERE project_id IS NULL;
UPDATE knowledge_items SET project_id = 'c6d8edec13ba353f' WHERE project_id IS NULL;
UPDATE learned_patterns SET project_id = 'c6d8edec13ba353f' WHERE project_id IS NULL;
UPDATE contacts SET project_id = 'c6d8edec13ba353f' WHERE project_id IS NULL;
