import { syncAllTikTokConnections } from "../services/tiktok-sync-service";
function getSyncIntervalMs() {
    const minutes = Number(process.env.TIKTOK_SYNC_INTERVAL_MINUTES ?? 0);
    if (!Number.isFinite(minutes) || minutes <= 0) {
        return 0;
    }
    return minutes * 60_000;
}
export function startTikTokSyncScheduler(log) {
    const intervalMs = getSyncIntervalMs();
    if (intervalMs <= 0) {
        log.info("Scheduler do TikTok desabilitado");
        return null;
    }
    const run = async () => {
        try {
            const result = await syncAllTikTokConnections("scheduler");
            log.info(`TikTok sync concluido: ${result.success}/${result.total} conexoes atualizadas`);
        }
        catch (error) {
            log.error(error, "Falha no scheduler do TikTok");
        }
    };
    void run();
    const timer = setInterval(() => {
        void run();
    }, intervalMs);
    log.info(`Scheduler do TikTok habilitado para rodar a cada ${Math.round(intervalMs / 60_000)} minuto(s)`);
    return timer;
}
