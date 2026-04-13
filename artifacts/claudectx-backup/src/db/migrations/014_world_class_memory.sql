-- Add "World-Class Memory" fields

-- 1. Seamless Handoff
ALTER TABLE sessions ADD COLUMN next_session_starting_point TEXT;
ALTER TABLE sessions ADD COLUMN open_rabbit_holes TEXT;
ALTER TABLE sessions ADD COLUMN environmental_dependencies TEXT;

-- 2. AI Persona & Collaboration Adaptation
ALTER TABLE sessions ADD COLUMN preferred_verbosity INTEGER DEFAULT 50;
ALTER TABLE sessions ADD COLUMN collaboration_style TEXT;
ALTER TABLE sessions ADD COLUMN cognitive_load_estimate INTEGER DEFAULT 50;

-- 3. Tech Lead (Code Health & Safety)
ALTER TABLE sessions ADD COLUMN unresolved_tech_debt TEXT;
ALTER TABLE sessions ADD COLUMN testing_coverage_gap TEXT;
ALTER TABLE sessions ADD COLUMN architectural_drift TEXT;

-- 4. Advanced Gamification & Behavioral Insights
ALTER TABLE sessions ADD COLUMN aha_moments_count INTEGER DEFAULT 0;
ALTER TABLE sessions ADD COLUMN flow_state_duration_mins INTEGER DEFAULT 0;
ALTER TABLE sessions ADD COLUMN divergence_score INTEGER DEFAULT 0;
