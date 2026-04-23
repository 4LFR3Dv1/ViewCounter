import { motion } from "motion/react";
import { useMemo } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BadgeCheck,
  Instagram,
  MessageCircle,
  Music2,
  Radio,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Youtube,
} from "lucide-react";
import { AnimatedBackground } from "./components/AnimatedBackground";
import { ActivityTicker } from "./components/ActivityTicker";
import { ConnectionsPanel } from "./components/ConnectionsPanel";
import { GrowthChart } from "./components/GrowthChart";
import { LiveCounter } from "./components/LiveCounter";
import { useDashboard } from "./hooks/use-dashboard";
import type { AccountCardData, CaseStudy, ConnectionStatus, DashboardPayload, PlatformCardData } from "./types/dashboard";

function getPlatformIcon(platform: PlatformCardData) {
  if (platform.slug === "instagram") return <Instagram className="h-5 w-5" />;
  if (platform.slug === "youtube") return <Youtube className="h-5 w-5" />;
  return <Music2 className="h-5 w-5" />;
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

const statusLabel: Record<ConnectionStatus, string> = {
  connected: "ativo",
  syncing: "sync",
  warning: "parcial",
  disconnected: "off",
  expired: "expirado",
  pending_auth: "pendente",
  pending_approval: "review",
  manual_mode: "manual",
};

function Sparkline({ values, color }: { values?: number[]; color: string }) {
  const source = values && values.length > 1 ? values : [2, 6, 4, 9, 7, 12, 14];
  const max = Math.max(...source, 1);
  const min = Math.min(...source);
  const range = Math.max(max - min, 1);
  const points = source
    .map((value, index) => {
      const x = (index / (source.length - 1)) * 100;
      const y = 32 - ((value - min) / range) * 28;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="h-10 w-full overflow-visible" viewBox="0 0 100 36" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`0,36 ${points} 100,36`} fill={color} opacity="0.1" />
    </svg>
  );
}

function ShellMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen overflow-hidden bg-[#050812] text-white">
      <AnimatedBackground />
      <div className="relative grid h-screen place-items-center p-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-xl">{children}</div>
      </div>
    </div>
  );
}

function TopBar({ data }: { data: DashboardPayload & { secondsSinceUpdate: number } }) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-[60px] shrink-0 items-center justify-between rounded-full border border-white/10 bg-[#07101a]/78 px-4 shadow-2xl shadow-black/25 backdrop-blur-2xl"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-sm font-bold text-cyan-100">
          JF
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight text-white">Portfolio OS</p>
          <p className="text-xs text-white/40">horizontal social cockpit</p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs text-white/55">
        <Radio className="h-3.5 w-3.5 text-emerald-300" />
        <span>live data</span>
        <span className="text-white/25">/</span>
        <span>atualizado ha {data.secondsSinceUpdate}s</span>
      </div>

      <a
        href="https://wa.me/"
        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#07101a] transition-transform hover:scale-[1.02]"
      >
        <MessageCircle className="h-4 w-4" />
        Fale comigo
      </a>
    </motion.nav>
  );
}

function HeroPanel({ data }: { data: DashboardPayload }) {
  const topPlatform = [...data.platforms].sort((a, b) => b.views - a.views)[0];
  const pendingPlatform = data.platforms.find((platform) => platform.accountsCovered === 0);

  return (
    <motion.section
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[2.25rem] border border-white/10 bg-[linear-gradient(145deg,rgba(14,165,233,0.18),rgba(5,8,18,0.9)_52%,rgba(245,158,11,0.12))] p-6 shadow-2xl shadow-black/35"
    >
      <div className="absolute -left-20 top-8 h-52 w-52 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute -bottom-20 right-0 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />

      <div className="relative flex min-h-0 flex-1 flex-col justify-between">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/5 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-cyan-100/75">
            <BadgeCheck className="h-3.5 w-3.5 text-emerald-300" />
            prova operacional ativa
          </div>
          <h1 className="max-w-[520px] text-5xl font-semibold leading-[0.88] tracking-[-0.065em] text-white 2xl:text-6xl">
            Crescimento social em modo cockpit.
          </h1>
          <p className="mt-5 max-w-[470px] text-sm leading-6 text-white/58">
            Nada de landing page em blocos. A tela se comporta como uma superficie unica: total, redes, contas, alertas e cases no mesmo campo visual.
          </p>
        </div>

        <div className="relative mt-6 rounded-[2rem] border border-white/10 bg-black/26 p-5 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/38">
            <span>views totais</span>
            <span>{data.summary.activeWindowLabel}</span>
          </div>
          <p className="text-5xl font-bold tracking-[-0.065em] text-white 2xl:text-6xl">
            +<LiveCounter value={data.summary.viewsTotal} duration={2} />
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <MetricChip label="cobertura" value={`${data.summary.accountsCovered}/${data.summary.accountsTotal}`} />
            <MetricChip label="alertas" value={String(data.health.staleAccounts)} />
            <MetricChip label="manual" value={String(data.health.manualAccounts)} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <SignalCard label="principal" value={topPlatform ? `${topPlatform.platform} ${formatCompact(topPlatform.views)}` : "sem dados"} color={topPlatform?.color ?? "#38bdf8"} />
          <SignalCard label="proximo sensor" value={pendingPlatform ? `${pendingPlatform.platform} pendente` : "malha completa"} color={pendingPlatform?.color ?? "#34d399"} />
        </div>
      </div>
    </motion.section>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function SignalCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <motion.div
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      className="rounded-2xl border border-white/10 bg-[#0a0f18]/72 p-4 backdrop-blur-2xl"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">{label}</p>
      </div>
      <p className="text-sm font-medium text-white/78">{value}</p>
    </motion.div>
  );
}

function PlatformDock({ data }: { data: DashboardPayload }) {
  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_1fr_auto] gap-3 rounded-[2.25rem] border border-white/10 bg-[#07101a]/76 p-4 shadow-2xl shadow-black/25 backdrop-blur-2xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-white/35">redes como sensores</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-white">Instagram / YouTube / TikTok</h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/55">
          {data.platforms.filter((platform) => platform.accountsCovered > 0).length}/{data.platforms.length} com dados
        </div>
      </div>

      <div className="grid min-h-0 grid-rows-3 gap-3">
        {data.platforms.map((platform, index) => (
          <motion.div
            key={platform.id}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 + index * 0.05 }}
            className="relative overflow-hidden rounded-[1.45rem] border border-white/10 bg-white/[0.035] p-4"
          >
            <div className="absolute -right-8 -top-10 h-24 w-24 rounded-full opacity-20 blur-2xl" style={{ backgroundColor: platform.color }} />
            <div className="relative grid h-full grid-cols-[auto_1fr_110px] items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]" style={{ color: platform.color }}>
                {getPlatformIcon(platform)}
              </div>
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <p className="font-semibold text-white">{platform.platform}</p>
                  <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] text-white/45">
                    {statusLabel[platform.status]}
                  </span>
                </div>
                <p className="text-2xl font-semibold tracking-[-0.04em] text-white">
                  <LiveCounter value={platform.views} />
                </p>
                <p className="text-xs text-white/38">
                  {platform.accountsTotal > 0 ? `cobertura ${platform.accountsCovered}/${platform.accountsTotal}` : "aguardando conexao oficial"}
                </p>
              </div>
              <Sparkline values={platform.sparkline} color={platform.color} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MetricChip label="saudaveis" value={String(data.health.healthyAccounts)} />
        <MetricChip label="ratio" value={`${Math.round(data.health.coverageRatio * 100)}%`} />
        <MetricChip label="delta" value={`+${data.summary.deltaPercentage}%`} />
      </div>
    </section>
  );
}

function AccountRail({ accounts }: { accounts: AccountCardData[] }) {
  const visible = accounts.length > 0 ? accounts : [];

  return (
    <section className="min-w-0 rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-4 backdrop-blur-2xl">
      <RailHeader eyebrow="malha de contas" title={`${visible.length} contas monitoradas`} />
      <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visible.map((account, index) => (
          <motion.div
            key={account.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.04 }}
            className="min-w-[260px] rounded-2xl border border-white/10 bg-[#0b111b]/78 p-4"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{account.displayName}</p>
                <p className="truncate text-xs text-white/40">{account.handle}</p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-white/50">
                {statusLabel[account.status]}
              </span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">{account.platform}</p>
                <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-white">
                  <LiveCounter value={account.views} duration={1.2} />
                </p>
              </div>
              <p className="text-sm font-semibold" style={{ color: account.color }}>+{account.delta}%</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function CaseRail({ cases }: { cases: CaseStudy[] }) {
  const railCases =
    cases.length > 0
      ? cases
      : [
          {
            id: "case-youtube",
            title: "YouTube em validacao publica",
            platform: "YouTube",
            before: 0,
            after: 0,
            growth: 0,
            strategy: "slot pronto para narrativa de resultado real",
            chartData: [0, 4, 8, 10],
            color: "#ef4444",
            status: "live" as const,
          },
          {
            id: "case-tiktok",
            title: "TikTok aguardando review",
            platform: "TikTok",
            before: 0,
            after: 0,
            growth: 0,
            strategy: "entra sem quebrar o cockpit quando aprovado",
            chartData: [0, 2, 3, 8],
            color: "#00f2ea",
            status: "stable" as const,
          },
        ];

  return (
    <section className="min-w-0 rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-4 backdrop-blur-2xl">
      <RailHeader eyebrow="cases" title="prova narrativa em trilho" />
      <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {railCases.map((caseStudy, index) => (
          <motion.div
            key={caseStudy.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + index * 0.04 }}
            className="min-w-[300px] overflow-hidden rounded-2xl border border-white/10 bg-[#0b111b]/78"
          >
            <div
              className="h-16"
              style={{
                background: `radial-gradient(circle at 20% 10%, ${caseStudy.color}55, transparent 45%), linear-gradient(135deg, #101827, #070b12)`,
              }}
            />
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">{caseStudy.title}</p>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-white/50">
                  {caseStudy.platform}
                </span>
              </div>
              <p className="text-xs leading-5 text-white/42">{caseStudy.strategy}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-300">
                  <ArrowUpRight className="h-3.5 w-3.5" />+{caseStudy.growth}%
                </span>
                <span className="text-xs text-white/40">{formatCompact(caseStudy.after || caseStudy.before)} views</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function RailHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">{eyebrow}</p>
        <h2 className="mt-1 text-base font-semibold tracking-[-0.02em] text-white">{title}</h2>
      </div>
      <Sparkles className="h-4 w-4 text-cyan-300/70" />
    </div>
  );
}

function WarningStrip({ data, error }: { data: DashboardPayload; error: string | null }) {
  return (
    <div className="flex h-full items-center gap-3 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#07101a]/76 px-4 backdrop-blur-2xl">
      <div className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
        error ? "border-amber-400/20 bg-amber-500/10 text-amber-200" : "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
      }`}>
        {error ? <AlertCircle className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
        {error ? "stream oscilando" : "backend online"}
      </div>
      <div className="flex min-w-0 flex-1 gap-2 overflow-hidden">
        {data.warnings.length > 0 ? (
          data.warnings.map((warning) => (
            <div key={warning.id} className="truncate rounded-full border border-amber-400/15 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-100/75">
              {warning.title}: {warning.description}
            </div>
          ))
        ) : (
          <div className="truncate rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs text-white/50">
            nenhuma falha bloqueando a vitrine publica
          </div>
        )}
      </div>
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
          <span>Carregando cockpit horizontal...</span>
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
            <span className="font-semibold">Nao foi possivel montar o dashboard</span>
          </div>
          <p className="text-sm text-white/70">
            {error ?? "A API do dashboard nao respondeu. A estrutura continua pronta para dados reais e fallback parcial."}
          </p>
        </div>
      </ShellMessage>
    );
  }

  return (
    <div className="h-screen overflow-x-auto overflow-y-hidden bg-[#050812] text-white">
      <AnimatedBackground />

      <div className="relative mx-auto flex h-screen min-w-[1280px] max-w-[1680px] flex-col gap-3 p-4">
        <TopBar data={data} />

        <main className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_172px_58px] gap-3">
          <div className="grid min-h-0 grid-cols-[0.95fr_1.2fr_0.92fr] gap-3">
            <HeroPanel data={data} />

            <section className="min-h-0">
              <GrowthChart
                data={data.chart}
                title="Desempenho consolidado"
                subtitle="o grafico ocupa o centro da operacao, nao uma secao de scroll"
                total={data.summary.viewsTotal}
                delta={data.summary.deltaPercentage}
              />
            </section>

            <PlatformDock data={data} />
          </div>

          <div className="grid min-h-0 grid-cols-[1fr_1fr] gap-3">
            <AccountRail accounts={data.accounts} />
            <CaseRail cases={data.cases} />
          </div>

          <div className="grid min-h-0 grid-cols-[1fr_0.72fr] gap-3">
            <ActivityTicker activities={data.events} />
            <WarningStrip data={data} error={error} />
          </div>
        </main>

        {showOpsPanel ? (
          <div className="fixed inset-4 z-50 overflow-auto rounded-[2rem] border border-white/10 bg-[#050812]/95 p-5 shadow-2xl shadow-black backdrop-blur-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/35">admin</p>
                <h2 className="text-xl font-semibold text-white">Conexoes e sync</h2>
              </div>
              <a href="/" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                fechar
              </a>
            </div>
            <ConnectionsPanel />
          </div>
        ) : null}
      </div>
    </div>
  );
}
