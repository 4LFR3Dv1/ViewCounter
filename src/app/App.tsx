import { motion } from "motion/react";
import { useMemo } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
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

function getPublicPlatforms(platforms: PlatformCardData[]) {
  return platforms.filter((platform) => {
    if (hiddenPublicStatuses.has(platform.status)) return false;
    return platform.accountsTotal > 0 || platform.accountsCovered > 0 || platform.views > 0;
  });
}

function SignalBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#030305]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,transparent_42%,rgba(255,0,38,0.18)_42.5%,transparent_45%,transparent_100%)]" />
      <div className="absolute left-0 top-0 h-full w-px bg-red-500/40" />
      <div className="absolute right-0 top-0 h-full w-px bg-white/10" />
      <motion.div
        className="absolute left-0 top-1/4 h-px w-full bg-gradient-to-r from-transparent via-red-400/55 to-transparent"
        animate={{ opacity: [0.25, 0.85, 0.25], y: [0, 18, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(3,3,5,0.35)_45%,#030305_88%)]" />
    </div>
  );
}

function FrameOverlay({ data }: { data: DashboardPayload & { secondsSinceUpdate: number } }) {
  return (
    <div className="pointer-events-none fixed inset-3 z-40 hidden border border-white/10 lg:block">
      <div className="absolute -left-px -top-px h-8 w-8 border-l border-t border-red-400" />
      <div className="absolute -right-px -top-px h-8 w-8 border-r border-t border-white/45" />
      <div className="absolute -bottom-px -left-px h-8 w-8 border-b border-l border-white/45" />
      <div className="absolute -bottom-px -right-px h-8 w-8 border-b border-r border-red-400" />
      <div className="absolute left-4 top-3 text-[10px] uppercase text-white/35">JF live frame</div>
      <div className="absolute right-4 top-3 text-[10px] uppercase text-white/35">update {data.secondsSinceUpdate}s</div>
      <div className="absolute bottom-3 left-4 text-[10px] uppercase text-white/35">index {formatCompact(data.summary.viewsTotal)}</div>
      <div className="absolute bottom-3 right-4 text-[10px] uppercase text-white/35">accounts {data.summary.accountsCovered}/{data.summary.accountsTotal}</div>
    </div>
  );
}

function ShellMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-hidden bg-[#030305] text-white">
      <SignalBackdrop />
      <div className="relative grid min-h-screen place-items-center p-6">
        <div className="rounded-lg border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-xl">{children}</div>
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
          <div className="grid h-10 w-10 place-items-center rounded-md border border-red-400/50 bg-red-500/10 text-sm font-black text-white shadow-[0_0_28px_rgba(239,68,68,0.22)]">
            JF
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight text-white">Signal Portfolio</p>
            <p className="text-xs text-white/45">{formatCompact(data.summary.viewsTotal)} views registradas</p>
          </div>
        </a>

        <nav className="hidden items-center gap-6 text-sm text-white/58 md:flex">
          <a className="transition-colors hover:text-white" href="#dados">Index</a>
          <a className="transition-colors hover:text-white" href="#contas">Obras</a>
          <a className="transition-colors hover:text-white" href="#atividade">Sinais</a>
          {data.cases.length > 0 ? <a className="transition-colors hover:text-white" href="#cases">Cases</a> : null}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs text-white/55 sm:flex">
            <Radio className="h-3.5 w-3.5 text-red-300" />
            <span>{data.secondsSinceUpdate}s</span>
          </div>
          <a
            href="#contato"
            className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#030305] transition-transform hover:scale-[1.02]"
          >
            <MessageCircle className="h-4 w-4" />
            Fale comigo
          </a>
        </div>
      </div>
    </motion.header>
  );
}

function Hero({ data, platforms }: { data: DashboardPayload & { secondsSinceUpdate: number }; platforms: PlatformCardData[] }) {
  const leadingPlatform = [...platforms].sort((a, b) => b.views - a.views)[0];

  return (
    <section id="inicio" className="relative mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-14">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative min-h-[560px] overflow-hidden border border-white/10 bg-black/24 p-5 backdrop-blur-xl sm:p-7"
      >
        <div className="absolute right-4 top-2 select-none text-[8rem] font-black leading-none text-white/[0.035] sm:text-[12rem] lg:text-[16rem]">
          JF
        </div>
        <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-red-400 via-white/20 to-transparent" />
        <div className="absolute bottom-0 right-0 h-28 w-px bg-gradient-to-b from-transparent via-red-400 to-transparent" />

        <div className="relative flex h-full min-h-[520px] flex-col justify-between">
          <div>
            <div className="mb-10 inline-flex items-center gap-2 border border-red-400/25 bg-red-500/10 px-3 py-1.5 text-xs uppercase text-red-100">
              <Satellite className="h-3.5 w-3.5" />
              portfolio vivo
            </div>

            <p className="mb-4 text-sm uppercase text-white/42">total index</p>
            <h1 className="max-w-5xl text-6xl font-black leading-none text-white sm:text-8xl lg:text-9xl">
              <LiveCounter value={data.summary.viewsTotal} duration={1.8} />
            </h1>
            <p className="mt-6 max-w-2xl text-xl font-medium text-white/82 sm:text-2xl">
              views registradas em contas conectadas.
            </p>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/52">
              Uma moldura futurista para canais, cortes e presenca digital. A pagina se reorganiza conforme novas contas conectadas passam a enviar dados reais.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <SignalStat label="janela" value={data.summary.activeWindowLabel} />
            <SignalStat label="contas" value={`${data.summary.accountsCovered}/${data.summary.accountsTotal}`} />
            <SignalStat label="cobertura" value={`${Math.round(data.health.coverageRatio * 100)}%`} />
          </div>
        </div>
      </motion.div>

      <motion.aside
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.08 }}
        className="relative overflow-hidden border border-white/10 bg-[#070709]/86 p-5 shadow-2xl shadow-black/30 backdrop-blur-2xl"
      >
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-red-300/70 to-transparent" />
        <div className="flex min-h-[560px] flex-col justify-between">
          <div>
            <div className="mb-8 flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-100">
                <Youtube className="h-4 w-4" />
                {leadingPlatform?.platform ?? "canal ativo"}
              </div>
              <div className="border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs text-white/48">
                update {data.secondsSinceUpdate}s
              </div>
            </div>

            <div className="border-l border-red-400/55 pl-5">
              <p className="text-sm uppercase text-white/38">signal principal</p>
              <p className="mt-3 text-5xl font-black leading-none text-white sm:text-6xl">
                {leadingPlatform ? formatCompact(leadingPlatform.views) : formatCompact(data.summary.viewsTotal)}
              </p>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/50">
                A vitrine publica mostra somente plataformas conectadas e com dados reais.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-3">
            {platforms.map((platform) => (
              <PlatformFeature key={platform.id} platform={platform} />
            ))}
          </div>
        </div>
      </motion.aside>
    </section>
  );
}

function SignalStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-white/[0.035] p-4">
      <p className="text-[10px] uppercase text-white/35">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function PlatformFeature({ platform }: { platform: PlatformCardData }) {
  return (
    <div className="relative overflow-hidden border border-white/10 bg-black/35 p-4">
      <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: platform.color }} />
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{platform.platform}</p>
          <p className="mt-1 text-xs text-white/42">
            {platform.accountsCovered}/{platform.accountsTotal} contas conectadas
          </p>
        </div>
        <p className="shrink-0 text-2xl font-black text-white">{formatCompact(platform.views)}</p>
      </div>
    </div>
  );
}

function DataSection({ data, platforms }: { data: DashboardPayload; platforms: PlatformCardData[] }) {
  return (
    <section id="dados" className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:px-8">
      <div className="border border-white/10 bg-[#070709]/82 p-5 shadow-2xl shadow-black/20 backdrop-blur-2xl">
        <SectionTitle eyebrow="index" title="Plataformas ativas" />
        <div className="mt-5 grid gap-3">
          {platforms.map((platform) => (
            <PlatformRow key={platform.id} platform={platform} />
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

function PlatformRow({ platform }: { platform: PlatformCardData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-white/10 bg-white/[0.03] p-4"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2.5 w-2.5" style={{ backgroundColor: platform.color }} />
            <p className="font-semibold text-white">{platform.platform}</p>
          </div>
          <p className="text-xs text-white/42">{platform.accountsCovered}/{platform.accountsTotal} contas cobertas</p>
        </div>
        <p className="text-3xl font-black text-white">{formatFull(platform.views)}</p>
      </div>
    </motion.div>
  );
}

function SnapshotCard({ data }: { data: DashboardPayload }) {
  const point = data.chart[0];

  return (
    <div className="relative overflow-hidden border border-white/10 bg-[#070709]/86 p-5 shadow-2xl shadow-black/25 backdrop-blur-2xl">
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-red-300/60 to-transparent" />
      <div className="flex min-h-[360px] flex-col justify-between">
        <div>
          <SectionTitle eyebrow={data.summary.activeWindowLabel} title="Primeiro registro" />
          <p className="mt-4 max-w-md text-sm leading-6 text-white/48">
            A evolucao visual aparece automaticamente quando a serie trouxer mais pontos no historico.
          </p>
        </div>

        <div>
          <div className="mb-5 h-px w-full bg-gradient-to-r from-red-400/70 via-white/20 to-transparent" />
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-white/45">{point?.label ?? data.summary.activeWindowLabel}</p>
              <p className="mt-2 text-5xl font-black text-white">{formatCompact(point?.total ?? data.summary.viewsTotal)}</p>
            </div>
            <div className="border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/60">
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
      <SectionTitle eyebrow="obras conectadas" title={`${accounts.length} modulos do portfolio`} />
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
      className="group relative overflow-hidden border border-white/10 bg-[#070709]/82 p-5 shadow-2xl shadow-black/20 backdrop-blur-2xl"
    >
      <div className="absolute inset-x-0 top-0 h-px opacity-80" style={{ backgroundColor: account.color }} />
      <div className="absolute right-4 top-4 text-6xl font-black leading-none text-white/[0.045]">{String(index + 1).padStart(2, "0")}</div>
      <div className="flex min-h-[280px] flex-col justify-between">
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-2xl font-black text-white">{account.displayName}</p>
            <p className="mt-1 truncate text-sm text-white/45">{account.handle}</p>
          </div>
          <div className="border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/55">
            {account.platform}
          </div>
        </div>

        <div className="relative">
          <p className="text-[10px] uppercase text-white/35">view output</p>
          <p className="mt-2 text-5xl font-black leading-none text-white">
            <LiveCounter value={account.views} duration={1.4} />
          </p>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/48">{account.coverageLabel}</p>
        </div>
      </div>
    </motion.article>
  );
}

function EventsSection({ data }: { data: DashboardPayload & { secondsSinceUpdate: number } }) {
  if (data.events.length === 0) return null;

  return (
    <section id="atividade" className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[0.65fr_1.35fr] lg:px-8">
      <div className="border border-white/10 bg-white/[0.035] p-5 backdrop-blur-2xl">
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
            className="relative flex items-center gap-4 border border-white/10 bg-[#070709]/82 p-4 backdrop-blur-2xl"
          >
            <span className="absolute -left-[23px] h-3 w-3 border border-red-300 bg-[#030305]" />
            <div className="grid h-10 w-10 shrink-0 place-items-center border border-white/10 bg-white/[0.04]" style={{ color: event.color }}>
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{event.text}</p>
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
          <article key={caseStudy.id} className="border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xl font-black text-white">{caseStudy.title}</p>
                <p className="mt-1 text-sm text-white/45">{caseStudy.platform}</p>
              </div>
              <span className="inline-flex items-center gap-1 border border-emerald-400/15 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-200">
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

function ContactSection({ data }: { data: DashboardPayload }) {
  return (
    <section id="contato" className="mx-auto max-w-7xl px-4 py-4 pb-10 sm:px-6 lg:px-8">
      <div className="border border-white/10 bg-white p-6 text-[#030305] shadow-2xl shadow-black/25">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-black/45">contato</p>
            <h2 className="mt-2 text-3xl font-black">Vamos conversar sobre o portfolio?</h2>
          </div>
          <div className="text-left md:text-right">
            <p className="text-sm text-black/55">Total atual</p>
            <p className="text-3xl font-black">{formatCompact(data.summary.viewsTotal)}</p>
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
        <Hero data={data} platforms={publicPlatforms} />
        {publicPlatforms.length > 0 ? <DataSection data={data} platforms={publicPlatforms} /> : null}
        {data.accounts.length > 0 ? <AccountsSection accounts={data.accounts} /> : null}
        <EventsSection data={data} />
        <CasesSection cases={data.cases} />
        <ContactSection data={data} />
      </main>

      {showOpsPanel ? (
        <div className="fixed inset-4 z-50 overflow-auto rounded-lg border border-white/10 bg-[#030305]/95 p-5 shadow-2xl shadow-black backdrop-blur-2xl">
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
