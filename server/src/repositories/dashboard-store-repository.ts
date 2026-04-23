import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSeedDashboardStore } from "../data/seed-dashboard-store.js";
import type { ConnectionStatus, PlatformSlug } from "../types/dashboard.js";
import type {
  DashboardStore,
  PersistedAccountConnection,
  PersistedMetricSnapshot,
  PersistedSyncJob,
} from "../types/store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, "../../data");
const storePath = path.join(dataDir, "dashboard-store.json");

type SyncPlatform = Extract<PlatformSlug, "youtube" | "tiktok">;

async function writeStore(store: DashboardStore) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

async function ensureStore(): Promise<DashboardStore> {
  try {
    const content = await readFile(storePath, "utf8");
    const parsed = JSON.parse(content) as DashboardStore;
    return {
      ...parsed,
      connections: parsed.connections ?? [],
      syncJobs: parsed.syncJobs ?? [],
    };
  } catch {
    const seedStore = createSeedDashboardStore();
    await writeStore(seedStore);
    return seedStore;
  }
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
  const store = await ensureStore();
  const platformPrefix = params.platformSlug === "youtube" ? "yt" : "tt";
  const accountId = `acc-${platformPrefix}-${params.providerAccountId}`;
  const connectionId = `conn-${platformPrefix}-${params.providerAccountId}`;
  const now = new Date().toISOString();

  const existingAccount = store.accounts.find((item) => item.id === accountId);
  if (existingAccount) {
    existingAccount.displayName = params.displayName;
    existingAccount.handle = params.handle;
    existingAccount.status = "connected";
    existingAccount.isActive = true;
    existingAccount.coverageNote = buildConnectedCoverageNote(params.platformSlug);
    existingAccount.warningNote = undefined;
  } else {
    store.accounts.push({
      id: accountId,
      platformSlug: params.platformSlug,
      displayName: params.displayName,
      handle: params.handle,
      status: "connected",
      isActive: true,
      featured: true,
      coverageNote: buildConnectedCoverageNote(params.platformSlug),
    });
  }

  const existingConnection = store.connections.find((item) => item.id === connectionId);
  const nextConnection: PersistedAccountConnection = {
    id: connectionId,
    accountId,
    platformSlug: params.platformSlug,
    providerAccountId: params.providerAccountId,
    accessToken: params.accessToken,
    refreshToken: params.refreshToken ?? existingConnection?.refreshToken,
    scopes: params.scopes,
    expiresAt: params.expiresAt,
    createdAt: existingConnection?.createdAt ?? now,
    updatedAt: now,
    rawProfile: params.rawProfile,
  };

  if (existingConnection) {
    const index = store.connections.findIndex((item) => item.id === connectionId);
    store.connections[index] = nextConnection;
  } else {
    store.connections.push(nextConnection);
  }

  store.snapshots.push({
    id: `${accountId}-oauth-${Date.now()}`,
    accountId,
    capturedAt: now,
    totalViews: params.totalViews,
    source: "api",
  });

  store.events.unshift({
    id: `evt-${platformPrefix}-connect-${Date.now()}`,
    platformSlug: params.platformSlug,
    text: buildConnectEventText(params.platformSlug, params.displayName),
    createdAt: now,
  });

  store.updatedAt = now;
  await writeStore(store);
  return store;
}

async function listPlatformConnections(platformSlug: SyncPlatform) {
  const store = await ensureStore();
  return store.connections.filter((item) => item.platformSlug === platformSlug);
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
  const store = await ensureStore();
  const connection = store.connections.find((item) => item.id === params.connectionId);

  if (!connection) {
    throw new Error(`Conexao ${params.platformSlug} nao encontrada: ${params.connectionId}`);
  }

  const account = store.accounts.find((item) => item.id === connection.accountId);

  if (!account) {
    throw new Error(`Conta associada nao encontrada: ${connection.accountId}`);
  }

  const now = new Date().toISOString();
  const platformPrefix = params.platformSlug === "youtube" ? "yt" : "tt";

  connection.accessToken = params.accessToken ?? connection.accessToken;
  connection.refreshToken = params.refreshToken ?? connection.refreshToken;
  connection.expiresAt = params.expiresAt ?? connection.expiresAt;
  connection.updatedAt = now;
  connection.rawProfile = params.rawProfile ?? connection.rawProfile;

  account.status = "connected";
  account.isActive = true;
  account.coverageNote = buildSyncCoverageNote(params.platformSlug);
  account.warningNote = undefined;

  store.snapshots.push({
    id: `${account.id}-sync-${Date.now()}`,
    accountId: account.id,
    capturedAt: now,
    totalViews: params.totalViews,
    source: "api",
  });

  store.events.unshift({
    id: `evt-${platformPrefix}-sync-${Date.now()}`,
    platformSlug: params.platformSlug,
    text: buildSyncEventText(params.platformSlug, account.displayName),
    createdAt: now,
  });

  store.updatedAt = now;
  await writeStore(store);
  return store;
}

export async function loadDashboardStore() {
  return ensureStore();
}

export async function appendManualSnapshot(params: {
  accountId: string;
  totalViews: number;
  capturedAt?: string;
}) {
  const store = await ensureStore();
  const account = store.accounts.find((item) => item.id === params.accountId);

  if (!account) {
    throw new Error(`Conta nao encontrada: ${params.accountId}`);
  }

  const snapshot: PersistedMetricSnapshot = {
    id: `${params.accountId}-manual-${Date.now()}`,
    accountId: params.accountId,
    capturedAt: params.capturedAt ?? new Date().toISOString(),
    totalViews: params.totalViews,
    source: "manual",
  };

  store.snapshots.push(snapshot);
  account.status = "manual_mode";
  account.coverageNote = account.coverageNote ?? "Snapshot manual registrado no painel admin";
  store.updatedAt = new Date().toISOString();

  await writeStore(store);
  return store;
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

export async function listYouTubeConnections() {
  return listPlatformConnections("youtube");
}

export async function listTikTokConnections() {
  return listPlatformConnections("tiktok");
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
  const store = await ensureStore();
  store.syncJobs.unshift(job);
  store.syncJobs = store.syncJobs
    .sort((left, right) => right.startedAt.localeCompare(left.startedAt))
    .slice(0, 200);
  store.updatedAt = new Date().toISOString();
  await writeStore(store);
  return job;
}

export async function listSyncJobs(params?: {
  platformSlug?: SyncPlatform;
  limit?: number;
}) {
  const store = await ensureStore();
  const filtered = params?.platformSlug
    ? store.syncJobs.filter((item) => item.platformSlug === params.platformSlug)
    : store.syncJobs;
  const limit = params?.limit ?? 50;
  return filtered
    .slice()
    .sort((left, right) => right.startedAt.localeCompare(left.startedAt))
    .slice(0, limit);
}

export async function updateAccountStatus(params: {
  accountId: string;
  status: ConnectionStatus;
  coverageNote?: string;
}) {
  const store = await ensureStore();
  const account = store.accounts.find((item) => item.id === params.accountId);

  if (!account) {
    throw new Error(`Conta nao encontrada: ${params.accountId}`);
  }

  account.status = params.status;
  if (params.coverageNote) {
    account.coverageNote = params.coverageNote;
  }
  store.updatedAt = new Date().toISOString();

  await writeStore(store);
  return store;
}
