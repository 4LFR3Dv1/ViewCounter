import { listYouTubeConnections, persistYouTubeSyncResult, recordSyncJob, updateAccountStatus, } from "../repositories/dashboard-repository";
function getRequiredEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} nao definido`);
    }
    return value;
}
function shouldRefreshAccessToken(connection) {
    if (!connection.expiresAt) {
        return false;
    }
    return new Date(connection.expiresAt).getTime() - Date.now() < 60_000;
}
function buildSingleJob(params) {
    return {
        id: `job-yt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        platformSlug: "youtube",
        trigger: params.trigger,
        scope: "connection",
        connectionId: params.connection.id,
        accountId: params.connection.accountId,
        status: params.status,
        totalConnections: 1,
        successCount: params.status === "failed" ? 0 : 1,
        failedCount: params.status === "failed" ? 1 : 0,
        startedAt: params.startedAt,
        finishedAt: params.finishedAt,
        message: params.status === "failed"
            ? "Falha ao sincronizar conexao do YouTube"
            : "Sincronizacao individual do YouTube concluida",
        error: params.error,
        details: params.totalViews !== undefined ? { totalViews: params.totalViews } : undefined,
    };
}
async function recordBatchJob(params) {
    const total = params.results.length;
    const success = params.results.filter((item) => item.ok).length;
    const failed = total - success;
    const status = failed === 0 ? "success" : success === 0 ? "failed" : "partial";
    await recordSyncJob({
        id: `job-yt-all-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        platformSlug: "youtube",
        trigger: params.trigger,
        scope: "all",
        status,
        totalConnections: total,
        successCount: success,
        failedCount: failed,
        startedAt: params.startedAt,
        finishedAt: params.finishedAt,
        message: failed === 0 ? "Sincronizacao em lote do YouTube concluida" : "Sincronizacao em lote do YouTube concluida com falhas",
        error: failed > 0 ? "Uma ou mais conexoes do YouTube falharam" : undefined,
        details: {
            results: params.results,
        },
    });
}
async function refreshYouTubeAccessToken(connection) {
    if (!connection.refreshToken) {
        return null;
    }
    const clientId = getRequiredEnv("YOUTUBE_CLIENT_ID");
    const clientSecret = getRequiredEnv("YOUTUBE_CLIENT_SECRET");
    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: connection.refreshToken,
            grant_type: "refresh_token",
        }),
    });
    if (!response.ok) {
        throw new Error(`Falha ao renovar token do YouTube: ${response.status}`);
    }
    const payload = (await response.json());
    return {
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token ?? connection.refreshToken,
        expiresAt: new Date(Date.now() + payload.expires_in * 1000).toISOString(),
    };
}
async function fetchChannelStats(connection, accessToken) {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${encodeURIComponent(connection.providerAccountId)}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    if (!response.ok) {
        throw new Error(`Falha ao buscar estatisticas do canal no YouTube: ${response.status}`);
    }
    const payload = (await response.json());
    const channel = payload.items?.[0];
    if (!channel?.id) {
        throw new Error(`Canal do YouTube nao encontrado para provider_account_id=${connection.providerAccountId}`);
    }
    return {
        totalViews: Number(channel.statistics?.viewCount ?? 0),
        rawProfile: channel,
    };
}
export async function syncSingleYouTubeConnection(connection) {
    let accessToken = connection.accessToken;
    let refreshToken = connection.refreshToken;
    let expiresAt = connection.expiresAt;
    if (shouldRefreshAccessToken(connection)) {
        const refreshed = await refreshYouTubeAccessToken(connection);
        if (refreshed) {
            accessToken = refreshed.accessToken;
            refreshToken = refreshed.refreshToken;
            expiresAt = refreshed.expiresAt;
        }
    }
    const stats = await fetchChannelStats(connection, accessToken);
    await persistYouTubeSyncResult({
        connectionId: connection.id,
        totalViews: stats.totalViews,
        accessToken,
        refreshToken,
        expiresAt,
        rawProfile: stats.rawProfile,
    });
    return {
        connectionId: connection.id,
        totalViews: stats.totalViews,
    };
}
export async function syncAllYouTubeConnections(trigger = "manual") {
    const startedAt = new Date().toISOString();
    const connections = await listYouTubeConnections();
    const results = [];
    for (const connection of connections) {
        try {
            const result = await syncSingleYouTubeConnection(connection);
            results.push({
                connectionId: result.connectionId,
                ok: true,
                totalViews: result.totalViews,
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Falha desconhecida no sync do YouTube";
            await updateAccountStatus({
                accountId: connection.accountId,
                status: "warning",
                coverageNote: "Ultima sincronizacao falhou; mantendo o ultimo snapshot valido do YouTube",
            });
            results.push({
                connectionId: connection.id,
                ok: false,
                error: errorMessage,
            });
        }
    }
    const finishedAt = new Date().toISOString();
    await recordBatchJob({
        trigger,
        startedAt,
        finishedAt,
        results,
    });
    return {
        total: connections.length,
        success: results.filter((item) => item.ok).length,
        failed: results.filter((item) => !item.ok).length,
        results,
    };
}
export async function syncYouTubeConnectionById(connectionId, trigger = "manual") {
    const startedAt = new Date().toISOString();
    const connections = await listYouTubeConnections();
    const connection = connections.find((item) => item.id === connectionId);
    if (!connection) {
        throw new Error(`Conexao YouTube nao encontrada: ${connectionId}`);
    }
    try {
        const result = await syncSingleYouTubeConnection(connection);
        await recordSyncJob(buildSingleJob({
            connection,
            trigger,
            status: "success",
            totalViews: result.totalViews,
            startedAt,
            finishedAt: new Date().toISOString(),
        }));
        return result;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Falha desconhecida no sync do YouTube";
        await updateAccountStatus({
            accountId: connection.accountId,
            status: "warning",
            coverageNote: "Ultima sincronizacao falhou; mantendo o ultimo snapshot valido do YouTube",
        });
        await recordSyncJob(buildSingleJob({
            connection,
            trigger,
            status: "failed",
            startedAt,
            finishedAt: new Date().toISOString(),
            error: errorMessage,
        }));
        throw error;
    }
}
