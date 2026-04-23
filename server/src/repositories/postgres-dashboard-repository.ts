import { getPostgresPool } from "../db/postgres.js";
import type { ConnectionStatus, PlatformSlug } from "../types/dashboard.js";
import type {
  DashboardStore,
  PersistedAccount,
  PersistedAccountConnection,
  PersistedActivityEvent,
  PersistedCaseStudy,
  PersistedMetricSnapshot,
  PersistedPlatform,
  PersistedSyncJob,
} from "../types/store.js";

type SyncPlatform = Extract<PlatformSlug, "youtube" | "tiktok">;

interface PlatformRow {
  id: string;
  slug: PersistedPlatform["slug"];
  name: string;
  color: string;
}

interface AccountRow {
  id: string;
  platform_slug: PersistedPlatform["slug"];
  display_name: string;
  handle: string;
  status: ConnectionStatus;
  is_active: boolean;
  featured: boolean;
  coverage_note: string | null;
  warning_note: string | null;
}

interface SnapshotRow {
  id: string;
  account_id: string;
  captured_at: Date | string;
  total_views: string | number;
  source: PersistedMetricSnapshot["source"];
}

interface ConnectionRow {
  id: string;
  account_id: string;
  platform_slug: PersistedPlatform["slug"];
  provider_account_id: string;
  access_token: string;
  refresh_token: string | null;
  scopes: string[];
  expires_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  raw_profile_json: Record<string, unknown> | null;
}

interface EventRow {
  id: string;
  platform_slug: PersistedPlatform["slug"];
  text: string;
  created_at: Date | string;
}

interface CaseRow {
  id: string;
  platform_slug: PersistedPlatform["slug"];
  title: string;
  before_value: string | number;
  after_value: string | number;
  growth: string | number;
  strategy: string;
  thumbnail_url: string | null;
  chart_data: number[];
  status: PersistedCaseStudy["status"];
}

interface SyncJobRow {
  id: string;
  platform_slug: SyncPlatform;
  trigger_type: PersistedSyncJob["trigger"];
  scope_type: PersistedSyncJob["scope"];
  connection_id: string | null;
  account_id: string | null;
  status: PersistedSyncJob["status"];
  total_connections: number;
  success_count: number;
  failed_count: number;
  started_at: Date | string;
  finished_at: Date | string;
  message: string | null;
  error_message: string | null;
  details_json: Record<string, unknown> | null;
}

function asIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function parseNumber(value: string | number) {
  return typeof value === "number" ? value : Number(value);
}

function mapPlatform(row: PlatformRow): PersistedPlatform {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    color: row.color,
  };
}

function mapAccount(row: AccountRow): PersistedAccount {
  return {
    id: row.id,
    platformSlug: row.platform_slug,
    displayName: row.display_name,
    handle: row.handle,
    status: row.status,
    isActive: row.is_active,
    featured: row.featured,
    coverageNote: row.coverage_note ?? undefined,
    warningNote: row.warning_note ?? undefined,
  };
}

function mapSnapshot(row: SnapshotRow): PersistedMetricSnapshot {
  return {
    id: row.id,
    accountId: row.account_id,
    capturedAt: asIsoString(row.captured_at),
    totalViews: parseNumber(row.total_views),
    source: row.source,
  };
}

function mapConnection(row: ConnectionRow): PersistedAccountConnection {
  return {
    id: row.id,
    accountId: row.account_id,
    platformSlug: row.platform_slug,
    providerAccountId: row.provider_account_id,
    accessToken: row.access_token,
    refreshToken: row.refresh_token ?? undefined,
    scopes: row.scopes,
    expiresAt: row.expires_at ? asIsoString(row.expires_at) : undefined,
    createdAt: asIsoString(row.created_at),
    updatedAt: asIsoString(row.updated_at),
    rawProfile: row.raw_profile_json ?? undefined,
  };
}

function mapEvent(row: EventRow): PersistedActivityEvent {
  return {
    id: row.id,
    platformSlug: row.platform_slug,
    text: row.text,
    createdAt: asIsoString(row.created_at),
  };
}

function mapCase(row: CaseRow): PersistedCaseStudy {
  return {
    id: row.id,
    platformSlug: row.platform_slug,
    title: row.title,
    before: parseNumber(row.before_value),
    after: parseNumber(row.after_value),
    growth: parseNumber(row.growth),
    strategy: row.strategy,
    thumbnail: row.thumbnail_url ?? undefined,
    chartData: row.chart_data,
    status: row.status,
  };
}

function mapSyncJob(row: SyncJobRow): PersistedSyncJob {
  return {
    id: row.id,
    platformSlug: row.platform_slug,
    trigger: row.trigger_type,
    scope: row.scope_type,
    connectionId: row.connection_id ?? undefined,
    accountId: row.account_id ?? undefined,
    status: row.status,
    totalConnections: row.total_connections,
    successCount: row.success_count,
    failedCount: row.failed_count,
    startedAt: asIsoString(row.started_at),
    finishedAt: asIsoString(row.finished_at),
    message: row.message ?? undefined,
    error: row.error_message ?? undefined,
    details: row.details_json ?? undefined,
  };
}

function buildConnectedCoverageNote(platformSlug: SyncPlatform) {
  return platformSlug === "youtube"
    ? "Conta conectada por OAuth oficial do YouTube"
    : "Conta conectada por OAuth oficial do TikTok";
}

function buildSyncCoverageNote(platformSlug: SyncPlatform) {
  return platformSlug === "youtube"
    ? "Views sincronizadas pelo scheduler do YouTube"
    : "Views sincronizadas pelo scheduler do TikTok";
}

function buildConnectEventText(platformSlug: SyncPlatform, displayName: string) {
  return platformSlug === "youtube"
    ? `${displayName} conectado via YouTube OAuth`
    : `${displayName} conectado via TikTok OAuth`;
}

function buildSyncEventText(platformSlug: SyncPlatform, displayName: string) {
  return platformSlug === "youtube"
    ? `${displayName} sincronizado automaticamente no YouTube`
    : `${displayName} sincronizado automaticamente no TikTok`;
}

export async function loadDashboardStore(): Promise<DashboardStore> {
  const pool = getPostgresPool();

  const [
    platformsResult,
    accountsResult,
    connectionsResult,
    snapshotsResult,
    eventsResult,
    casesResult,
    syncJobsResult,
  ] = await Promise.all([
    pool.query<PlatformRow>(`
      SELECT id, slug, name, color
      FROM platforms
      ORDER BY name ASC
    `),
    pool.query<AccountRow>(`
      SELECT
        a.id,
        p.slug AS platform_slug,
        a.display_name,
        a.handle,
        a.status,
        a.is_active,
        a.featured,
        a.coverage_note,
        a.warning_note
      FROM accounts a
      JOIN platforms p ON p.id = a.platform_id
      ORDER BY a.display_name ASC
    `),
    pool.query<ConnectionRow>(`
      SELECT
        ac.id,
        ac.account_id,
        p.slug AS platform_slug,
        ac.provider_account_id,
        ac.access_token,
        ac.refresh_token,
        ac.scopes,
        ac.expires_at,
        ac.created_at,
        ac.updated_at,
        ac.raw_profile_json
      FROM account_connections ac
      JOIN platforms p ON p.id = ac.platform_id
      ORDER BY ac.updated_at DESC
    `),
    pool.query<SnapshotRow>(`
      SELECT id, account_id, captured_at, total_views, source
      FROM metric_snapshots
      ORDER BY captured_at ASC, id ASC
    `),
    pool.query<EventRow>(`
      SELECT
        ae.id,
        p.slug AS platform_slug,
        ae.text,
        ae.created_at
      FROM activity_events ae
      JOIN platforms p ON p.id = ae.platform_id
      ORDER BY ae.created_at DESC
    `),
    pool.query<CaseRow>(`
      SELECT
        cs.id,
        p.slug AS platform_slug,
        cs.title,
        cs.before_value,
        cs.after_value,
        cs.growth,
        cs.strategy,
        cs.thumbnail_url,
        cs.chart_data,
        cs.status
      FROM case_studies cs
      JOIN platforms p ON p.id = cs.platform_id
      ORDER BY cs.title ASC
    `),
    pool.query<SyncJobRow>(`
      SELECT
        sj.id,
        p.slug AS platform_slug,
        sj.trigger_type,
        sj.scope_type,
        sj.connection_id,
        sj.account_id,
        sj.status,
        sj.total_connections,
        sj.success_count,
        sj.failed_count,
        sj.started_at,
        sj.finished_at,
        sj.message,
        sj.error_message,
        sj.details_json
      FROM sync_jobs sj
      JOIN platforms p ON p.id = sj.platform_id
      ORDER BY sj.started_at DESC
      LIMIT 200
    `),
  ]);

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    platforms: platformsResult.rows.map(mapPlatform),
    accounts: accountsResult.rows.map(mapAccount),
    connections: connectionsResult.rows.map(mapConnection),
    snapshots: snapshotsResult.rows.map(mapSnapshot),
    events: eventsResult.rows.map(mapEvent),
    cases: casesResult.rows.map(mapCase),
    syncJobs: syncJobsResult.rows.map(mapSyncJob),
  };
}

export async function appendManualSnapshot(params: {
  accountId: string;
  totalViews: number;
  capturedAt?: string;
}) {
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const accountResult = await client.query<{ id: string }>(
      `SELECT id FROM accounts WHERE id = $1`,
      [params.accountId],
    );

    if (accountResult.rowCount === 0) {
      throw new Error(`Conta nao encontrada: ${params.accountId}`);
    }

    const capturedAt = params.capturedAt ?? new Date().toISOString();

    await client.query(
      `
        INSERT INTO metric_snapshots (
          id,
          account_id,
          captured_at,
          total_views,
          source
        ) VALUES ($1, $2, $3, $4, $5)
      `,
      [`${params.accountId}-manual-${Date.now()}`, params.accountId, capturedAt, params.totalViews, "manual"],
    );

    await client.query(
      `
        UPDATE accounts
        SET
          status = 'manual_mode',
          coverage_note = COALESCE(coverage_note, 'Snapshot manual registrado no painel admin'),
          updated_at = NOW()
        WHERE id = $1
      `,
      [params.accountId],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return loadDashboardStore();
}

export async function updateAccountStatus(params: {
  accountId: string;
  status: ConnectionStatus;
  coverageNote?: string;
}) {
  const pool = getPostgresPool();
  const result = await pool.query(
    `
      UPDATE accounts
      SET
        status = $2,
        coverage_note = COALESCE($3, coverage_note),
        updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `,
    [params.accountId, params.status, params.coverageNote ?? null],
  );

  if (result.rowCount === 0) {
    throw new Error(`Conta nao encontrada: ${params.accountId}`);
  }

  return loadDashboardStore();
}

async function upsertPlatformConnection(params: {
  platformSlug: SyncPlatform;
  providerAccountId: string;
  displayName: string;
  handle: string;
  totalViews: number;
  accessToken: string;
  refreshToken?: string;
  scopes: string[];
  expiresAt?: string;
  rawProfile?: Record<string, unknown>;
}) {
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const platformResult = await client.query<{ id: string }>(
      `SELECT id FROM platforms WHERE slug = $1 LIMIT 1`,
      [params.platformSlug],
    );

    if (platformResult.rowCount === 0) {
      throw new Error(`Platform ${params.platformSlug} nao encontrada em platforms`);
    }

    const platformId = platformResult.rows[0].id;
    const platformPrefix = params.platformSlug === "youtube" ? "yt" : "tt";
    const accountId = `acc-${platformPrefix}-${params.providerAccountId}`;
    const now = new Date().toISOString();

    await client.query(
      `
        INSERT INTO accounts (
          id,
          platform_id,
          display_name,
          handle,
          status,
          is_active,
          featured,
          coverage_note
        ) VALUES ($1, $2, $3, $4, 'connected', TRUE, TRUE, $5)
        ON CONFLICT (id) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          handle = EXCLUDED.handle,
          status = 'connected',
          is_active = TRUE,
          featured = TRUE,
          coverage_note = EXCLUDED.coverage_note,
          warning_note = NULL,
          updated_at = NOW()
      `,
      [accountId, platformId, params.displayName, params.handle, buildConnectedCoverageNote(params.platformSlug)],
    );

    await client.query(
      `
        INSERT INTO account_connections (
          id,
          account_id,
          platform_id,
          provider_account_id,
          access_token,
          refresh_token,
          scopes,
          expires_at,
          raw_profile_json
        ) VALUES ($1, $2, $3, $4, $5, $6, $7::text[], $8, $9::jsonb)
        ON CONFLICT (id) DO UPDATE SET
          access_token = EXCLUDED.access_token,
          refresh_token = COALESCE(EXCLUDED.refresh_token, account_connections.refresh_token),
          scopes = EXCLUDED.scopes,
          expires_at = EXCLUDED.expires_at,
          raw_profile_json = EXCLUDED.raw_profile_json,
          updated_at = NOW()
      `,
      [
        `conn-${platformPrefix}-${params.providerAccountId}`,
        accountId,
        platformId,
        params.providerAccountId,
        params.accessToken,
        params.refreshToken ?? null,
        params.scopes,
        params.expiresAt ?? null,
        JSON.stringify(params.rawProfile ?? {}),
      ],
    );

    await client.query(
      `
        INSERT INTO metric_snapshots (
          id,
          account_id,
          captured_at,
          total_views,
          source
        ) VALUES ($1, $2, $3, $4, 'api')
      `,
      [`${accountId}-oauth-${Date.now()}`, accountId, now, params.totalViews],
    );

    await client.query(
      `
        INSERT INTO activity_events (
          id,
          platform_id,
          text,
          created_at
        ) VALUES ($1, $2, $3, $4)
      `,
      [`evt-${platformPrefix}-connect-${Date.now()}`, platformId, buildConnectEventText(params.platformSlug, params.displayName), now],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return loadDashboardStore();
}

export async function upsertYouTubeConnection(params: {
  providerAccountId: string;
  displayName: string;
  handle: string;
  totalViews: number;
  accessToken: string;
  refreshToken?: string;
  scopes: string[];
  expiresAt?: string;
  rawProfile?: Record<string, unknown>;
}) {
  return upsertPlatformConnection({
    ...params,
    platformSlug: "youtube",
  });
}

export async function upsertTikTokConnection(params: {
  providerAccountId: string;
  displayName: string;
  handle: string;
  totalViews: number;
  accessToken: string;
  refreshToken?: string;
  scopes: string[];
  expiresAt?: string;
  rawProfile?: Record<string, unknown>;
}) {
  return upsertPlatformConnection({
    ...params,
    platformSlug: "tiktok",
  });
}

async function listPlatformConnections(platformSlug: SyncPlatform) {
  const pool = getPostgresPool();
  const result = await pool.query<ConnectionRow>(
    `
      SELECT
        ac.id,
        ac.account_id,
        p.slug AS platform_slug,
        ac.provider_account_id,
        ac.access_token,
        ac.refresh_token,
        ac.scopes,
        ac.expires_at,
        ac.created_at,
        ac.updated_at,
        ac.raw_profile_json
      FROM account_connections ac
      JOIN platforms p ON p.id = ac.platform_id
      WHERE p.slug = $1
      ORDER BY ac.updated_at DESC
    `,
    [platformSlug],
  );

  return result.rows.map(mapConnection);
}

export async function listYouTubeConnections() {
  return listPlatformConnections("youtube");
}

export async function listTikTokConnections() {
  return listPlatformConnections("tiktok");
}

async function persistPlatformSyncResult(params: {
  platformSlug: SyncPlatform;
  connectionId: string;
  totalViews: number;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  rawProfile?: Record<string, unknown>;
}) {
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const connectionResult = await client.query<{
      account_id: string;
      platform_id: string;
      display_name: string;
    }>(
      `
        SELECT
          ac.account_id,
          ac.platform_id,
          a.display_name
        FROM account_connections ac
        JOIN accounts a ON a.id = ac.account_id
        JOIN platforms p ON p.id = ac.platform_id
        WHERE ac.id = $1 AND p.slug = $2
      `,
      [params.connectionId, params.platformSlug],
    );

    if (connectionResult.rowCount === 0) {
      throw new Error(`Conexao ${params.platformSlug} nao encontrada: ${params.connectionId}`);
    }

    const connection = connectionResult.rows[0];
    const now = new Date().toISOString();
    const platformPrefix = params.platformSlug === "youtube" ? "yt" : "tt";

    await client.query(
      `
        UPDATE account_connections
        SET
          access_token = COALESCE($2, access_token),
          refresh_token = COALESCE($3, refresh_token),
          expires_at = COALESCE($4, expires_at),
          raw_profile_json = COALESCE($5::jsonb, raw_profile_json),
          updated_at = NOW()
        WHERE id = $1
      `,
      [
        params.connectionId,
        params.accessToken ?? null,
        params.refreshToken ?? null,
        params.expiresAt ?? null,
        params.rawProfile ? JSON.stringify(params.rawProfile) : null,
      ],
    );

    await client.query(
      `
        UPDATE accounts
        SET
          status = 'connected',
          is_active = TRUE,
          coverage_note = $2,
          warning_note = NULL,
          updated_at = NOW()
        WHERE id = $1
      `,
      [connection.account_id, buildSyncCoverageNote(params.platformSlug)],
    );

    await client.query(
      `
        INSERT INTO metric_snapshots (
          id,
          account_id,
          captured_at,
          total_views,
          source
        ) VALUES ($1, $2, $3, $4, 'api')
      `,
      [`${connection.account_id}-sync-${Date.now()}`, connection.account_id, now, params.totalViews],
    );

    await client.query(
      `
        INSERT INTO activity_events (
          id,
          platform_id,
          text,
          created_at
        ) VALUES ($1, $2, $3, $4)
      `,
      [`evt-${platformPrefix}-sync-${Date.now()}`, connection.platform_id, buildSyncEventText(params.platformSlug, connection.display_name), now],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return loadDashboardStore();
}

export async function persistYouTubeSyncResult(params: {
  connectionId: string;
  totalViews: number;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  rawProfile?: Record<string, unknown>;
}) {
  return persistPlatformSyncResult({
    ...params,
    platformSlug: "youtube",
  });
}

export async function persistTikTokSyncResult(params: {
  connectionId: string;
  totalViews: number;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  rawProfile?: Record<string, unknown>;
}) {
  return persistPlatformSyncResult({
    ...params,
    platformSlug: "tiktok",
  });
}

export async function recordSyncJob(job: PersistedSyncJob) {
  const pool = getPostgresPool();

  await pool.query(
    `
      INSERT INTO sync_jobs (
        id,
        platform_id,
        trigger_type,
        scope_type,
        connection_id,
        account_id,
        status,
        total_connections,
        success_count,
        failed_count,
        started_at,
        finished_at,
        message,
        error_message,
        details_json
      )
      SELECT
        $1,
        p.id,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14::jsonb
      FROM platforms p
      WHERE p.slug = $15
    `,
    [
      job.id,
      job.trigger,
      job.scope,
      job.connectionId ?? null,
      job.accountId ?? null,
      job.status,
      job.totalConnections,
      job.successCount,
      job.failedCount,
      job.startedAt,
      job.finishedAt,
      job.message ?? null,
      job.error ?? null,
      JSON.stringify(job.details ?? {}),
      job.platformSlug,
    ],
  );

  return job;
}

export async function listSyncJobs(params?: {
  platformSlug?: SyncPlatform;
  limit?: number;
}) {
  const pool = getPostgresPool();
  const limit = params?.limit ?? 50;

  const result = params?.platformSlug
    ? await pool.query<SyncJobRow>(
        `
          SELECT
            sj.id,
            p.slug AS platform_slug,
            sj.trigger_type,
            sj.scope_type,
            sj.connection_id,
            sj.account_id,
            sj.status,
            sj.total_connections,
            sj.success_count,
            sj.failed_count,
            sj.started_at,
            sj.finished_at,
            sj.message,
            sj.error_message,
            sj.details_json
          FROM sync_jobs sj
          JOIN platforms p ON p.id = sj.platform_id
          WHERE p.slug = $1
          ORDER BY sj.started_at DESC
          LIMIT $2
        `,
        [params.platformSlug, limit],
      )
    : await pool.query<SyncJobRow>(
        `
          SELECT
            sj.id,
            p.slug AS platform_slug,
            sj.trigger_type,
            sj.scope_type,
            sj.connection_id,
            sj.account_id,
            sj.status,
            sj.total_connections,
            sj.success_count,
            sj.failed_count,
            sj.started_at,
            sj.finished_at,
            sj.message,
            sj.error_message,
            sj.details_json
          FROM sync_jobs sj
          JOIN platforms p ON p.id = sj.platform_id
          ORDER BY sj.started_at DESC
          LIMIT $1
        `,
        [limit],
      );

  return result.rows.map(mapSyncJob);
}
