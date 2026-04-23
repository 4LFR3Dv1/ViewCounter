DO $$
BEGIN
  CREATE TYPE platform_slug AS ENUM ('instagram', 'youtube', 'tiktok');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE connection_status AS ENUM (
    'connected',
    'syncing',
    'warning',
    'disconnected',
    'expired',
    'pending_auth',
    'pending_approval',
    'manual_mode'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE snapshot_source AS ENUM ('api', 'manual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE case_status AS ENUM ('live', 'stable', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE sync_trigger_type AS ENUM ('manual', 'scheduler');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE sync_scope_type AS ENUM ('all', 'connection');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE sync_job_status AS ENUM ('success', 'partial', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS platforms (
  id TEXT PRIMARY KEY,
  slug platform_slug NOT NULL UNIQUE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  platform_id TEXT NOT NULL REFERENCES platforms(id) ON DELETE RESTRICT,
  display_name TEXT NOT NULL,
  handle TEXT NOT NULL,
  status connection_status NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  coverage_note TEXT,
  warning_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (platform_id, handle)
);

CREATE TABLE IF NOT EXISTS account_connections (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  platform_id TEXT NOT NULL REFERENCES platforms(id) ON DELETE RESTRICT,
  provider_account_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  raw_profile_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (platform_id, provider_account_id),
  UNIQUE (account_id, platform_id)
);

CREATE TABLE IF NOT EXISTS metric_snapshots (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  captured_at TIMESTAMPTZ NOT NULL,
  total_views BIGINT NOT NULL CHECK (total_views >= 0),
  source snapshot_source NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_events (
  id TEXT PRIMARY KEY,
  platform_id TEXT NOT NULL REFERENCES platforms(id) ON DELETE RESTRICT,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS case_studies (
  id TEXT PRIMARY KEY,
  platform_id TEXT NOT NULL REFERENCES platforms(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  before_value BIGINT NOT NULL CHECK (before_value >= 0),
  after_value BIGINT NOT NULL CHECK (after_value >= 0),
  growth NUMERIC(10, 2) NOT NULL,
  strategy TEXT NOT NULL,
  thumbnail_url TEXT,
  chart_data JSONB NOT NULL,
  status case_status NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sync_jobs (
  id TEXT PRIMARY KEY,
  platform_id TEXT NOT NULL REFERENCES platforms(id) ON DELETE RESTRICT,
  connection_id TEXT REFERENCES account_connections(id) ON DELETE SET NULL,
  account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  trigger_type sync_trigger_type NOT NULL,
  scope_type sync_scope_type NOT NULL,
  status sync_job_status NOT NULL,
  total_connections INTEGER NOT NULL DEFAULT 0 CHECK (total_connections >= 0),
  success_count INTEGER NOT NULL DEFAULT 0 CHECK (success_count >= 0),
  failed_count INTEGER NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ NOT NULL,
  message TEXT,
  error_message TEXT,
  details_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_platform_id ON accounts(platform_id);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
CREATE INDEX IF NOT EXISTS idx_accounts_active_featured ON accounts(is_active, featured);

CREATE INDEX IF NOT EXISTS idx_account_connections_account_id ON account_connections(account_id);
CREATE INDEX IF NOT EXISTS idx_account_connections_platform_id ON account_connections(platform_id);

CREATE INDEX IF NOT EXISTS idx_metric_snapshots_account_id ON metric_snapshots(account_id);
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_account_captured_at ON metric_snapshots(account_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_captured_at ON metric_snapshots(captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_events_platform_id ON activity_events(platform_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_created_at ON activity_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_case_studies_platform_id ON case_studies(platform_id);
CREATE INDEX IF NOT EXISTS idx_case_studies_status ON case_studies(status);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_platform_id ON sync_jobs(platform_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_connection_id ON sync_jobs(connection_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_account_id ON sync_jobs(account_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_started_at ON sync_jobs(started_at DESC);

CREATE OR REPLACE VIEW v_latest_account_snapshots AS
SELECT DISTINCT ON (ms.account_id)
  ms.account_id,
  ms.id AS snapshot_id,
  ms.captured_at,
  ms.total_views,
  ms.source
FROM metric_snapshots ms
ORDER BY ms.account_id, ms.captured_at DESC, ms.id DESC;

CREATE OR REPLACE VIEW v_account_snapshot_deltas AS
WITH ranked AS (
  SELECT
    ms.account_id,
    ms.id AS snapshot_id,
    ms.captured_at,
    ms.total_views,
    LAG(ms.total_views) OVER (
      PARTITION BY ms.account_id
      ORDER BY ms.captured_at
    ) AS previous_total_views
  FROM metric_snapshots ms
)
SELECT
  account_id,
  snapshot_id,
  captured_at,
  total_views,
  previous_total_views,
  CASE
    WHEN previous_total_views IS NULL OR previous_total_views = 0 THEN 0
    ELSE ROUND((((total_views - previous_total_views)::NUMERIC / previous_total_views::NUMERIC) * 100), 1)
  END AS delta_percentage
FROM ranked;
