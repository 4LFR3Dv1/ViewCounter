export declare function startYouTubeSyncScheduler(log: {
    info: (message: string) => void;
    error: (error: unknown, message?: string) => void;
}): NodeJS.Timeout;
