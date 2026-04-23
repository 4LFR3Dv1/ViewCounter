import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSeedDashboardStore } from "../data/seed-dashboard-store.js";
import { loadDashboardStore } from "../repositories/dashboard-store-repository.js";
import type { DashboardStore } from "../types/store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.resolve(__dirname, "../../data/dashboard-seed.sql");

function quote(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return "NULL";
  }

  return `'${value.replace(/'/g, "''")}'`;
}

function quoteBoolean(value: boolean) {
  return value ? "TRUE" : "FALSE";
}

function quoteJson(value: unknown) {
  return `${quote(JSON.stringify(value))}::jsonb`;
}

function quoteEnum(value: string) {
  return quote(value);
}

function buildPlatformInserts(store: DashboardStore) {
  return store.platforms.map(
    (platform) => `INSERT INTO platforms (id, slug, name, color)
VALUES (${quote(platform.id)}, ${quoteEnum(platform.slug)}, ${quote(platform.name)}, ${quote(platform.color)})
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  color = EXCLUDED.color,
  updated_at = NOW();`,
  );
}

function buildAccountInserts(store: DashboardStore) {
  return store.accounts.map((account) => {
    const platform = store.platforms.find((item) => item.slug === account.platformSlug);

    if (!platform) {
      throw new Error(`Platform nao encontrada para account ${account.id}`);
    }

    return `INSERT INTO accounts (
  id,
  platform_id,
  display_name,
  handle,
  status,
  is_active,
  featured,
  coverage_note,
  warning_note
) VALUES (
  ${quote(account.id)},
  ${quote(platform.id)},
  ${quote(account.displayName)},
  ${quote(account.handle)},
  ${quoteEnum(account.status)},
  ${quoteBoolean(account.isActive)},
  ${quoteBoolean(account.featured)},
  ${quote(account.coverageNote)},
  ${quote(account.warningNote)}
)
ON CONFLICT (id) DO UPDATE SET
  platform_id = EXCLUDED.platform_id,
  display_name = EXCLUDED.display_name,
  handle = EXCLUDED.handle,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  featured = EXCLUDED.featured,
  coverage_note = EXCLUDED.coverage_note,
  warning_note = EXCLUDED.warning_note,
  updated_at = NOW();`;
  });
}

function buildSnapshotInserts(store: DashboardStore) {
  return store.snapshots.map(
    (snapshot) => `INSERT INTO metric_snapshots (
  id,
  account_id,
  captured_at,
  total_views,
  source
) VALUES (
  ${quote(snapshot.id)},
  ${quote(snapshot.accountId)},
  ${quote(snapshot.capturedAt)}::timestamptz,
  ${snapshot.totalViews},
  ${quoteEnum(snapshot.source)}
)
ON CONFLICT (id) DO UPDATE SET
  account_id = EXCLUDED.account_id,
  captured_at = EXCLUDED.captured_at,
  total_views = EXCLUDED.total_views,
  source = EXCLUDED.source;`,
  );
}

function buildConnectionInserts(store: DashboardStore) {
  return store.connections.map((connection) => {
    const platform = store.platforms.find((item) => item.slug === connection.platformSlug);

    if (!platform) {
      throw new Error(`Platform nao encontrada para connection ${connection.id}`);
    }

    return `INSERT INTO account_connections (
  id,
  account_id,
  platform_id,
  provider_account_id,
  access_token,
  refresh_token,
  scopes,
  expires_at,
  raw_profile_json
) VALUES (
  ${quote(connection.id)},
  ${quote(connection.accountId)},
  ${quote(platform.id)},
  ${quote(connection.providerAccountId)},
  ${quote(connection.accessToken)},
  ${quote(connection.refreshToken)},
  ARRAY[${connection.scopes.map((scope) => quote(scope)).join(", ")}]::text[],
  ${connection.expiresAt ? `${quote(connection.expiresAt)}::timestamptz` : "NULL"},
  ${quoteJson(connection.rawProfile ?? {})}
)
ON CONFLICT (id) DO UPDATE SET
  account_id = EXCLUDED.account_id,
  platform_id = EXCLUDED.platform_id,
  provider_account_id = EXCLUDED.provider_account_id,
  access_token = EXCLUDED.access_token,
  refresh_token = EXCLUDED.refresh_token,
  scopes = EXCLUDED.scopes,
  expires_at = EXCLUDED.expires_at,
  raw_profile_json = EXCLUDED.raw_profile_json,
  updated_at = NOW();`;
  });
}

function buildEventInserts(store: DashboardStore) {
  return store.events.map((event) => {
    const platform = store.platforms.find((item) => item.slug === event.platformSlug);

    if (!platform) {
      throw new Error(`Platform nao encontrada para event ${event.id}`);
    }

    return `INSERT INTO activity_events (
  id,
  platform_id,
  text,
  created_at
) VALUES (
  ${quote(event.id)},
  ${quote(platform.id)},
  ${quote(event.text)},
  ${quote(event.createdAt)}::timestamptz
)
ON CONFLICT (id) DO UPDATE SET
  platform_id = EXCLUDED.platform_id,
  text = EXCLUDED.text,
  created_at = EXCLUDED.created_at;`;
  });
}

function buildSyncJobInserts(store: DashboardStore) {
  return store.syncJobs.map((job) => {
    const platform = store.platforms.find((item) => item.slug === job.platformSlug);

    if (!platform) {
      throw new Error(`Platform nao encontrada para sync job ${job.id}`);
    }

    return `INSERT INTO sync_jobs (
  id,
  platform_id,
  connection_id,
  account_id,
  trigger_type,
  scope_type,
  status,
  total_connections,
  success_count,
  failed_count,
  started_at,
  finished_at,
  message,
  error_message,
  details_json
) VALUES (
  ${quote(job.id)},
  ${quote(platform.id)},
  ${quote(job.connectionId)},
  ${quote(job.accountId)},
  ${quoteEnum(job.trigger)},
  ${quoteEnum(job.scope)},
  ${quoteEnum(job.status)},
  ${job.totalConnections},
  ${job.successCount},
  ${job.failedCount},
  ${quote(job.startedAt)}::timestamptz,
  ${quote(job.finishedAt)}::timestamptz,
  ${quote(job.message)},
  ${quote(job.error)},
  ${quoteJson(job.details ?? {})}
)
ON CONFLICT (id) DO UPDATE SET
  platform_id = EXCLUDED.platform_id,
  connection_id = EXCLUDED.connection_id,
  account_id = EXCLUDED.account_id,
  trigger_type = EXCLUDED.trigger_type,
  scope_type = EXCLUDED.scope_type,
  status = EXCLUDED.status,
  total_connections = EXCLUDED.total_connections,
  success_count = EXCLUDED.success_count,
  failed_count = EXCLUDED.failed_count,
  started_at = EXCLUDED.started_at,
  finished_at = EXCLUDED.finished_at,
  message = EXCLUDED.message,
  error_message = EXCLUDED.error_message,
  details_json = EXCLUDED.details_json;`;
  });
}

function buildCaseInserts(store: DashboardStore) {
  return store.cases.map((caseStudy) => {
    const platform = store.platforms.find((item) => item.slug === caseStudy.platformSlug);

    if (!platform) {
      throw new Error(`Platform nao encontrada para case ${caseStudy.id}`);
    }

    return `INSERT INTO case_studies (
  id,
  platform_id,
  title,
  before_value,
  after_value,
  growth,
  strategy,
  thumbnail_url,
  chart_data,
  status
) VALUES (
  ${quote(caseStudy.id)},
  ${quote(platform.id)},
  ${quote(caseStudy.title)},
  ${caseStudy.before},
  ${caseStudy.after},
  ${caseStudy.growth},
  ${quote(caseStudy.strategy)},
  ${quote(caseStudy.thumbnail)},
  ${quoteJson(caseStudy.chartData)},
  ${quoteEnum(caseStudy.status)}
)
ON CONFLICT (id) DO UPDATE SET
  platform_id = EXCLUDED.platform_id,
  title = EXCLUDED.title,
  before_value = EXCLUDED.before_value,
  after_value = EXCLUDED.after_value,
  growth = EXCLUDED.growth,
  strategy = EXCLUDED.strategy,
  thumbnail_url = EXCLUDED.thumbnail_url,
  chart_data = EXCLUDED.chart_data,
  status = EXCLUDED.status,
  updated_at = NOW();`;
  });
}

function buildSql(store: DashboardStore) {
  const statements = [
    "-- generated from server/data/dashboard-store.json",
    "BEGIN;",
    ...buildPlatformInserts(store),
    ...buildAccountInserts(store),
    ...buildConnectionInserts(store),
    ...buildSnapshotInserts(store),
    ...buildEventInserts(store),
    ...buildCaseInserts(store),
    ...buildSyncJobInserts(store),
    "COMMIT;",
    "",
  ];

  return statements.join("\n\n");
}

async function getStore() {
  try {
    return await loadDashboardStore();
  } catch {
    return createSeedDashboardStore();
  }
}

async function main() {
  const store = await getStore();
  const sql = buildSql(store);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, sql, "utf8");

  console.log(`Seed SQL gerado em ${outputPath}`);
  console.log(`Plataformas: ${store.platforms.length}`);
  console.log(`Contas: ${store.accounts.length}`);
  console.log(`Conexoes: ${store.connections.length}`);
  console.log(`Snapshots: ${store.snapshots.length}`);
  console.log(`Eventos: ${store.events.length}`);
  console.log(`Cases: ${store.cases.length}`);
  console.log(`Sync jobs: ${store.syncJobs.length}`);
}

void main();
