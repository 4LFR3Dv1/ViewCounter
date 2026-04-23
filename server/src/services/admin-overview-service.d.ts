import type { ConnectionStatus, PlatformSlug } from "../types/dashboard";
import type { PersistedSyncJob } from "../types/store";
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
    platformSlug: PersistedSyncJob["platformSlug"];
    trigger: PersistedSyncJob["trigger"];
    scope: PersistedSyncJob["scope"];
    connectionId?: string;
    accountId?: string;
    status: PersistedSyncJob["status"];
    totalConnections: number;
    successCount: number;
    failedCount: number;
    startedAt: string;
    finishedAt: string;
    message?: string;
    error?: string;
}
export declare function getAdminConnectionsOverview(): Promise<AdminConnectionsOverview>;
export declare function getAdminSyncJobs(limit?: number): Promise<AdminSyncJobItem[]>;
