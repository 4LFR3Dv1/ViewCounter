import type { PersistedAccountConnection, PersistedSyncJob } from "../types/store";
type SyncTrigger = PersistedSyncJob["trigger"];
export declare function syncSingleYouTubeConnection(connection: PersistedAccountConnection): Promise<{
    connectionId: string;
    totalViews: number;
}>;
export declare function syncAllYouTubeConnections(trigger?: SyncTrigger): Promise<{
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
export declare function syncYouTubeConnectionById(connectionId: string, trigger?: SyncTrigger): Promise<{
    connectionId: string;
    totalViews: number;
}>;
export {};
