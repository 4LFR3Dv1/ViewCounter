import { syncAllYouTubeConnections } from "../services/youtube-sync-service.js";

function getSyncIntervalMs() {
  const minutes = Number(process.env.YOUTUBE_SYNC_INTERVAL_MINUTES ?? 0);

  if (!Number.isFinite(minutes) || minutes <= 0) {
    return 0;
  }

  return minutes * 60_000;
}

export function startYouTubeSyncScheduler(log: { info: (message: string) => void; error: (error: unknown, message?: string) => void }) {
  const intervalMs = getSyncIntervalMs();

  if (intervalMs <= 0) {
    log.info("Scheduler do YouTube desabilitado");
    return null;
  }

  const run = async () => {
    try {
      const result = await syncAllYouTubeConnections("scheduler");
      log.info(`YouTube sync concluido: ${result.success}/${result.total} conexoes atualizadas`);
    } catch (error) {
      log.error(error, "Falha no scheduler do YouTube");
    }
  };

  void run();
  const timer = setInterval(() => {
    void run();
  }, intervalMs);

  log.info(`Scheduler do YouTube habilitado para rodar a cada ${Math.round(intervalMs / 60_000)} minuto(s)`);
  return timer;
}
