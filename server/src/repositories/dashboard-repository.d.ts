import type { ConnectionStatus } from "../types/dashboard";
import type { DashboardStore, PersistedSyncJob } from "../types/store";
export type DataProvider = "json" | "postgres";
type SyncPlatform = "youtube" | "tiktok";
export declare function getActiveDataProvider(): DataProvider;
export declare function loadDashboardStore(): Promise<DashboardStore>;
export declare function appendManualSnapshot(params: {
    accountId: string;
    totalViews: number;
    capturedAt?: string;
}): Promise<DashboardStore>;
export declare function updateAccountStatus(params: {
    accountId: string;
    status: ConnectionStatus;
    coverageNote?: string;
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
export declare function listYouTubeConnections(): Promise<import("../types/store").PersistedAccountConnection[]>;
export declare function listTikTokConnections(): Promise<import("../types/store").PersistedAccountConnection[]>;
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
export {};
