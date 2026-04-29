import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
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

function formatElapsed(seconds: number) {
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
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

function MiniSparkline({ values, color = "#ef4444" }: { values: number[]; color?: string }) {
  const source = values.length > 1 ? values : [values[0] ?? 0, values[0] ?? 0];
  const max = Math.max(...source, 1);
  const min = Math.min(...source);
  const range = Math.max(max - min, 1);
  const points = source
    .map((value, index) => {
      const x = (index / (source.length - 1)) * 100;
      const y = 34 - ((value - min) / range) * 28;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="h-12 w-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={`0,40 ${points} 100,40`} fill={color} opacity="0.08" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SignalBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#030305]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_12%_8%,rgba(239,68,68,0.18),transparent_34%),radial-gradient(ellipse_at_78%_18%,rgba(255,255,255,0.06),transparent_30%),linear-gradient(145deg,#030305_0%,#09080b_48%,#050506_100%)]" />
      <motion.div
        className="absolute -left-[16%] top-[8%] h-[34rem] w-[52rem] rounded-[999px] bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.16),rgba(239,68,68,0.045)_42%,transparent_72%)] blur-[90px] mix-blend-screen"
        animate={{ opacity: [0.28, 0.52, 0.28], x: [0, 34, 0], y: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-20%] top-[24%] h-[38rem] w-[58rem] rounded-[999px] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.075),rgba(239,68,68,0.035)_48%,transparent_74%)] blur-[110px] mix-blend-screen"
        animate={{ opacity: [0.18, 0.38, 0.18], x: [0, -28, 0], y: [0, -24, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-24%] left-[18%] h-[36rem] w-[62rem] rounded-[999px] bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.11),rgba(255,255,255,0.028)_44%,transparent_72%)] blur-[120px] mix-blend-screen"
        animate={{ opacity: [0.2, 0.42, 0.2], x: [0, -26, 0], y: [0, -18, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
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

function BrandMark({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <span className={`overflow-hidden rounded-xl border border-white/12 bg-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.28)] ${className}`}>
      <img
        src="/favicon/favicon-96x96.png"
        alt="JF Portfolio"
        className="h-full w-full object-cover"
        loading="eager"
      />
    </span>
  );
}

function FrameOverlay({ data }: { data: DashboardPayload & { secondsSinceUpdate: number } }) {
  return (
    <div className="pointer-events-none fixed inset-3 z-40 hidden lg:block">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-red-400/60 via-white/12 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/12 to-red-400/60" />
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-red-400/45 via-white/10 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-red-400/45" />
      <div className="absolute left-4 top-3 text-[10px] uppercase text-white/35">JF portfolio</div>
      <div className="absolute right-4 top-3 text-[10px] uppercase text-white/35">atualizado {data.secondsSinceUpdate}s</div>
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
  const publicPlatforms = getPublicPlatforms(data.platforms);
  const leadingPlatform = [...publicPlatforms].sort((a, b) => b.views - a.views)[0];

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-30 border-b border-white/12 bg-[#030305]/88 backdrop-blur-2xl"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-stretch px-4 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)_auto] lg:px-8">
        <a href="#inicio" className="flex min-h-16 items-center gap-3 border-r border-white/10 pr-5">
          <BrandMark className="h-10 w-10 shrink-0 rounded-2xl" />
          <div>
            <p className="text-lg font-black leading-none text-white">JF Portfolio</p>
            <p className="mt-1 text-[10px] uppercase text-white/38">social reach board</p>
          </div>
        </a>

        <nav className="hidden min-h-16 items-center lg:grid lg:grid-cols-6">
          <CommandLink href="#dados" label="Alcance" index="01" />
          <CommandLink href="#contas" label="Canais" index="02" />
          <CommandLink href="#atividade" label="Updates" index="03" />
          {data.cases.length > 0 ? <CommandLink href="#cases" label="Cases" index="04" /> : <CommandLink href="/terms" label="Termos" index="04" />}
          <CommandLink href="/privacy" label="Privacy" index="05" />
          <div className="border-l border-white/10 px-4 py-3">
            <p className="text-[9px] uppercase text-white/30">dominante</p>
            <p className="mt-1 truncate text-xs font-semibold text-white/68">{leadingPlatform?.platform ?? "ativo"}</p>
          </div>
        </nav>

        <div className="grid min-h-16 grid-cols-[auto_auto] items-stretch border-l border-white/10">
          <div className="hidden min-w-36 px-4 py-3 sm:block">
            <p className="text-[9px] uppercase text-white/30">sync</p>
            <span className="mt-1 flex items-center gap-2 text-xs font-semibold text-white/68">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping bg-red-300 opacity-45" />
                <span className="relative inline-flex h-2 w-2 bg-red-300" />
              </span>
              {formatElapsed(data.secondsSinceUpdate)}
            </span>
          </div>
          <a
            href="#contato"
            className="inline-flex min-h-16 items-center gap-2 bg-white px-4 text-sm font-semibold text-[#030305] transition-transform hover:translate-x-1 sm:px-5"
          >
            <MessageCircle className="h-4 w-4" />
            Fale comigo
          </a>
        </div>
      </div>
    </motion.header>
  );
}

function CommandLink({ href, label, index }: { href: string; label: string; index: string }) {
  return (
    <a className="border-l border-white/10 px-4 py-3 transition-colors hover:bg-white/[0.035]" href={href}>
      <p className="text-[9px] uppercase text-white/28">{index}</p>
      <p className="mt-1 text-xs font-semibold text-white/62">{label}</p>
    </a>
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
  const performanceLine =
    data.summary.deltaPercentage !== 0
      ? `${deltaLabel} em ${data.summary.activeWindowLabel}`
      : `${data.summary.accountsCovered} contas ativas com ${formatPercentage(data.health.coverageRatio * 100)} de cobertura`;
  const chartValues = data.chart.map((point) => point.total);

  return (
    <section id="inicio" className="relative mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-14">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.11),rgba(255,255,255,0.035)_42%,rgba(239,68,68,0.08))] p-px shadow-2xl shadow-black/30"
      >
        <div className="relative min-h-[550px] overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_18%_88%,rgba(239,68,68,0.14),transparent_34%),linear-gradient(145deg,rgba(7,7,9,0.95),rgba(7,7,9,0.86))] p-5 backdrop-blur-2xl sm:p-7">
          <div className="absolute right-4 top-0 select-none text-[8rem] font-black leading-none text-white/[0.028] sm:text-[12rem] lg:text-[15rem]">
            JF
          </div>
          <div className="absolute left-7 top-0 h-px w-2/3 bg-gradient-to-r from-red-400 via-white/25 to-transparent" />
          <div className="absolute bottom-0 right-8 h-32 w-px bg-gradient-to-b from-transparent via-red-400/70 to-transparent" />

          <div className="relative flex min-h-[500px] flex-col justify-between">
            <div>
              <div className="mb-9 inline-flex items-center gap-2 rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1.5 text-xs uppercase text-red-100">
                <Satellite className="h-3.5 w-3.5" />
                portfolio de alcance
              </div>

              <p className="mb-4 text-sm uppercase text-white/42">views totais registradas</p>
              <h1 className="max-w-5xl text-5xl font-black leading-none text-white sm:text-6xl lg:text-7xl">
                <LiveCounter value={data.summary.viewsTotal} duration={1.8} />
              </h1>
              <p className="mt-4 max-w-2xl text-xl font-medium text-white/82 sm:text-2xl">
                views registradas em contas conectadas.
              </p>
              <div className="mt-5 max-w-xl rounded-2xl bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <div className="mb-3 flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-white">{performanceLine}</span>
                  <span className="shrink-0 text-white/42">{data.summary.activeWindowLabel}</span>
                </div>
                <MiniSparkline values={chartValues} color={leadingPlatform?.color ?? "#ef4444"} />
              </div>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/52">
                Um portfolio comercial de canais e conteudos medido por dados reais. Cada atualizacao mostra o alcance ativo das contas conectadas.
              </p>
            </div>

            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              <SignalStat label="periodo analisado" value={data.summary.activeWindowLabel} />
              {data.summary.deltaPercentage !== 0 ? <SignalStat label="variacao" value={deltaLabel} /> : null}
              <SignalStat label="atualizado ha" value={formatElapsed(data.secondsSinceUpdate)} />
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
              <p className="text-sm uppercase text-white/38">canal dominante</p>
              <p className="mt-3 text-5xl font-black leading-none text-white sm:text-6xl">
                {leadingPlatform?.platform ?? "Ativo"}
              </p>
              <p className="mt-3 text-sm leading-6 text-white/50">
                {leadingPlatform
                  ? `${formatPercentage(platformShare)} do alcance atual vem de ${leadingPlatform.accountsCovered}/${leadingPlatform.accountsTotal} contas conectadas.`
                  : "O alcance aparece quando uma plataforma conectada envia dados."}
              </p>
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-xs text-white/42">
                  <span>peso no alcance total</span>
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
              <SignalStat label="contas ativas" value={`${leadingPlatform?.accountsCovered ?? data.summary.accountsCovered}/${leadingPlatform?.accountsTotal ?? data.summary.accountsTotal}`} />
              <SignalStat label="cobertura" value={formatPercentage(data.health.coverageRatio * 100)} />
            </div>
            {leadingAccounts.slice(0, 2).map((account, index) => (
              <AccountSignal key={account.id} account={account} total={data.summary.viewsTotal} isPrimary={index === 0} />
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

function AccountSignal({ account, total, isPrimary = false }: { account: AccountCardData; total: number; isPrimary?: boolean }) {
  const share = getShare(account.views, total);

  return (
    <div className={`rounded-2xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${isPrimary ? "bg-red-500/[0.11]" : "bg-white/[0.045]"}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{account.displayName}</p>
          <p className="truncate text-xs text-white/42">{account.handle}</p>
        </div>
        <p className={`shrink-0 text-sm font-semibold ${isPrimary ? "text-red-100" : "text-white/55"}`}>{formatPercentage(share)}</p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
        <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: account.color }} />
      </div>
    </div>
  );
}

function ReachSurface({
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
  const chartValues = data.chart.map((point) => point.total);
  const leadingAccount = [...accounts].sort((a, b) => b.views - a.views)[0];
  const railAccounts = leadingAccounts.length > 0 ? leadingAccounts : accounts;

  return (
    <section id="inicio" className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden border-x border-y border-white/12 bg-[linear-gradient(120deg,rgba(255,255,255,0.06),rgba(255,255,255,0.018)_38%,rgba(239,68,68,0.07))] px-4 py-5 shadow-[0_32px_110px_rgba(0,0,0,0.38)] sm:px-6 lg:px-8"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-red-400/70 via-white/18 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/16 to-red-400/55" />
        <div className="absolute left-0 top-0 h-9 w-16 border-b border-r border-red-300/40 bg-red-500/[0.035]" />
        <div className="absolute bottom-0 right-0 h-9 w-16 border-l border-t border-red-300/40 bg-red-500/[0.035]" />
        <div className="absolute -right-10 top-[-2rem] select-none text-[10rem] font-black leading-none text-white/[0.02] sm:text-[15rem] lg:text-[21rem]">
          JF
        </div>
        <div className="absolute left-0 top-0 h-28 w-px bg-gradient-to-b from-red-300/70 to-transparent" />
        <div className="absolute bottom-0 right-0 h-28 w-px bg-gradient-to-t from-red-300/55 to-transparent" />

        <div className="relative grid grid-cols-2 gap-3 border-b border-white/10 pb-4 text-[10px] uppercase text-white/38 sm:grid-cols-4">
          <span>main reach board</span>
          <span>{data.summary.activeWindowLabel}</span>
          <span>{leadingPlatform?.platform ?? "canal"} dominante</span>
          <span className="sm:text-right">update {formatElapsed(data.secondsSinceUpdate)}</span>
        </div>

        <div className="relative grid gap-8 py-10 lg:grid-cols-[minmax(0,1.32fr)_minmax(300px,0.68fr)] lg:items-stretch">
          <div className="min-w-0">
            <div className="mb-5 flex items-center gap-3 text-xs uppercase text-red-100/75">
              <span className="h-px w-14 bg-red-400/70" />
              <Satellite className="h-3.5 w-3.5" />
              <span>alcance social em producao</span>
            </div>
            <p className="mb-4 text-sm uppercase text-white/40">views totais registradas</p>
            <h1 className="max-w-full text-5xl font-black leading-[0.82] text-white tabular-nums sm:text-7xl lg:text-[7.75rem] xl:text-[8.5rem]">
              <LiveCounter value={data.summary.viewsTotal} duration={1.8} />
            </h1>
            <div className="mt-7 max-w-3xl border-l-2 border-red-300/55 pl-5">
              <p className="text-xl font-medium text-white/82 sm:text-2xl">Alcance real consolidado em contas conectadas.</p>
              <p className="mt-3 max-w-xl text-base leading-7 text-white/52">
                Leitura publica de distribuicao, dominancia e atualizacoes reais dos canais sociais.
              </p>
            </div>
          </div>

          <div className="relative grid min-w-0 content-between gap-5 border-l-2 border-red-300/28 bg-black/[0.12] pl-6">
            <div className="absolute -left-px bottom-[-2.5rem] h-12 w-px bg-red-300/70" />
            <BoardMetric label="canal dominante" value={leadingPlatform?.platform ?? "em atualizacao"} detail={`${formatPercentage(platformShare)} do alcance atual`} />
            <BoardMetric label="contas ativas" value={`${data.summary.accountsCovered}/${data.summary.accountsTotal}`} detail={`${formatPercentage(data.health.coverageRatio * 100)} de cobertura`} />
            <BoardMetric label="atualizado ha" value={formatElapsed(data.secondsSinceUpdate)} detail={data.summary.activeWindowLabel} />
            <BoardMetric label="maior conta" value={leadingAccount?.displayName ?? "em atualizacao"} detail={leadingAccount ? `${formatPercentage(getShare(leadingAccount.views, data.summary.viewsTotal))} do total` : "aguardando dados"} />
          </div>
        </div>

        <div className="relative grid gap-8 border-t-2 border-white/12 pt-7 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <div className="mb-3 flex items-center justify-between text-xs uppercase text-white/38">
              <span>curva de alcance</span>
              <span>{data.summary.activeWindowLabel}</span>
            </div>
            <MiniSparkline values={chartValues} color={leadingPlatform?.color ?? "#ef4444"} />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between text-xs uppercase text-white/38">
              <span>dominance rail</span>
              <span>{leadingPlatform?.platform ?? "ativo"}</span>
            </div>
            <div className="grid gap-3">
              {leadingAccounts.slice(0, 3).map((account, index) => (
                <AccountLine key={account.id} account={account} total={data.summary.viewsTotal} index={index} />
              ))}
            </div>
          </div>
        </div>

        <div className="relative mt-7 h-6 overflow-hidden bg-white/[0.055]">
          <div className="flex h-full">
            {railAccounts.length > 0 ? (
              railAccounts.map((account, index) => {
                const width = getShare(account.views, data.summary.viewsTotal);
                return (
                  <motion.div
                    key={account.id}
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 1.1, delay: index * 0.08, ease: "easeOut" }}
                    className="h-full border-r border-[#030305]/70"
                    style={{ backgroundColor: account.color }}
                  />
                );
              })
            ) : (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${platformShare}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-red-600 via-red-300 to-white"
              />
            )}
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,transparent_12%,rgba(3,3,5,0.62)_12.2%,transparent_12.4%,transparent_24%,rgba(3,3,5,0.62)_24.2%,transparent_24.4%,transparent_36%,rgba(3,3,5,0.62)_36.2%,transparent_36.4%,transparent_48%,rgba(3,3,5,0.62)_48.2%,transparent_48.4%,transparent_60%,rgba(3,3,5,0.62)_60.2%,transparent_60.4%,transparent_72%,rgba(3,3,5,0.62)_72.2%,transparent_72.4%,transparent_84%,rgba(3,3,5,0.62)_84.2%,transparent_84.4%)]" />
        </div>
        <div className="relative mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[10px] uppercase text-white/38">
          {railAccounts.slice(0, 4).map((account) => (
            <span key={account.id}>{account.displayName} / {formatPercentage(getShare(account.views, data.summary.viewsTotal))}</span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function BoardMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(7rem,auto)] items-end gap-4 border-b border-white/10 pb-4">
      <div className="min-w-0">
        <p className="text-[10px] uppercase text-white/35">{label}</p>
        <p className="mt-1 truncate text-sm text-white/48">{detail}</p>
      </div>
      <p className="min-w-28 text-right text-2xl font-black text-white tabular-nums">{value}</p>
    </div>
  );
}

function AccountLine({ account, total, index }: { account: AccountCardData; total: number; index: number }) {
  const share = getShare(account.views, total);

  return (
    <div className="border-b border-white/10 pb-3">
      <div className="mb-2 grid grid-cols-[32px_minmax(0,1fr)_auto_auto] items-baseline gap-3">
        <p className="text-xs text-white/35">{String(index + 1).padStart(2, "0")}</p>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{account.displayName}</p>
          <p className="truncate text-xs text-white/38">{account.handle}</p>
        </div>
        <p className="hidden text-xs text-white/35 sm:block">{formatCompact(account.views)}</p>
        <p className="text-sm font-semibold text-white">{formatPercentage(share)}</p>
      </div>
      <div className="ml-11 h-2 overflow-hidden bg-white/8">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${share}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full"
          style={{ backgroundColor: account.color }}
        />
      </div>
    </div>
  );
}

function MarketTape({ data, viewsDelta }: { data: DashboardPayload & { secondsSinceUpdate: number }; viewsDelta: number }) {
  const publicPlatforms = getPublicPlatforms(data.platforms);
  const leadingPlatform = [...publicPlatforms].sort((a, b) => b.views - a.views)[0];
  const leadingAccount = [...data.accounts].sort((a, b) => b.views - a.views)[0];
  const items = [
    { label: "alcance", value: viewsDelta > 0 ? `+${formatFull(viewsDelta)} views nesta atualizacao` : `${formatCompact(data.summary.viewsTotal)} views consolidadas` },
    { label: "dominancia", value: `${leadingPlatform?.platform ?? "canal"} dominante` },
    { label: "lider", value: leadingAccount ? `${leadingAccount.displayName} maior conta` : "contas em atualizacao" },
    { label: "canais", value: `${data.summary.accountsCovered}/${data.summary.accountsTotal} contas ativas` },
    { label: "cobertura", value: `${formatPercentage(data.health.coverageRatio * 100)} cobertura` },
    { label: "sync", value: `atualizado ha ${formatElapsed(data.secondsSinceUpdate)}` },
  ];
  const loop = [...items, ...items];

  return (
    <section className="overflow-hidden border-y border-white/10 bg-[#050506]/86">
      <div className="h-px bg-gradient-to-r from-red-400/55 via-white/12 to-transparent" />
      <motion.div
        className="flex h-12 w-max items-center whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
      >
        {loop.map((item, index) => (
          <div key={`${item.label}-${item.value}-${index}`} className="flex h-full items-center border-r border-white/10 px-5 text-sm font-semibold text-white/74">
            <span className="mr-3 text-[10px] uppercase text-red-100/42">{item.label}</span>
            <span>{item.value}</span>
            <span className="ml-5 text-white/20">//</span>
          </div>
        ))}
      </motion.div>
      <div className="h-px bg-gradient-to-r from-transparent via-white/12 to-red-400/45" />
    </section>
  );
}

function ActivityStrip({ data, viewsDelta }: { data: DashboardPayload & { secondsSinceUpdate: number }; viewsDelta: number }) {
  const publicPlatforms = getPublicPlatforms(data.platforms);
  const leadingPlatform = [...publicPlatforms].sort((a, b) => b.views - a.views)[0];
  const leadingAccount = [...data.accounts].sort((a, b) => b.views - a.views)[0];

  return (
    <section className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
      <div className="grid gap-3 rounded-[1.5rem] bg-white/[0.055] p-3 shadow-2xl shadow-black/20 backdrop-blur-2xl md:grid-cols-5">
        <LivePill
          icon={<Activity className="h-4 w-4" />}
          label={viewsDelta > 0 ? "views nesta atualizacao" : "alcance consolidado"}
          value={viewsDelta > 0 ? `+${formatFull(viewsDelta)} views` : `${formatCompact(data.summary.viewsTotal)} views`}
          accent="#ef4444"
        />
        <LivePill label="canal dominante" value={leadingPlatform?.platform ?? "em atualizacao"} accent={leadingPlatform?.color ?? "#f87171"} />
        <LivePill label="maior conta" value={leadingAccount?.displayName ?? "em atualizacao"} accent={leadingAccount?.color ?? "#ffffff"} />
        <LivePill icon={<Clock3 className="h-4 w-4" />} label="atualizado ha" value={formatElapsed(data.secondsSinceUpdate)} accent="#f87171" />
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
  const leadingPlatform = [...platforms].sort((a, b) => b.views - a.views)[0];
  const leadingShare = getShare(leadingPlatform?.views ?? 0, data.summary.viewsTotal);

  return (
    <section id="dados" className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:px-8">
      <div className="rounded-[2rem] bg-white/[0.05] p-5 shadow-2xl shadow-black/20 backdrop-blur-2xl">
        <SectionTitle eyebrow="alcance por plataforma" title="Como as views estao distribuidas" />
        {leadingPlatform ? (
          <div className="mt-5 rounded-2xl bg-black/24 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <p className="text-sm text-white/48">Concentracao atual</p>
            <p className="mt-2 text-2xl font-black text-white">
              {leadingPlatform.platform} representa {formatPercentage(leadingShare)} do alcance atual
            </p>
          </div>
        ) : null}
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

function AllocationLines({ data, platforms }: { data: DashboardPayload; platforms: PlatformCardData[] }) {
  const leadingPlatform = [...platforms].sort((a, b) => b.views - a.views)[0];
  const leadingShare = getShare(leadingPlatform?.views ?? 0, data.summary.viewsTotal);

  return (
    <section id="dados" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden border-y border-white/12 bg-white/[0.018] px-4 py-5 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-red-400/60 via-white/14 to-transparent" />
        <div className="absolute -right-6 top-[-2rem] select-none text-[8rem] font-black leading-none text-white/[0.018] sm:text-[13rem]">
          {formatPercentage(leadingShare)}
        </div>

        <div className="relative grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
          <div>
            <p className="text-xs uppercase text-white/35">platform concentration board</p>
            <p className="mt-4 text-7xl font-black leading-none text-white sm:text-8xl lg:text-[8.5rem]">
              {formatPercentage(leadingShare)}
            </p>
            <p className="mt-3 max-w-md text-xl font-semibold text-white/74">
              {leadingPlatform?.platform ?? "Plataforma ativa"} concentra o alcance publico atual.
            </p>
          </div>

          <div className="grid gap-5">
            <div className="grid gap-4 border-l-2 border-red-300/30 pl-5 sm:grid-cols-3">
              <ConcentrationMetric label="views consolidadas" value={formatCompact(data.summary.viewsTotal)} />
              <ConcentrationMetric label="contas cobertas" value={`${leadingPlatform?.accountsCovered ?? data.summary.accountsCovered}/${leadingPlatform?.accountsTotal ?? data.summary.accountsTotal}`} />
              <ConcentrationMetric label="estado" value={formatPublicStatus(leadingPlatform?.status ?? "connected")} />
            </div>

            <div className="grid gap-4">
              {platforms.map((platform, index) => (
                <AllocationLine key={platform.id} platform={platform} total={data.summary.viewsTotal} index={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AllocationLine({ platform, total, index }: { platform: PlatformCardData; total: number; index: number }) {
  const share = getShare(platform.views, total);

  return (
    <div className="grid gap-3 border-b border-white/12 pb-4 lg:grid-cols-[44px_0.72fr_1fr_120px] lg:items-center">
      <p className="text-xs font-semibold text-white/35">{String(index + 1).padStart(2, "0")}</p>
      <div>
        <p className="text-2xl font-black text-white">{platform.platform}</p>
        <p className="mt-1 text-sm text-white/42">{platform.accountsCovered}/{platform.accountsTotal} contas com dados ativos</p>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between text-xs uppercase text-white/38">
          <span>{formatCompact(platform.views)} views</span>
          <span>{formatPublicStatus(platform.status)}</span>
        </div>
        <div className="h-5 overflow-hidden bg-white/8">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${share}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full"
            style={{ backgroundColor: platform.color }}
          />
        </div>
      </div>
      <p className="text-right text-3xl font-black text-white">{formatPercentage(share)}</p>
    </div>
  );
}

function ConcentrationMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-white/10 pb-3">
      <p className="text-[10px] uppercase text-white/35">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
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
          <p className="text-xs text-white/42">{platform.accountsCovered}/{platform.accountsTotal} contas com dados ativos</p>
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
  const hasMoreHistory = data.chart.length > 1;
  const currentTotal = data.summary.viewsTotal;
  const initialTotal = point?.total ?? currentTotal;
  const absoluteGrowth = currentTotal - initialTotal;

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-white/[0.05] p-5 shadow-2xl shadow-black/25 backdrop-blur-2xl">
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-red-300/60 to-transparent" />
      <div className="flex min-h-[360px] flex-col justify-between">
        <div>
          <SectionTitle eyebrow={data.summary.activeWindowLabel} title="Primeiro snapshot registrado" />
          <p className="mt-4 max-w-md text-sm leading-6 text-white/48">
            {hasMoreHistory
              ? "A evolucao acompanha os novos pontos registrados na janela atual."
              : "Historico iniciado recentemente. Novos pontos serao adicionados conforme as proximas atualizacoes forem registradas."}
          </p>
        </div>

        <div>
          <div className="mb-5 grid grid-cols-[auto_1fr_auto] items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-500/12 text-red-200">
              <Clock3 className="h-5 w-5" />
            </div>
            <div className="h-px bg-gradient-to-r from-red-400/70 via-white/20 to-transparent" />
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.055] text-white/60">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-black/24 p-4">
              <p className="text-xs text-white/42">inicio</p>
              <p className="text-sm text-white/45">{point?.label ?? data.summary.activeWindowLabel}</p>
              <p className="mt-2 text-2xl font-black text-white">{formatCompact(initialTotal)}</p>
            </div>
            <div className="rounded-2xl bg-black/24 p-4">
              <p className="text-xs text-white/42">atual</p>
              <p className="mt-6 text-2xl font-black text-white">{formatCompact(currentTotal)}</p>
            </div>
            <div className="rounded-2xl bg-black/24 p-4">
              <p className="text-xs text-white/42">crescimento</p>
              <p className="mt-6 text-2xl font-black text-white">{absoluteGrowth > 0 ? `+${formatCompact(absoluteGrowth)}` : "em formacao"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountsSection({ accounts }: { accounts: AccountCardData[] }) {
  const totalViews = accounts.reduce((sum, account) => sum + account.views, 0);

  return (
    <section id="contas" className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <SectionTitle eyebrow="canais em destaque" title={`${accounts.length} contas com dados ativos`} />
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {accounts.map((account, index) => (
          <AccountCard key={account.id} account={account} index={index} totalViews={totalViews} />
        ))}
      </div>
    </section>
  );
}

function ChannelRows({ accounts }: { accounts: AccountCardData[] }) {
  const totalViews = accounts.reduce((sum, account) => sum + account.views, 0);

  return (
    <section id="contas" className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
      <div className="mb-6 grid gap-4 border-b border-white/10 pb-5 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
        <SectionTitle eyebrow="channel strips" title={`${accounts.length} contas com dados ativos`} />
        <p className="max-w-2xl text-sm leading-6 text-white/48 lg:justify-self-end lg:text-right">
          Cada linha mostra contribuicao real no alcance total, origem da atualizacao e peso relativo entre contas conectadas.
        </p>
      </div>

      <div className="border-t border-white/10">
        <div className="hidden grid-cols-[56px_minmax(0,1fr)_0.7fr_1fr_150px] border-b border-white/10 py-3 text-[10px] uppercase text-white/32 lg:grid">
          <span>idx</span>
          <span>canal</span>
          <span>origem</span>
          <span>participacao</span>
          <span className="text-right">views</span>
        </div>
        {accounts.map((account, index) => (
          <ChannelRow key={account.id} account={account} index={index} totalViews={totalViews} />
        ))}
      </div>
    </section>
  );
}

function ChannelRow({ account, index, totalViews }: { account: AccountCardData; index: number; totalViews: number }) {
  const share = getShare(account.views, totalViews);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="group relative grid gap-4 border-b border-white/10 bg-white/[0.014] px-0 py-5 transition-colors hover:bg-white/[0.035] lg:grid-cols-[56px_minmax(0,1fr)_0.7fr_1fr_150px] lg:items-center"
    >
      <span className="absolute inset-y-0 left-0 w-px opacity-80" style={{ backgroundColor: account.color }} />
      <p className="pl-3 text-xs font-semibold text-white/35 lg:pl-0">{String(index + 1).padStart(2, "0")}</p>
      <div className="min-w-0">
        <p className="truncate text-3xl font-black text-white">{account.displayName}</p>
        <p className="mt-1 truncate text-sm text-white/42">{account.handle} / {account.platform}</p>
      </div>
      <p className="text-sm text-white/42">{formatPublicCoverageLabel(account.coverageLabel, account.platform)}</p>
      <div>
        <div className="mb-2 flex items-center justify-between text-xs uppercase text-white/38">
          <span>peso relativo</span>
          <span>{formatPercentage(share)}</span>
        </div>
        <div className="h-3 overflow-hidden bg-white/8">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${share}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full"
            style={{ backgroundColor: account.color }}
          />
        </div>
      </div>
      <div className="text-left lg:text-right">
        <p className="text-3xl font-black text-white">{formatCompact(account.views)}</p>
        <p className="mt-1 text-sm text-white/42">{formatFull(account.views)}</p>
      </div>
    </motion.div>
  );
}

function AccountCard({ account, index, totalViews }: { account: AccountCardData; index: number; totalViews: number }) {
  const share = getShare(account.views, totalViews);
  const isPrimary = index === 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.05 }}
      className={`group relative overflow-hidden rounded-[2rem] p-5 shadow-2xl shadow-black/20 backdrop-blur-2xl ${
        isPrimary
          ? "bg-[linear-gradient(140deg,rgba(239,68,68,0.15),rgba(255,255,255,0.06)_48%,rgba(255,255,255,0.035))]"
          : "bg-[linear-gradient(140deg,rgba(255,255,255,0.08),rgba(255,255,255,0.035)_54%,rgba(239,68,68,0.08))]"
      }`}
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
            {isPrimary ? "maior alcance" : account.platform}
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
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs text-white/42">
              <span>participacao entre contas</span>
              <span>{formatPercentage(share)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/8">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${share}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: account.color }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function EventsSection({ data }: { data: DashboardPayload & { secondsSinceUpdate: number } }) {
  if (data.events.length === 0) return null;
  const visibleEvents = data.events.slice(0, 5);
  const activeAccounts = new Set(
    visibleEvents
      .map((event) => event.accountName ?? event.text.split(" atualizado")[0].split(" sincronizado")[0].trim())
      .filter(Boolean),
  );

  return (
    <section id="atividade" className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.58fr_1.42fr] lg:px-8">
      <div className="border-y border-white/10 py-5">
        <SectionTitle eyebrow="runtime ledger" title="Movimento recente" />
        <div className="mt-7 border-t border-white/10">
          <LedgerStat label="ultima atualizacao" value={formatElapsed(data.secondsSinceUpdate)} />
          <LedgerStat label="eventos exibidos" value={String(visibleEvents.length)} />
          <LedgerStat label="contas com atividade" value={String(activeAccounts.size)} />
          <div className="flex items-center gap-3 border-b border-white/10 py-4 text-sm text-white/50">
            <Clock3 className="h-4 w-4 text-red-300" />
            <span>log alimentado por snapshots reais</span>
          </div>
        </div>
      </div>

      <div className="relative border-y border-white/10">
        <div className="hidden grid-cols-[42px_minmax(0,1fr)_130px_110px_90px] border-b border-white/10 py-3 text-[10px] uppercase text-white/32 lg:grid">
          <span>seq</span>
          <span>evento</span>
          <span>views</span>
          <span>ganho</span>
          <span>var</span>
        </div>
        {visibleEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 + index * 0.04 }}
            className={`relative grid gap-3 border-b border-white/10 py-4 lg:grid-cols-[42px_minmax(0,1fr)_130px_110px_90px] lg:items-end ${
              index === 0 ? "bg-red-500/[0.075]" : "bg-white/[0.012]"
            }`}
          >
            <div className="flex items-center gap-3 text-xs font-semibold text-white/35">
              <span className="h-2 w-2" style={{ backgroundColor: event.color }} />
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{formatPublicEventText(event.text, event.platform)}</p>
              <p className="mt-1 text-xs text-white/42">{event.platform} / {formatClock(event.createdAt)}</p>
            </div>
            <EventMetric label="views no update" value={typeof event.viewsTotal === "number" ? formatCompact(event.viewsTotal) : "--"} />
            <EventMetric label="ganho" value={typeof event.viewsDelta === "number" ? `+${formatCompact(event.viewsDelta)}` : "--"} />
            <EventMetric label="variacao" value={typeof event.deltaPercentage === "number" ? `${event.deltaPercentage}%` : "--"} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function LedgerStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 border-b border-white/10 py-4">
      <p className="text-[10px] uppercase text-white/35">{label}</p>
      <p className="text-xl font-black text-white">{value}</p>
    </div>
  );
}

function EventMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase text-white/32">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-white/82">{value}</p>
    </div>
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
    <section id="contato" className="mx-auto max-w-7xl px-4 py-8 pb-12 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden border-y border-white/10 bg-[linear-gradient(115deg,rgba(255,255,255,0.045),rgba(239,68,68,0.055)_52%,rgba(255,255,255,0.018))] px-5 py-6 shadow-[0_28px_90px_rgba(0,0,0,0.28)]">
        <div className="absolute right-3 top-[-1rem] select-none text-8xl font-black leading-none text-white/[0.026] sm:text-[10rem]">JF</div>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-red-400/65 via-white/14 to-transparent" />
        <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase text-white/38">commercial endpoint</p>
            <h2 className="mt-2 max-w-3xl text-3xl font-black text-white sm:text-4xl">Quer transformar alcance em presenca comercial?</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/52">
              Dados reais, canais conectados e acompanhamento continuo para mostrar o que esta acontecendo nas redes.
            </p>
          </div>
          <a
            href="#inicio"
            className="inline-flex items-center justify-center border border-white/14 bg-white px-5 py-3 text-sm font-semibold text-[#030305] transition-transform hover:translate-x-1"
          >
            Fale comigo
          </a>
        </div>
        <div className="relative mt-6 flex flex-wrap gap-4 border-t border-white/10 pt-4 text-sm font-medium text-white/45">
          <a className="transition-colors hover:text-white" href="/terms">Termos de Servico</a>
          <a className="transition-colors hover:text-white" href="/privacy">Politica de Privacidade</a>
          <span>Dados reais, atualizados em producao</span>
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

function LegalTopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#030305]/86 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <a href="/" className="flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="text-sm font-semibold leading-tight text-white">JF Portfolio</p>
            <p className="text-xs text-white/45">alcance real em redes sociais</p>
          </div>
        </a>
        <nav className="flex items-center gap-4 text-sm text-white/58">
          <a className="transition-colors hover:text-white" href="/terms">Termos</a>
          <a className="transition-colors hover:text-white" href="/privacy">Privacidade</a>
        </nav>
      </div>
    </header>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-white/62">{children}</div>
    </section>
  );
}

function TermsContent() {
  return (
    <>
      <LegalSection title="Aplicacao destes termos ao JFclipes">
        <p>
          Estes Termos de Servico se aplicam ao aplicativo JFclipes e ao site publico JF Portfolio,
          disponivel em <a className="text-white underline" href="/">jfclipes.pro</a>.
        </p>
      </LegalSection>

      <LegalSection title="1. Sobre o JF Portfolio">
        <p>
          O JF Portfolio e uma vitrine publica de alcance em redes sociais. O site apresenta metricas,
          contas conectadas, atualizacoes e historico de visualizacoes de canais autorizados.
        </p>
      </LegalSection>

      <LegalSection title="2. Uso do site">
        <p>
          Voce pode acessar o site para visualizar informacoes publicas de portfolio, resultados e dados
          agregados exibidos na pagina. Voce nao deve tentar acessar areas administrativas, interferir no
          funcionamento do servico, copiar dados de forma automatizada sem autorizacao ou usar o site para
          qualquer finalidade ilegal.
        </p>
      </LegalSection>

      <LegalSection title="3. Dados e integracoes">
        <p>
          Algumas informacoes exibidas podem vir de integracoes autorizadas com plataformas de terceiros,
          incluindo servicos de redes sociais e video. O acesso a esses dados depende das permissoes
          concedidas pelos titulares das contas e das regras das plataformas correspondentes.
        </p>
      </LegalSection>

      <LegalSection title="4. Disponibilidade e precisao">
        <p>
          As metricas podem mudar conforme novas atualizacoes sao registradas, conexoes sao renovadas ou
          plataformas de terceiros processam dados. O JF Portfolio busca apresentar informacoes corretas,
          mas nao garante disponibilidade ininterrupta nem ausencia total de atrasos ou inconsistencias.
        </p>
      </LegalSection>

      <LegalSection title="5. Propriedade intelectual">
        <p>
          A interface, organizacao visual, textos, identidade e apresentacao do JF Portfolio pertencem aos
          seus respectivos titulares. Marcas, nomes de plataformas e conteudos de terceiros pertencem aos
          seus proprietarios.
        </p>
      </LegalSection>

      <LegalSection title="6. Alteracoes destes termos">
        <p>
          Estes termos podem ser atualizados para refletir mudancas no site, nas integracoes ou em requisitos
          legais. A versao publicada nesta pagina e a versao vigente.
        </p>
      </LegalSection>

      <LegalSection title="7. Contato">
        <p>
          Para duvidas sobre estes termos, acesse a pagina inicial em <a className="text-white underline" href="/">jfclipes.pro</a> e utilize o canal de contato disponivel.
        </p>
      </LegalSection>
    </>
  );
}

function PrivacyContent() {
  return (
    <>
      <LegalSection title="Aplicacao desta politica ao JFclipes">
        <p>
          Esta Politica de Privacidade descreve como o aplicativo JFclipes e o site publico JF Portfolio,
          disponivel em <a className="text-white underline" href="/">jfclipes.pro</a>, processam informacoes.
        </p>
      </LegalSection>

      <LegalSection title="1. Informacoes que coletamos">
        <p>
          O JF Portfolio pode processar dados necessarios para exibir metricas de contas autorizadas, como
          nome do canal ou conta, identificador publico, plataforma, total de visualizacoes, horarios de
          atualizacao e eventos de sincronizacao.
        </p>
        <p>
          Tambem podemos processar informacoes tecnicas basicas do acesso ao site, como endereco IP,
          navegador, dispositivo, registros de erro e dados de seguranca, quando esses dados forem gerados
          pela infraestrutura de hospedagem ou pelo backend.
        </p>
      </LegalSection>

      <LegalSection title="2. Como usamos as informacoes">
        <p>
          Usamos as informacoes para exibir o portfolio publico, atualizar metricas, manter integracoes com
          plataformas autorizadas, proteger o servico, diagnosticar problemas tecnicos e melhorar a
          experiencia da pagina.
        </p>
      </LegalSection>

      <LegalSection title="3. Integracoes com terceiros">
        <p>
          O site pode usar APIs e autenticacao de plataformas de terceiros para contas autorizadas. Essas
          plataformas podem ter suas proprias politicas de privacidade, termos e controles de permissao.
          O titular da conta pode revogar permissoes diretamente na plataforma correspondente quando
          disponivel.
        </p>
      </LegalSection>

      <LegalSection title="4. Compartilhamento">
        <p>
          Nao vendemos dados pessoais. Podemos compartilhar dados apenas quando necessario para operar a
          hospedagem, banco de dados, autenticacao, integracoes autorizadas, seguranca do servico ou quando
          exigido por lei.
        </p>
      </LegalSection>

      <LegalSection title="5. Retencao e exclusao">
        <p>
          Mantemos dados pelo tempo necessario para operar o portfolio, cumprir requisitos tecnicos,
          preservar historico autorizado ou atender obrigacoes legais. Solicitacoes de remocao ou revisao de
          dados podem ser feitas pelo canal de contato disponivel na pagina inicial.
        </p>
      </LegalSection>

      <LegalSection title="6. Seguranca">
        <p>
          Aplicamos medidas tecnicas razoaveis para proteger as informacoes processadas pelo site. Nenhum
          metodo de transmissao ou armazenamento e totalmente infalivel, mas buscamos reduzir riscos de
          acesso nao autorizado, perda ou uso indevido.
        </p>
      </LegalSection>

      <LegalSection title="7. Seus direitos">
        <p>
          Dependendo da sua localizacao, voce pode ter direitos de acesso, correcao, exclusao, portabilidade
          ou oposicao ao tratamento de dados. Para exercer esses direitos, utilize o canal de contato na
          pagina inicial.
        </p>
      </LegalSection>

      <LegalSection title="8. Contato">
        <p>
          Para perguntas sobre privacidade, acesse <a className="text-white underline" href="/">jfclipes.pro</a> e utilize o canal de contato disponivel.
        </p>
      </LegalSection>
    </>
  );
}

function LegalPage({ type }: { type: "terms" | "privacy" }) {
  const isTerms = type === "terms";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#030305] text-white">
      <SignalBackdrop />
      <LegalTopBar />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <article className="rounded-[2rem] bg-white/[0.055] p-6 shadow-2xl shadow-black/25 backdrop-blur-2xl sm:p-8">
          <p className="text-sm uppercase text-white/42">JF Portfolio</p>
          <h1 className="mt-3 text-4xl font-black text-white sm:text-5xl">
            {isTerms ? "Termos de Servico do JFclipes" : "Politica de Privacidade do JFclipes"}
          </h1>
          <p className="mt-3 text-sm text-white/48">Ultima atualizacao: 23 de abril de 2026</p>
          {isTerms ? <TermsContent /> : <PrivacyContent />}
        </article>
      </main>
    </div>
  );
}

function PortfolioApp() {
  const { data, isLoading, error } = useDashboard();
  const previousViewsTotalRef = useRef<number | null>(null);
  const previousUpdatedAtRef = useRef<string | null>(null);
  const [lastViewsDelta, setLastViewsDelta] = useState(0);
  const showOpsPanel = useMemo(() => {
    if (typeof window === "undefined") return false;
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get("admin") === "1" || window.location.hash === "#ops";
  }, []);

  useEffect(() => {
    const currentViewsTotal = data?.summary.viewsTotal;
    const currentUpdatedAt = data?.summary.lastUpdatedAt;
    if (typeof currentViewsTotal !== "number") return;

    const previousViewsTotal = previousViewsTotalRef.current;
    const previousUpdatedAt = previousUpdatedAtRef.current;
    if (previousViewsTotal !== null && currentViewsTotal > previousViewsTotal) {
      setLastViewsDelta(currentViewsTotal - previousViewsTotal);
    } else if (previousUpdatedAt !== null && currentUpdatedAt !== previousUpdatedAt) {
      setLastViewsDelta(0);
    }

    previousViewsTotalRef.current = currentViewsTotal;
    previousUpdatedAtRef.current = currentUpdatedAt ?? null;
  }, [data?.summary.viewsTotal, data?.summary.lastUpdatedAt]);

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
        <MarketTape data={data} viewsDelta={lastViewsDelta} />
        <ReachSurface data={data} platforms={publicPlatforms} accounts={data.accounts} />
        {publicPlatforms.length > 0 ? <AllocationLines data={data} platforms={publicPlatforms} /> : null}
        {data.accounts.length > 0 ? <ChannelRows accounts={data.accounts} /> : null}
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

export default function App() {
  const pathname = typeof window === "undefined" ? "/" : window.location.pathname;

  if (pathname === "/terms" || pathname === "/terms/") {
    return <LegalPage type="terms" />;
  }

  if (pathname === "/privacy" || pathname === "/privacy/") {
    return <LegalPage type="privacy" />;
  }

  return <PortfolioApp />;
}
