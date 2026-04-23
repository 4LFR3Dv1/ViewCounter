import { listTikTokConnections, persistTikTokSyncResult, recordSyncJob, updateAccountStatus, } from "../repositories/dashboard-repository";
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
function getMaxVideoPages() {
    const raw = Number(process.env.TIKTOK_MAX_VIDEO_PAGES ?? 20);
    if (!Number.isFinite(raw) || raw <= 0) {
        return 20;
    }
    return Math.min(Math.trunc(raw), 50);
}
function buildSingleJob(params) {
    return {
        id: `job-tt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        platformSlug: "tiktok",
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
            ? "Falha ao sincronizar conexao do TikTok"
            : "Sincronizacao individual do TikTok concluida",
        error: params.error,
        details: params.totalViews !== undefined
            ? {
                totalViews: params.totalViews,
                videoCount: params.videoCount ?? 0,
            }
            : undefined,
    };
}
async function recordBatchJob(params) {
    const total = params.results.length;
    const success = params.results.filter((item) => item.ok).length;
    const failed = total - success;
    const status = failed === 0 ? "success" : success === 0 ? "failed" : "partial";
    await recordSyncJob({
        id: `job-tt-all-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        platformSlug: "tiktok",
        trigger: params.trigger,
        scope: "all",
        status,
        totalConnections: total,
        successCount: success,
        failedCount: failed,
        startedAt: params.startedAt,
        finishedAt: params.finishedAt,
        message: failed === 0 ? "Sincronizacao em lote do TikTok concluida" : "Sincronizacao em lote do TikTok concluida com falhas",
        error: failed > 0 ? "Uma ou mais conexoes do TikTok falharam" : undefined,
        details: {
            results: params.results,
        },
    });
}
async function refreshTikTokAccessToken(connection) {
    if (!connection.refreshToken) {
        return null;
    }
    const clientKey = getRequiredEnv("TIKTOK_CLIENT_KEY");
    const clientSecret = getRequiredEnv("TIKTOK_CLIENT_SECRET");
    const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Cache-Control": "no-cache",
        },
        body: new URLSearchParams({
            client_key: clientKey,
            client_secret: clientSecret,
            grant_type: "refresh_token",
            refresh_token: connection.refreshToken,
        }),
    });
    if (!response.ok) {
        throw new Error(`Falha ao renovar token do TikTok: ${response.status}`);
    }
    const payload = (await response.json());
    return {
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token ?? connection.refreshToken,
        expiresAt: new Date(Date.now() + payload.expires_in * 1000).toISOString(),
        scopes: payload.scope.split(",").map((scope) => scope.trim()).filter(Boolean),
    };
}
export async function fetchTikTokProfile(accessToken) {
    const response = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    if (!response.ok) {
        throw new Error(`Falha ao buscar perfil do TikTok: ${response.status}`);
    }
    const payload = (await response.json());
    const user = payload.data?.user;
    if (!user?.open_id || !user.display_name) {
        throw new Error("Nao foi possivel identificar a conta autenticada do TikTok");
    }
    return {
        openId: user.open_id,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
    };
}
export async function fetchTikTokTotalViews(accessToken) {
    const maxPages = getMaxVideoPages();
    let cursor;
    let hasMore = true;
    let page = 0;
    let totalViews = 0;
    let videoCount = 0;
    let latestVideoTitle;
    let latestVideoCoverUrl;
    while (hasMore && page < maxPages) {
        const url = "https://open.tiktokapis.com/v2/video/list/?fields=id,title,cover_image_url,view_count";
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                max_count: 20,
                ...(cursor ? { cursor } : {}),
            }),
        });
        if (!response.ok) {
            throw new Error(`Falha ao buscar videos do TikTok: ${response.status}`);
        }
        const payload = (await response.json());
        const videos = payload.data?.videos ?? [];
        for (const video of videos) {
            totalViews += Number(video.view_count ?? 0);
            videoCount += 1;
            if (!latestVideoTitle) {
                latestVideoTitle = video.title;
                latestVideoCoverUrl = video.cover_image_url;
            }
        }
        cursor = payload.data?.cursor;
        hasMore = Boolean(payload.data?.has_more);
        page += 1;
    }
    return {
        totalViews,
        videoCount,
        scannedPages: page,
        partialScan: hasMore,
        latestVideoTitle,
        latestVideoCoverUrl,
    };
}
export async function fetchTikTokAccountSnapshot(accessToken) {
    const [profile, stats] = await Promise.all([
        fetchTikTokProfile(accessToken),
        fetchTikTokTotalViews(accessToken),
    ]);
    return {
        providerAccountId: profile.openId,
        displayName: profile.displayName,
        handle: `tiktok:${profile.openId.slice(0, 8)}`,
        totalViews: stats.totalViews,
        rawProfile: {
            ...profile,
            stats,
        },
        videoCount: stats.videoCount,
    };
}
export async function syncSingleTikTokConnection(connection) {
    let accessToken = connection.accessToken;
    let refreshToken = connection.refreshToken;
    let expiresAt = connection.expiresAt;
    if (shouldRefreshAccessToken(connection)) {
        const refreshed = await refreshTikTokAccessToken(connection);
        if (refreshed) {
            accessToken = refreshed.accessToken;
            refreshToken = refreshed.refreshToken;
            expiresAt = refreshed.expiresAt;
        }
    }
    const snapshot = await fetchTikTokAccountSnapshot(accessToken);
    await persistTikTokSyncResult({
        connectionId: connection.id,
        totalViews: snapshot.totalViews,
        accessToken,
        refreshToken,
        expiresAt,
        rawProfile: snapshot.rawProfile,
    });
    return {
        connectionId: connection.id,
        totalViews: snapshot.totalViews,
        videoCount: snapshot.videoCount,
    };
}
export async function syncAllTikTokConnections(trigger = "manual") {
    const startedAt = new Date().toISOString();
    const connections = await listTikTokConnections();
    const results = [];
    for (const connection of connections) {
        try {
            const result = await syncSingleTikTokConnection(connection);
            results.push({
                connectionId: result.connectionId,
                ok: true,
                totalViews: result.totalViews,
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Falha desconhecida no sync do TikTok";
            await updateAccountStatus({
                accountId: connection.accountId,
                status: "warning",
                coverageNote: "Ultima sincronizacao falhou; mantendo o ultimo snapshot valido do TikTok",
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
export async function syncTikTokConnectionById(connectionId, trigger = "manual") {
    const startedAt = new Date().toISOString();
    const connections = await listTikTokConnections();
    const connection = connections.find((item) => item.id === connectionId);
    if (!connection) {
        throw new Error(`Conexao TikTok nao encontrada: ${connectionId}`);
    }
    try {
        const result = await syncSingleTikTokConnection(connection);
        await recordSyncJob(buildSingleJob({
            connection,
            trigger,
            status: "success",
            totalViews: result.totalViews,
            videoCount: result.videoCount,
            startedAt,
            finishedAt: new Date().toISOString(),
        }));
        return result;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Falha desconhecida no sync do TikTok";
        await updateAccountStatus({
            accountId: connection.accountId,
            status: "warning",
            coverageNote: "Ultima sincronizacao falhou; mantendo o ultimo snapshot valido do TikTok",
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
