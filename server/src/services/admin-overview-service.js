import { getActiveDataProvider } from "../repositories/dashboard-repository";
import { listSyncJobs, loadDashboardStore } from "../repositories/dashboard-repository";
export async function getAdminConnectionsOverview() {
    const store = await loadDashboardStore();
    const accountsById = new Map(store.accounts.map((account) => [account.id, account]));
    const connections = [];
    for (const connection of store.connections) {
        const account = accountsById.get(connection.accountId);
        if (!account) {
            continue;
        }
        connections.push({
            id: connection.id,
            accountId: connection.accountId,
            platformSlug: connection.platformSlug,
            accountDisplayName: account.displayName,
            handle: account.handle,
            accountStatus: account.status,
            providerAccountId: connection.providerAccountId,
            scopes: connection.scopes,
            expiresAt: connection.expiresAt,
            updatedAt: connection.updatedAt,
            hasRefreshToken: Boolean(connection.refreshToken),
        });
    }
    return {
        provider: getActiveDataProvider(),
        youtubeSyncIntervalMinutes: Number(process.env.YOUTUBE_SYNC_INTERVAL_MINUTES ?? 0),
        tiktokSyncIntervalMinutes: Number(process.env.TIKTOK_SYNC_INTERVAL_MINUTES ?? 0),
        connections: connections.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    };
}
export async function getAdminSyncJobs(limit = 50) {
    const jobs = await listSyncJobs({ limit });
    return jobs.map((job) => ({
        id: job.id,
        platformSlug: job.platformSlug,
        trigger: job.trigger,
        scope: job.scope,
        connectionId: job.connectionId,
        accountId: job.accountId,
        status: job.status,
        totalConnections: job.totalConnections,
        successCount: job.successCount,
        failedCount: job.failedCount,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        message: job.message,
        error: job.error,
    }));
}
