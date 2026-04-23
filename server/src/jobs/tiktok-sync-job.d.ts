export declare function startTikTokSyncScheduler(log: {
    info: (message: string) => void;
    error: (error: unknown, message?: string) => void;
}): NodeJS.Timeout;
