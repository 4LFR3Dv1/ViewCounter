import type { ConnectionStatus, PlatformSlug } from "../types/dashboard";
import type { DashboardStore, PersistedAccountConnection, PersistedSyncJob } from "../types/store";
type SyncPlatform = Extract<PlatformSlug, "youtube" | "tiktok">;
export declare function loadDashboardStore(): Promise<DashboardStore>;
export declare function appendManualSnapshot(params: {
    accountId: string;
    totalViews: number;
    capturedAt?: string;
}): Promise<DashboardStore>;
export declare function upsertYouTubeConnection(params: {
    providerAccountId: string;
    displayName: string;
    handle: string;
    totalViews: number;
    accessToken: string;
    refreshToken?: string;
    scopes: string[];
    expiresAt?: string;
    rawProfile?: Record<string, unknown>;
}): Promise<DashboardStore>;
export declare function upsertTikTokConnection(params: {
    providerAccountId: string;
    displayName: string;
    handle: string;
    totalViews: number;
    accessToken: string;
    refreshToken?: string;
    scopes: string[];
    expiresAt?: string;
    rawProfile?: Record<string, unknown>;
}): Promise<DashboardStore>;
export declare function listYouTubeConnections(): Promise<PersistedAccountConnection[]>;
export declare function listTikTokConnections(): Promise<PersistedAccountConnection[]>;
export declare function persistYouTubeSyncResult(params: {
    connectionId: string;
    totalViews: number;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
    rawProfile?: Record<string, unknown>;
}): Promise<DashboardStore>;
export declare function persistTikTokSyncResult(params: {
    connectionId: string;
    totalViews: number;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
    rawProfile?: Record<string, unknown>;
}): Promise<DashboardStore>;
export declare function recordSyncJob(job: PersistedSyncJob): Promise<PersistedSyncJob>;
export declare function listSyncJobs(params?: {
    platformSlug?: SyncPlatform;
    limit?: number;
}): Promise<PersistedSyncJob[]>;
export declare function updateAccountStatus(params: {
    accountId: string;
    status: ConnectionStatus;
    coverageNote?: string;
}): Promise<DashboardStore>;
export {};
