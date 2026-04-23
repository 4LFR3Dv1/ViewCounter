import type { PersistedAccountConnection, PersistedSyncJob } from "../types/store";
type SyncTrigger = PersistedSyncJob["trigger"];
export declare function fetchTikTokProfile(accessToken: string): Promise<{
    openId: string;
    displayName: string;
    avatarUrl: string;
}>;
export declare function fetchTikTokTotalViews(accessToken: string): Promise<{
    totalViews: number;
    videoCount: number;
    scannedPages: number;
    partialScan: boolean;
    latestVideoTitle: string;
    latestVideoCoverUrl: string;
}>;
export declare function fetchTikTokAccountSnapshot(accessToken: string): Promise<{
    providerAccountId: string;
    displayName: string;
    handle: string;
    totalViews: number;
    rawProfile: {
        stats: {
            totalViews: number;
            videoCount: number;
            scannedPages: number;
            partialScan: boolean;
            latestVideoTitle: string;
            latestVideoCoverUrl: string;
        };
        openId: string;
        displayName: string;
        avatarUrl: string;
    };
    videoCount: number;
}>;
export declare function syncSingleTikTokConnection(connection: PersistedAccountConnection): Promise<{
    connectionId: string;
    totalViews: number;
    videoCount: number;
}>;
export declare function syncAllTikTokConnections(trigger?: SyncTrigger): Promise<{
    total: number;
    success: number;
    failed: number;
    results: {
        connectionId: string;
        ok: boolean;
        totalViews?: number;
        error?: string;
    }[];
}>;
export declare function syncTikTokConnectionById(connectionId: string, trigger?: SyncTrigger): Promise<{
    connectionId: string;
    totalViews: number;
    videoCount: number;
}>;
export {};
