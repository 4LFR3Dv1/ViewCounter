import type { ConnectionStatus } from "../types/dashboard";
import type { DashboardStore, PersistedSyncJob } from "../types/store";
import {
  appendManualSnapshot as appendJsonManualSnapshot,
  listSyncJobs as listJsonSyncJobs,
  listTikTokConnections as listJsonTikTokConnections,
  listYouTubeConnections as listJsonYouTubeConnections,
  loadDashboardStore as loadJsonDashboardStore,
  persistTikTokSyncResult as persistJsonTikTokSyncResult,
  persistYouTubeSyncResult as persistJsonYouTubeSyncResult,
  recordSyncJob as recordJsonSyncJob,
  updateAccountStatus as updateJsonAccountStatus,
  upsertTikTokConnection as upsertJsonTikTokConnection,
  upsertYouTubeConnection as upsertJsonYouTubeConnection,
} from "./dashboard-store-repository";
import {
  appendManualSnapshot as appendPostgresManualSnapshot,
  listSyncJobs as listPostgresSyncJobs,
  listTikTokConnections as listPostgresTikTokConnections,
  listYouTubeConnections as listPostgresYouTubeConnections,
  loadDashboardStore as loadPostgresDashboardStore,
  persistTikTokSyncResult as persistPostgresTikTokSyncResult,
  persistYouTubeSyncResult as persistPostgresYouTubeSyncResult,
  recordSyncJob as recordPostgresSyncJob,
  updateAccountStatus as updatePostgresAccountStatus,
  upsertTikTokConnection as upsertPostgresTikTokConnection,
  upsertYouTubeConnection as upsertPostgresYouTubeConnection,
} from "./postgres-dashboard-repository";

export type DataProvider = "json" | "postgres";

type SyncPlatform = "youtube" | "tiktok";

function getDataProvider(): DataProvider {
  const provider = (process.env.DATA_PROVIDER ?? "json").toLowerCase();
  return provider === "postgres" ? "postgres" : "json";
}

export function getActiveDataProvider(): DataProvider {
  return getDataProvider();
}

export async function loadDashboardStore(): Promise<DashboardStore> {
  return getDataProvider() === "postgres" ? loadPostgresDashboardStore() : loadJsonDashboardStore();
}

export async function appendManualSnapshot(params: {
  accountId: string;
  totalViews: number;
  capturedAt?: string;
}) {
  return getDataProvider() === "postgres"
    ? appendPostgresManualSnapshot(params)
    : appendJsonManualSnapshot(params);
}

export async function updateAccountStatus(params: {
  accountId: string;
  status: ConnectionStatus;
  coverageNote?: string;
}) {
  return getDataProvider() === "postgres"
    ? updatePostgresAccountStatus(params)
    : updateJsonAccountStatus(params);
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
  return getDataProvider() === "postgres"
    ? upsertPostgresYouTubeConnection(params)
    : upsertJsonYouTubeConnection(params);
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
  return getDataProvider() === "postgres"
    ? upsertPostgresTikTokConnection(params)
    : upsertJsonTikTokConnection(params);
}

export async function listYouTubeConnections() {
  return getDataProvider() === "postgres"
    ? listPostgresYouTubeConnections()
    : listJsonYouTubeConnections();
}

export async function listTikTokConnections() {
  return getDataProvider() === "postgres"
    ? listPostgresTikTokConnections()
    : listJsonTikTokConnections();
}

export async function persistYouTubeSyncResult(params: {
  connectionId: string;
  totalViews: number;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  rawProfile?: Record<string, unknown>;
}) {
  return getDataProvider() === "postgres"
    ? persistPostgresYouTubeSyncResult(params)
    : persistJsonYouTubeSyncResult(params);
}

export async function persistTikTokSyncResult(params: {
  connectionId: string;
  totalViews: number;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  rawProfile?: Record<string, unknown>;
}) {
  return getDataProvider() === "postgres"
    ? persistPostgresTikTokSyncResult(params)
    : persistJsonTikTokSyncResult(params);
}

export async function recordSyncJob(job: PersistedSyncJob) {
  return getDataProvider() === "postgres"
    ? recordPostgresSyncJob(job)
    : recordJsonSyncJob(job);
}

export async function listSyncJobs(params?: {
  platformSlug?: SyncPlatform;
  limit?: number;
}) {
  return getDataProvider() === "postgres"
    ? listPostgresSyncJobs(params)
    : listJsonSyncJobs(params);
}
