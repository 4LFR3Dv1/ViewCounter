import type { ConnectionStatus, PlatformSlug } from "./dashboard";

export interface AdminConnectionOverviewItem {
  id: string;
  accountId: string;
  platformSlug: PlatformSlug;
  accountDisplayName: string;
  handle: string;
  accountStatus: ConnectionStatus;
  providerAccountId: string;
  scopes: string[];
  expiresAt?: string;
  updatedAt: string;
  hasRefreshToken: boolean;
}

export interface AdminConnectionsOverview {
  provider: string;
  youtubeSyncIntervalMinutes: number;
  tiktokSyncIntervalMinutes: number;
  connections: AdminConnectionOverviewItem[];
}

export interface AdminSyncJobItem {
  id: string;
  platformSlug: Extract<PlatformSlug, "youtube" | "tiktok">;
  trigger: "manual" | "scheduler";
  scope: "all" | "connection";
  connectionId?: string;
  accountId?: string;
  status: "success" | "partial" | "failed";
  totalConnections: number;
  successCount: number;
  failedCount: number;
  startedAt: string;
  finishedAt: string;
  message?: string;
  error?: string;
}
