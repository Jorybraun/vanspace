CREATE TABLE IF NOT EXISTS talk_proposals (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 2 AND 100),
  email TEXT NOT NULL CHECK (length(email) BETWEEN 3 AND 254),
  email_normalized TEXT NOT NULL CHECK (length(email_normalized) BETWEEN 3 AND 254),
  city_region TEXT CHECK (city_region IS NULL OR length(city_region) <= 120),
  working_title TEXT NOT NULL CHECK (length(working_title) BETWEEN 5 AND 120),
  format_preference TEXT NOT NULL CHECK (
    format_preference IN ('talk-20', 'demo-20', 'feature-30', 'open')
  ),
  takeaway TEXT NOT NULL CHECK (length(takeaway) BETWEEN 20 AND 240),
  abstract TEXT NOT NULL CHECK (length(abstract) BETWEEN 80 AND 1800),
  grounding_evidence TEXT NOT NULL CHECK (length(grounding_evidence) BETWEEN 20 AND 1200),
  links_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(links_json)),
  recording_preference TEXT NOT NULL CHECK (
    recording_preference IN ('yes', 'discuss', 'no')
  ),
  conduct_accepted INTEGER NOT NULL CHECK (conduct_accepted = 1),
  privacy_consent INTEGER NOT NULL CHECK (privacy_consent = 1),
  content_hash TEXT NOT NULL CHECK (length(content_hash) = 64)
);

CREATE UNIQUE INDEX IF NOT EXISTS talk_proposals_content_hash_unique
  ON talk_proposals (content_hash);

CREATE INDEX IF NOT EXISTS talk_proposals_email_created_at
  ON talk_proposals (email_normalized, created_at);

CREATE INDEX IF NOT EXISTS talk_proposals_created_at
  ON talk_proposals (created_at);

CREATE TRIGGER IF NOT EXISTS talk_proposals_email_hourly_limit
BEFORE INSERT ON talk_proposals
WHEN (
  SELECT COUNT(*)
  FROM talk_proposals
  WHERE email_normalized = NEW.email_normalized
    AND unixepoch(created_at) >= unixepoch(NEW.created_at) - 3600
) >= 5
BEGIN
  SELECT RAISE(ABORT, 'talk_proposals_rate_limited');
END;
