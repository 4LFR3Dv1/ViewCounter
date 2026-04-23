import { useState } from "react";
import { motion } from "motion/react";
import {
  CheckCircle2,
  Clock3,
  Music2,
  Plug,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Youtube,
} from "lucide-react";
import { getApiUrl, triggerTikTokSync, triggerYouTubeSync } from "../services/dashboard-api";
import { useAdminConnections } from "../hooks/use-admin-connections";
import type { AdminConnectionOverviewItem, AdminSyncJobItem } from "../types/admin";

function formatDateTime(dateLike?: string) {
  if (!dateLike) return "sem informacao";

  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "data invalida";

  return date.toLocaleString("pt-BR");
}

function getPlatformMeta(platformSlug: AdminConnectionOverviewItem["platformSlug"] | AdminSyncJobItem["platformSlug"]) {
  if (platformSlug === "youtube") {
    return {
      label: "YouTube",
      accentClassName: "text-red-300",
      borderClassName: "border-red-400/20 bg-red-500/10 text-red-100",
      Icon: Youtube,
    };
  }

  return {
    label: "TikTok",
    accentClassName: "text-cyan-300",
    borderClassName: "border-cyan-400/20 bg-cyan-500/10 text-cyan-100",
    Icon: Music2,
  };
}

function getJobStatusClassName(status: AdminSyncJobItem["status"]) {
  if (status === "success") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  }

  if (status === "partial") {
    return "border-amber-400/20 bg-amber-500/10 text-amber-100";
  }

  return "border-rose-400/20 bg-rose-500/10 text-rose-100";
}

function ConnectionRow({ connection }: { connection: AdminConnectionOverviewItem }) {
  const platform = getPlatformMeta(connection.platformSlug);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <platform.Icon className={`h-4 w-4 ${platform.accentClassName}`} />
            <p className="font-medium text-white">{connection.accountDisplayName}</p>
          </div>
          <p className="text-sm text-white/50">{connection.handle}</p>
        </div>
        <div className="rounded-full border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-white/60">
          {connection.accountStatus}
        </div>
      </div>

      <div className="space-y-1 text-xs text-white/50">
        <p>provider id: {connection.providerAccountId}</p>
        <p>refresh token: {connection.hasRefreshToken ? "disponivel" : "ausente"}</p>
        <p>expira em: {formatDateTime(connection.expiresAt)}</p>
        <p>ultima atualizacao: {formatDateTime(connection.updatedAt)}</p>
        <p>scopes: {connection.scopes.join(", ") || "nenhum scope salvo"}</p>
      </div>
    </div>
  );
}

function SyncJobRow({ job }: { job: AdminSyncJobItem }) {
  const platform = getPlatformMeta(job.platformSlug);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <platform.Icon className={`h-4 w-4 ${platform.accentClassName}`} />
          <div>
            <p className="font-medium text-white">{platform.label}</p>
            <p className="text-xs uppercase tracking-[0.16em] text-white/40">
              {job.trigger} / {job.scope}
            </p>
          </div>
        </div>

        <div className={`rounded-full border px-2 py-1 text-[11px] uppercase tracking-[0.16em] ${getJobStatusClassName(job.status)}`}>
          {job.status}
        </div>
      </div>

      <div className="grid gap-2 text-xs text-white/55 md:grid-cols-2">
        <p>inicio: {formatDateTime(job.startedAt)}</p>
        <p>fim: {formatDateTime(job.finishedAt)}</p>
        <p>
          resultado: {job.successCount}/{job.totalConnections} ok
        </p>
        <p>falhas: {job.failedCount}</p>
      </div>

      {job.message ? <p className="mt-3 text-sm text-white/75">{job.message}</p> : null}
      {job.error ? <p className="mt-1 text-sm text-rose-200">{job.error}</p> : null}
    </div>
  );
}

export function ConnectionsPanel() {
  const { data, syncJobs, isLoading, error, refresh } = useAdminConnections();
  const [syncState, setSyncState] = useState<"youtube" | "tiktok" | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleSyncAll = async (platform: "youtube" | "tiktok") => {
    setSyncState(platform);
    setSyncMessage(null);

    try {
      const result = platform === "youtube" ? await triggerYouTubeSync() : await triggerTikTokSync();
      const label = platform === "youtube" ? "YouTube" : "TikTok";
      setSyncMessage(`${label} sync: ${result.success}/${result.total} conexoes atualizadas`);
      await refresh();
    } catch (nextError) {
      setSyncMessage(nextError instanceof Error ? nextError.message : "Falha ao sincronizar");
    } finally {
      setSyncState(null);
    }
  };

  const youtubeConnectUrl = `${getApiUrl("/auth/youtube/start")}?returnTo=${encodeURIComponent("/")}`;
  const tiktokConnectUrl = `${getApiUrl("/auth/tiktok/start")}?returnTo=${encodeURIComponent("/")}`;
  const youtubeConnections = data?.connections.filter((item) => item.platformSlug === "youtube").length ?? 0;
  const tiktokConnections = data?.connections.filter((item) => item.platformSlug === "tiktok").length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Conexoes e ingestao</h2>
          <p className="text-sm text-white/45">
            OAuth oficial, sync por plataforma e historico persistido de execucoes no backend Railway
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={youtubeConnectUrl}
            className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm text-red-100 transition-colors hover:bg-red-500/15"
          >
            <Plug className="h-4 w-4" />
            Conectar YouTube
          </a>
          <a
            href={tiktokConnectUrl}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 transition-colors hover:bg-cyan-500/15"
          >
            <Plug className="h-4 w-4" />
            Conectar TikTok
          </a>
          <button
            type="button"
            onClick={() => void handleSyncAll("youtube")}
            disabled={syncState !== null}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${syncState === "youtube" ? "animate-spin" : ""}`} />
            Sync YouTube
          </button>
          <button
            type="button"
            onClick={() => void handleSyncAll("tiktok")}
            disabled={syncState !== null}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${syncState === "tiktok" ? "animate-spin" : ""}`} />
            Sync TikTok
          </button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/40">
            <ShieldCheck className="h-4 w-4 text-cyan-300" />
            provider
          </div>
          <p className="text-xl font-semibold text-white">{data?.provider ?? "--"}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/40">
            <Youtube className="h-4 w-4 text-red-300" />
            youtube
          </div>
          <p className="text-xl font-semibold text-white">{youtubeConnections}</p>
          <p className="mt-1 text-xs text-white/45">
            {data?.youtubeSyncIntervalMinutes ? `${data.youtubeSyncIntervalMinutes} min` : "manual"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/40">
            <Music2 className="h-4 w-4 text-cyan-300" />
            tiktok
          </div>
          <p className="text-xl font-semibold text-white">{tiktokConnections}</p>
          <p className="mt-1 text-xs text-white/45">
            {data?.tiktokSyncIntervalMinutes ? `${data.tiktokSyncIntervalMinutes} min` : "manual"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/40">
            <Clock3 className="h-4 w-4 text-emerald-300" />
            jobs
          </div>
          <p className="text-xl font-semibold text-white">{syncJobs.length}</p>
          <p className="mt-1 text-xs text-white/45">ultimas execucoes persistidas</p>
        </div>
      </div>

      {syncMessage ? (
        <div className="mb-4 rounded-2xl border border-emerald-400/15 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {syncMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-5 text-sm text-white/55">
          Carregando conexoes...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-5 text-sm text-amber-100">
          {error}
        </div>
      ) : (
        <>
          <div className="mb-4">
            <div className="mb-3 flex items-center gap-2 text-sm text-white/65">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Conexoes salvas
            </div>

            {data && data.connections.length > 0 ? (
              <div className="grid gap-3">
                {data.connections.map((connection) => (
                  <ConnectionRow key={connection.id} connection={connection} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-5 text-sm text-white/55">
                Nenhuma conexao OAuth salva ainda. Use os botoes de conectar para iniciar pelo YouTube ou TikTok.
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-white/65">
              <TriangleAlert className="h-4 w-4 text-amber-300" />
              Historico de sync
            </div>

            {syncJobs.length > 0 ? (
              <div className="grid gap-3">
                {syncJobs.map((job) => (
                  <SyncJobRow key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-5 text-sm text-white/55">
                Nenhum sync executado ainda. Quando uma coleta rodar, o historico aparece aqui sem interromper o layout.
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
