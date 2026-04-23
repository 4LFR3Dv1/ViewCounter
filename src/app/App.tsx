import { motion } from "motion/react";
import { useMemo } from "react";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Clock3,
  MessageCircle,
  Radio,
  RefreshCw,
  Satellite,
  Youtube,
} from "lucide-react";
import { ConnectionsPanel } from "./components/ConnectionsPanel";
import { GrowthChart } from "./components/GrowthChart";
import { LiveCounter } from "./components/LiveCounter";
import { useDashboard } from "./hooks/use-dashboard";
import type { AccountCardData, CaseStudy, ConnectionStatus, DashboardPayload, PlatformCardData } from "./types/dashboard";

const hiddenPublicStatuses = new Set<ConnectionStatus>(["disconnected", "expired", "pending_auth", "pending_approval"]);

function formatCompact(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatFull(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatClock(dateLike: string) {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "--:--";

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatPercentage(value: number) {
  return `${Math.round(value)}%`;
}

function getShare(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, (value / total) * 100));
}

function getPublicPlatforms(platforms: PlatformCardData[]) {
  return platforms.filter((platform) => {
    if (hiddenPublicStatuses.has(platform.status)) return false;
    return platform.accountsTotal > 0 || platform.accountsCovered > 0 || platform.views > 0;
  });
}

function getPlatformAccounts(accounts: AccountCardData[], platform?: PlatformCardData) {
  if (!platform) return [];
  return accounts.filter((account) => account.slug === platform.slug);
}

function formatPublicStatus(status: ConnectionStatus) {
  if (status === "connected") return "ativo";
  if (status === "syncing") return "atualizando";
  if (status === "warning") return "em revisao";
  if (status === "manual_mode") return "manual";

  return status;
}

function formatPublicEventText(text: string, platform: string) {
  return text
    .replace(new RegExp(`\\s+sincronizado automaticamente no ${platform}`, "i"), " atualizado")
    .replace(new RegExp(`\\s+sincronizada automaticamente no ${platform}`, "i"), " atualizada")
    .replace(/\s+sincronizado automaticamente\b/i, " atualizado")
    .replace(/\s+sincronizada automaticamente\b/i, " atualizada");
}

function formatPublicCoverageLabel(label: string, platform: string) {
  return label
    .replace(new RegExp(`sincronizadas pelo scheduler do ${platform}`, "i"), `atualizadas pelo ${platform}`)
    .replace(/sincronizadas pelo scheduler/i, "atualizadas")
    .replace(/sincronizadas/i, "atualizadas");
}

function SignalBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#030305]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(239,68,68,0.22),transparent_30%),radial-gradient(circle_at_80%_18%,rgba(255,255,255,0.08),transparent_26%),linear-gradient(145deg,#030305_0%,#09080b_48%,#050506_100%)]" />
      <div className="absolute inset-0 opacity-55 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,transparent_46%,rgba(239,68,68,0.16)_47%,transparent_51%,transparent_100%)]" />
      <motion.div
        className="absolute left-0 top-[18%] h-px w-full bg-gradient-to-r from-transparent via-red-300/45 to-transparent"
        animate={{ opacity: [0.25, 0.8, 0.25], y: [0, 28, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[14%] right-[-10%] h-[28rem] w-[28rem] rounded-full bg-red-500/10 blur-3xl"
        animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.7, 0.35] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(3,3,5,0.26)_48%,#030305_92%)]" />
    </div>
  );
}

function FrameOverlay({ data }: { data: DashboardPayload & { secondsSinceUpdate: number } }) {
  return (
    <div className="pointer-events-none fixed inset-3 z-40 hidden border border-white/10 lg:block">
      <div className="absolute -left-px -top-px h-9 w-9 border-l border-t border-red-400" />
      <div className="absolute -right-px -top-px h-9 w-9 border-r border-t border-white/45" />
      <div className="absolute -bottom-px -left-px h-9 w-9 border-b border-l border-white/45" />
      <div className="absolute -bottom-px -right-px h-9 w-9 border-b border-r border-red-400" />
      <div className="absolute left-4 top-3 text-[10px] uppercase text-white/35">JF runtime frame</div>
      <div className="absolute right-4 top-3 text-[10px] uppercase text-white/35">sync {data.secondsSinceUpdate}s</div>
      <div className="absolute bottom-3 left-4 text-[10px] uppercase text-white/35">{data.summary.activeWindowLabel}</div>
      <div className="absolute bottom-3 right-4 text-[10px] uppercase text-white/35">coverage {formatPercentage(data.health.coverageRatio * 100)}</div>
    </div>
  );
}

function ShellMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-hidden bg-[#030305] text-white">
      <SignalBackdrop />
      <div className="relative grid min-h-screen place-items-center p-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-xl">{children}</div>
      </div>
    </div>
  );
}

function TopBar({ data }: { data: DashboardPayload & { secondsSinceUpdate: number } }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-30 border-b border-white/10 bg-[#030305]/82 backdrop-blur-2xl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <a href="#inicio" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl border border-red-400/45 bg-red-500/10 text-sm font-black text-white shadow-[0_0_34px_rgba(239,68,68,0.24)]">
            JF
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight text-white">Signal Portfolio</p>
            <p className="text-xs text-white/45">live performance frame</p>
          </div>
        </a>

        <nav className="hidden items-center gap-6 text-sm text-white/58 md:flex">
          <a className="transition-colors hover:text-white" href="#dados">Index</a>
          <a className="transition-colors hover:text-white" href="#contas">Obras</a>
          <a className="transition-colors hover:text-white" href="#atividade">Sinais</a>
          {data.cases.length > 0 ? <a className="transition-colors hover:text-white" href="#cases">Cases</a> : null}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs text-white/60 sm:flex">
            <Radio className="h-3.5 w-3.5 text-red-300" />
            <span>{data.secondsSinceUpdate}s</span>
          </div>
          <a
            href="#contato"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#030305] transition-transform hover:scale-[1.02]"
          >
            <MessageCircle className="h-4 w-4" />
            Fale comigo
          </a>
        </div>
      </div>
    </motion.header>
  );
}

function Hero({
  data,
  platforms,
  accounts,
}: {
  data: DashboardPayload & { secondsSinceUpdate: number };
  platforms: PlatformCardData[];
  accounts: AccountCardData[];
}) {
  const leadingPlatform = [...platforms].sort((a, b) => b.views - a.views)[0];
  const leadingAccounts = getPlatformAccounts(accounts, leadingPlatform);
  const platformShare = getShare(leadingPlatform?.views ?? data.summary.viewsTotal, data.summary.viewsTotal);
  const deltaLabel = data.summary.deltaPercentage > 0 ? `+${data.summary.deltaPercentage}%` : `${data.summary.deltaPercentage}%`;

  return (
    <section id="inicio" className="relative mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-14">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.11),rgba(255,255,255,0.035)_42%,rgba(239,68,68,0.08))] p-px shadow-2xl shadow-black/30"
      >
        <div className="relative min-h-[550px] overflow-hidden rounded-[2rem] bg-[#070709]/88 p-5 backdrop-blur-2xl sm:p-7">
          <div className="absolute right-4 top-0 select-none text-[8rem] font-black leading-none text-white/[0.035] sm:text-[12rem] lg:text-[15rem]">
            JF
          </div>
          <div className="absolute left-7 top-0 h-px w-2/3 bg-gradient-to-r from-red-400 via-white/25 to-transparent" />
          <div className="absolute bottom-0 right-8 h-32 w-px bg-gradient-to-b from-transparent via-red-400/70 to-transparent" />

          <div className="relative flex min-h-[500px] flex-col justify-between">
            <div>
              <div className="mb-9 inline-flex items-center gap-2 rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1.5 text-xs uppercase text-red-100">
                <Satellite className="h-3.5 w-3.5" />
                portfolio vivo
              </div>

              <p className="mb-4 text-sm uppercase text-white/42">indice principal</p>
              <h1 className="max-w-5xl text-5xl font-black leading-none text-white sm:text-7xl lg:text-8xl">
                <LiveCounter value={data.summary.viewsTotal} duration={1.8} />
              </h1>
              <p className="mt-5 max-w-2xl text-xl font-medium text-white/82 sm:text-2xl">
                views registradas em contas conectadas.
              </p>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/52">
                Uma superficie viva para canais, cortes e presenca digital. A leitura muda conforme novas contas conectadas passam a enviar dados reais.
              </p>
            </div>

            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              <SignalStat label="janela" value={data.summary.activeWindowLabel} />
              <SignalStat label="variacao" value={deltaLabel} />
              <SignalStat label="sync" value={`${data.secondsSinceUpdate}s`} />
            </div>
          </div>
        </div>
      </motion.div>

      <motion.aside
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.08 }}
        className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,rgba(239,68,68,0.24),rgba(255,255,255,0.08)_34%,rgba(255,255,255,0.025))] p-px shadow-2xl shadow-black/30"
      >
        <div className="relative flex min-h-[550px] flex-col justify-between rounded-[2rem] bg-[#070709]/90 p-5 backdrop-blur-2xl">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-red-300/70 to-transparent" />
          <div>
            <div className="mb-8 flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-100">
                <Youtube className="h-4 w-4" />
                {leadingPlatform?.platform ?? "canal ativo"}
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/48">
                {formatPublicStatus(leadingPlatform?.status ?? "connected")}
              </div>
            </div>

            <div>
              <p className="text-sm uppercase text-white/38">plataforma lider</p>
              <p className="mt-3 text-5xl font-black leading-none text-white sm:text-6xl">
                {leadingPlatform?.platform ?? "Ativo"}
              </p>
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-xs text-white/42">
                  <span>participacao no total</span>
                  <span>{formatPercentage(platformShare)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/8">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${platformShare}%` }}
                    transition={{ duration: 1.1, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-red-500 via-red-300 to-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <SignalStat label="contas" value={`${leadingPlatform?.accountsCovered ?? data.summary.accountsCovered}/${leadingPlatform?.accountsTotal ?? data.summary.accountsTotal}`} />
              <SignalStat label="cobertura" value={formatPercentage(data.health.coverageRatio * 100)} />
            </div>
            {leadingAccounts.slice(0, 2).map((account) => (
              <AccountSignal key={account.id} account={account} total={data.summary.viewsTotal} />
            ))}
          </div>
        </div>
      </motion.aside>
    </section>
  );
}

function SignalStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <p className="text-[10px] uppercase text-white/35">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function AccountSignal({ account, total }: { account: AccountCardData; total: number }) {
  const share = getShare(account.views, total);

  return (
    <div className="rounded-2xl bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{account.displayName}</p>
          <p className="truncate text-xs text-white/42">{account.handle}</p>
        </div>
        <p className="shrink-0 text-xs text-white/45">{formatPercentage(share)}</p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
        <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: account.color }} />
      </div>
    </div>
  );
}

function ActivityStrip({ data }: { data: DashboardPayload & { secondsSinceUpdate: number } }) {
  const latestEvent = data.events[0];

  return (
    <section className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
      <div className="grid gap-3 rounded-[1.5rem] bg-white/[0.055] p-3 shadow-2xl shadow-black/20 backdrop-blur-2xl md:grid-cols-[1.3fr_0.7fr_0.7fr_0.7fr]">
        <LivePill
          icon={<Activity className="h-4 w-4" />}
          label="ultimo sinal"
          value={latestEvent ? formatPublicEventText(latestEvent.text, latestEvent.platform) : data.summary.activeWindowLabel}
          accent={latestEvent?.color ?? "#ef4444"}
        />
        <LivePill icon={<Clock3 className="h-4 w-4" />} label="sync" value={`${data.secondsSinceUpdate}s`} accent="#f87171" />
        <LivePill label="contas" value={`${data.summary.accountsCovered}/${data.summary.accountsTotal}`} accent="#ffffff" />
        <LivePill label="cobertura" value={formatPercentage(data.health.coverageRatio * 100)} accent="#f87171" />
      </div>
    </section>
  );
}

function LivePill({ icon, label, value, accent }: { icon?: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-black/24 px-4 py-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.055]" style={{ color: accent }}>
        {icon ?? <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase text-white/35">{label}</p>
        <p className="truncate text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}

function DataSection({ data, platforms }: { data: DashboardPayload; platforms: PlatformCardData[] }) {
  return (
    <section id="dados" className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:px-8">
      <div className="rounded-[2rem] bg-white/[0.05] p-5 shadow-2xl shadow-black/20 backdrop-blur-2xl">
        <SectionTitle eyebrow="index" title="Distribuicao ativa" />
        <div className="mt-5 grid gap-3">
          {platforms.map((platform) => (
            <PlatformRow key={platform.id} platform={platform} total={data.summary.viewsTotal} />
          ))}
        </div>
      </div>

      {data.chart.length > 1 ? (
        <GrowthChart
          data={data.chart}
          title="Evolucao registrada"
          subtitle={data.summary.activeWindowLabel}
          total={data.summary.viewsTotal}
          delta={data.summary.deltaPercentage}
        />
      ) : (
        <SnapshotCard data={data} />
      )}
    </section>
  );
}

function PlatformRow({ platform, total }: { platform: PlatformCardData; total: number }) {
  const share = getShare(platform.views, total);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-black/24 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: platform.color }} />
            <p className="font-semibold text-white">{platform.platform}</p>
          </div>
          <p className="text-xs text-white/42">{platform.accountsCovered}/{platform.accountsTotal} contas cobertas</p>
        </div>
        <div className="text-right">
          <p className="text-sm uppercase text-white/45">{formatPublicStatus(platform.status)}</p>
          <p className="mt-1 text-xs text-white/35">{formatCompact(platform.views)}</p>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/8">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${share}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: platform.color }}
        />
      </div>
    </motion.div>
  );
}

function SnapshotCard({ data }: { data: DashboardPayload }) {
  const point = data.chart[0];

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-white/[0.05] p-5 shadow-2xl shadow-black/25 backdrop-blur-2xl">
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-red-300/60 to-transparent" />
      <div className="flex min-h-[360px] flex-col justify-between">
        <div>
          <SectionTitle eyebrow={data.summary.activeWindowLabel} title="Registro inicial" />
          <p className="mt-4 max-w-md text-sm leading-6 text-white/48">
            A curva aparece automaticamente quando a serie trouxer mais pontos no historico.
          </p>
        </div>

        <div>
          <div className="mb-5 grid grid-cols-[auto_1fr] items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-500/12 text-red-200">
              <Clock3 className="h-5 w-5" />
            </div>
            <div className="h-px bg-gradient-to-r from-red-400/70 via-white/20 to-transparent" />
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-white/45">{point?.label ?? data.summary.activeWindowLabel}</p>
              <p className="mt-2 text-5xl font-black text-white">{formatCompact(point?.total ?? data.summary.viewsTotal)}</p>
            </div>
            <div className="rounded-full bg-white/[0.055] px-4 py-2 text-sm text-white/60">
              {data.summary.deltaPercentage > 0 ? `+${data.summary.deltaPercentage}%` : `${data.summary.deltaPercentage}%`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountsSection({ accounts }: { accounts: AccountCardData[] }) {
  return (
    <section id="contas" className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <SectionTitle eyebrow="obras conectadas" title={`${accounts.length} pecas do portfolio`} />
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {accounts.map((account, index) => (
          <AccountCard key={account.id} account={account} index={index} />
        ))}
      </div>
    </section>
  );
}

function AccountCard({ account, index }: { account: AccountCardData; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.05 }}
      className="group relative overflow-hidden rounded-[2rem] bg-[linear-gradient(140deg,rgba(255,255,255,0.08),rgba(255,255,255,0.035)_54%,rgba(239,68,68,0.08))] p-5 shadow-2xl shadow-black/20 backdrop-blur-2xl"
    >
      <div className="absolute inset-x-0 top-0 h-px opacity-80" style={{ backgroundColor: account.color }} />
      <div className="absolute right-4 top-4 text-6xl font-black leading-none text-white/[0.045]">{String(index + 1).padStart(2, "0")}</div>
      <div className="flex min-h-[280px] flex-col justify-between">
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-2xl font-black text-white">{account.displayName}</p>
            <p className="mt-1 truncate text-sm text-white/45">{account.handle}</p>
          </div>
          <div className="rounded-full bg-white/[0.06] px-3 py-1.5 text-xs text-white/55">
            {account.platform}
          </div>
        </div>

        <div className="relative">
          <p className="text-[10px] uppercase text-white/35">views</p>
          <p className="mt-2 text-5xl font-black leading-none text-white">
            <LiveCounter value={account.views} duration={1.4} />
          </p>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/48">
            {formatPublicCoverageLabel(account.coverageLabel, account.platform)}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

function EventsSection({ data }: { data: DashboardPayload & { secondsSinceUpdate: number } }) {
  if (data.events.length === 0) return null;

  return (
    <section id="atividade" className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[0.65fr_1.35fr] lg:px-8">
      <div className="rounded-[2rem] bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-2xl">
        <SectionTitle eyebrow="sinais" title="Timeline viva" />
        <div className="mt-8 flex items-center gap-3 text-sm text-white/48">
          <Clock3 className="h-4 w-4 text-red-300" />
          <span>atualizado ha {data.secondsSinceUpdate}s</span>
        </div>
      </div>

      <div className="relative grid gap-3 border-l border-red-400/35 pl-4">
        {data.events.slice(0, 5).map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 + index * 0.04 }}
            className="relative flex items-center gap-4 rounded-2xl bg-[#070709]/82 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl"
          >
            <span className="absolute -left-[23px] h-3 w-3 rounded-full border border-red-300 bg-[#030305]" />
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.055]" style={{ color: event.color }}>
              <Activity className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{formatPublicEventText(event.text, event.platform)}</p>
              <p className="mt-1 text-xs text-white/42">{event.platform} / {formatClock(event.createdAt)}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function CasesSection({ cases }: { cases: CaseStudy[] }) {
  if (cases.length === 0) return null;

  return (
    <section id="cases" className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <SectionTitle eyebrow="arquivo" title="Cases registrados" />
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {cases.map((caseStudy) => (
          <article key={caseStudy.id} className="rounded-[2rem] bg-white/[0.045] p-5 backdrop-blur-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xl font-black text-white">{caseStudy.title}</p>
                <p className="mt-1 text-sm text-white/45">{caseStudy.platform}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/15 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-200">
                <ArrowUpRight className="h-3.5 w-3.5" />+{caseStudy.growth}%
              </span>
            </div>
            <p className="text-sm leading-6 text-white/52">{caseStudy.strategy}</p>
            <div className="mt-5 flex items-end justify-between gap-4">
              <Metric label="antes" value={formatCompact(caseStudy.before)} />
              <Metric label="depois" value={formatCompact(caseStudy.after)} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase text-white/35">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function ContactSection() {
  return (
    <section id="contato" className="mx-auto max-w-7xl px-4 py-4 pb-10 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] bg-white p-6 text-[#030305] shadow-2xl shadow-black/25">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-black/45">contato</p>
            <h2 className="mt-2 text-3xl font-black">Vamos conversar sobre o portfolio?</h2>
          </div>
          <div className="rounded-xl border border-black/10 px-5 py-3 text-sm font-semibold text-black/62">
            Portfolio em movimento
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-white/35">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">{title}</h2>
    </div>
  );
}

export default function App() {
  const { data, isLoading, error } = useDashboard();
  const showOpsPanel = useMemo(() => {
    if (typeof window === "undefined") return false;
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get("admin") === "1" || window.location.hash === "#ops";
  }, []);

  if (isLoading && !data) {
    return (
      <ShellMessage>
        <div className="flex items-center gap-3 text-white/70">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Carregando portfolio...</span>
        </div>
      </ShellMessage>
    );
  }

  if (!data) {
    return (
      <ShellMessage>
        <div className="max-w-xl">
          <div className="mb-3 flex items-center gap-3 text-rose-200">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">Nao foi possivel montar o portfolio</span>
          </div>
          <p className="text-sm text-white/70">
            {error ?? "A API nao respondeu com dados publicos para a vitrine."}
          </p>
        </div>
      </ShellMessage>
    );
  }

  const publicPlatforms = getPublicPlatforms(data.platforms);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#030305] text-white">
      <SignalBackdrop />
      <FrameOverlay data={data} />
      <TopBar data={data} />

      <main>
        <Hero data={data} platforms={publicPlatforms} accounts={data.accounts} />
        <ActivityStrip data={data} />
        {publicPlatforms.length > 0 ? <DataSection data={data} platforms={publicPlatforms} /> : null}
        {data.accounts.length > 0 ? <AccountsSection accounts={data.accounts} /> : null}
        <EventsSection data={data} />
        <CasesSection cases={data.cases} />
        <ContactSection />
      </main>

      {showOpsPanel ? (
        <div className="fixed inset-4 z-50 overflow-auto rounded-2xl border border-white/10 bg-[#030305]/95 p-5 shadow-2xl shadow-black backdrop-blur-2xl">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase text-white/35">admin</p>
              <h2 className="text-xl font-semibold text-white">Conexoes e sync</h2>
            </div>
            <a href="/" className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
              fechar
            </a>
          </div>
          <ConnectionsPanel />
        </div>
      ) : null}
    </div>
  );
}
