-- Add rich memory metrics to sessions table
ALTER TABLE sessions ADD COLUMN metric_momentum INTEGER DEFAULT 50;
ALTER TABLE sessions ADD COLUMN metric_frustration INTEGER DEFAULT 0;
ALTER TABLE sessions ADD COLUMN metric_productivity INTEGER DEFAULT 50;
ALTER TABLE sessions ADD COLUMN learning_progression TEXT;
ALTER TABLE sessions ADD COLUMN emotional_context TEXT;
ALTER TABLE sessions ADD COLUMN code_quality_notes TEXT;
