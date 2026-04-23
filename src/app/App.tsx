import { motion } from "motion/react";
import { useMemo } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BadgeCheck,
  ChevronRight,
  Instagram,
  MessageCircle,
  Music2,
  Orbit,
  Radio,
  Radar,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Youtube,
} from "lucide-react";
import { AnimatedBackground } from "./components/AnimatedBackground";
import { ActivityTicker } from "./components/ActivityTicker";
import { AccountCard } from "./components/AccountCard";
import { CaseCard } from "./components/CaseCard";
import { ConnectionsPanel } from "./components/ConnectionsPanel";
import { GrowthChart } from "./components/GrowthChart";
import { LiveCounter } from "./components/LiveCounter";
import { PlatformCard } from "./components/PlatformCard";
import { StatsGrid } from "./components/StatsGrid";
import { useDashboard } from "./hooks/use-dashboard";
import type { DashboardPayload, PlatformCardData } from "./types/dashboard";

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

function resolveSignalCards(data: DashboardPayload) {
  const topPlatform = [...data.platforms].sort((a, b) => b.views - a.views)[0];
  const nextConnection = data.platforms.find((platform) => platform.accountsCovered === 0);
  const lastEvent = data.events[0];

  return [
    {
      label: "sinal principal",
      value: topPlatform ? `${topPlatform.platform} ${formatCompact(topPlatform.views)}` : "aguardando dados",
      icon: Radar,
      color: topPlatform?.color ?? "#38bdf8",
    },
    {
      label: "pipeline",
      value: nextConnection ? `${nextConnection.platform} pendente` : "malha completa",
      icon: Orbit,
      color: nextConnection?.color ?? "#34d399",
    },
    {
      label: "evento vivo",
      value: lastEvent?.text ?? "syncs prontos para novas contas",
      icon: Sparkles,
      color: lastEvent?.color ?? "#a78bfa",
    },
  ];
}

function FloatingTelemetry({ data }: { data: DashboardPayload }) {
  const signals = resolveSignalCards(data);

  return (
    <div className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block">
      {signals.map((signal, index) => {
        const Icon = signal.icon;
        const positions = [
          "left-[50%] top-[14%]",
          "right-[4%] top-[40%]",
          "left-[42%] bottom-[9%]",
        ];

        return (
          <motion.div
            key={signal.label}
            className={`absolute ${positions[index]} max-w-[230px] rounded-2xl border border-white/10 bg-[#0a0f18]/72 px-4 py-3 shadow-2xl shadow-black/30 backdrop-blur-2xl`}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{
              opacity: 1,
              y: index % 2 === 0 ? [0, -8, 0] : [0, 8, 0],
              scale: 1,
            }}
            transition={{
              opacity: { delay: 0.6 + index * 0.12, duration: 0.4 },
              scale: { delay: 0.6 + index * 0.12, duration: 0.4 },
              y: { delay: index * 0.4, duration: 5.5 + index, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <div className="flex items-start gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-2" style={{ color: signal.color }}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">{signal.label}</p>
                <p className="mt-1 text-sm font-medium text-white/80">{signal.value}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function PlatformStack({ data }: { data: DashboardPayload }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#07101a]/74 p-4 shadow-2xl shadow-black/25 backdrop-blur-2xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-white/35">sensores sociais</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Redes conectadas</h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/55">
          {data.platforms.filter((platform) => platform.accountsCovered > 0).length}/{data.platforms.length}
        </div>
      </div>

      <div className="space-y-3">
        {data.platforms.map((platform, index) => (
          <PlatformCard
            key={platform.id}
            platform={platform.platform}
            icon={getPlatformIcon(platform)}
            views={platform.views}
            change={platform.change}
            color={platform.color}
            status={platform.status}
            accountsCovered={platform.accountsCovered}
            accountsTotal={platform.accountsTotal}
            sparkline={platform.sparkline}
            delay={0.08 + index * 0.05}
          />
        ))}
      </div>
    </div>
  );
}

function AudiencePanel({ data }: { data: DashboardPayload }) {
  const total = Math.max(data.summary.viewsTotal, 1);

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-white/35">audiencia em movimento</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-white">Distribuicao por rede</h2>
        </div>
        <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
          {Math.round(data.health.coverageRatio * 100)}% cobertura
        </div>
      </div>

      <div className="space-y-4">
        {data.platforms.map((platform) => {
          const width = Math.max(4, Math.round((platform.views / total) * 100));
          return (
            <div key={platform.id}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-white/72">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: platform.color }} />
                  <span>{platform.platform}</span>
                </div>
                <span className="font-medium text-white">{formatCompact(platform.views)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/7">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${platform.color}, ${platform.color}80)` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ delay: 0.25, duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyCaseState() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {["YouTube em validacao publica", "TikTok aguardando review"].map((title, index) => (
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 + index * 0.05 }}
          className="rounded-[1.5rem] border border-dashed border-white/12 bg-white/[0.035] p-5"
        >
          <div className="mb-8 flex items-center justify-between">
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/45">
              case slot
            </div>
            <ChevronRight className="h-4 w-4 text-white/25" />
          </div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/45">
            Este espaco vira mini-dashboard quando houver narrativa, estrategia e janela de crescimento para publicar.
          </p>
        </motion.div>
      ))}
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
      <div className="min-h-screen bg-[#050812] text-white">
        <AnimatedBackground />
        <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-10">
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-xl">
            <div className="flex items-center gap-3 text-white/70">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Carregando a malha de performance...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#050812] text-white">
        <AnimatedBackground />
        <div className="relative mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-10">
          <div className="max-w-xl rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 backdrop-blur-xl">
            <div className="mb-3 flex items-center gap-3 text-rose-200">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">Nao foi possivel montar o dashboard</span>
            </div>
            <p className="text-sm text-white/70">
              {error ?? "A API do dashboard nao respondeu. A estrutura do produto ja esta pronta para dados reais e fallback parcial."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050812] text-white">
      <AnimatedBackground />

      <div className="relative mx-auto flex min-h-screen max-w-[1440px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <motion.nav
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-4 z-30 mb-5 flex items-center justify-between rounded-full border border-white/10 bg-[#07101a]/78 px-4 py-3 shadow-2xl shadow-black/25 backdrop-blur-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-sm font-bold text-cyan-100">
              JF
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight text-white">Portfolio OS</p>
              <p className="text-xs text-white/40">social growth monitor</p>
            </div>
          </div>

          <div className="hidden items-center gap-6 text-sm text-white/52 md:flex">
            <a className="transition-colors hover:text-white" href="#inicio">Inicio</a>
            <a className="transition-colors hover:text-white" href="#metricas">Metricas</a>
            <a className="transition-colors hover:text-white" href="#cases">Cases</a>
            <a className="transition-colors hover:text-white" href="#contas">Contas</a>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 sm:flex">
              Atualizado ha {data.secondsSinceUpdate}s
            </div>
            <a
              href="https://wa.me/"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#07101a] transition-transform hover:scale-[1.02]"
            >
              <MessageCircle className="h-4 w-4" />
              Fale comigo
            </a>
          </div>
        </motion.nav>

        <header id="inicio" className="mb-6 grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative min-h-[590px] overflow-hidden rounded-[2.6rem] border border-white/10 bg-[linear-gradient(140deg,rgba(14,165,233,0.18),rgba(5,8,18,0.9)_42%,rgba(245,158,11,0.11))] p-5 shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-7"
          >
            <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/45 to-transparent" />
            <div className="absolute inset-y-10 right-[34%] hidden w-px bg-gradient-to-b from-transparent via-white/10 to-transparent lg:block" />
            <FloatingTelemetry data={data} />

            <div className="relative grid h-full gap-6 lg:grid-cols-[1fr_300px]">
              <div className="flex min-h-[530px] flex-col justify-between">
                <div>
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/5 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-cyan-100/75">
                    <Radio className="h-3.5 w-3.5 text-emerald-300" />
                    resultados reais acontecendo agora
                  </div>
                  <h1 className="max-w-3xl text-5xl font-semibold leading-[0.9] tracking-[-0.06em] text-white md:text-7xl">
                    Portfolio vivo de crescimento social.
                  </h1>
                  <p className="mt-5 max-w-xl text-sm leading-6 text-white/60 md:text-base">
                    Instagram, YouTube e TikTok consolidados em uma unica superficie viva. O sistema opera mesmo quando uma rede esta pendente, em alerta ou dependendo de snapshot manual.
                  </p>
                </div>

                <div className="mt-10 max-w-2xl rounded-[2rem] border border-white/10 bg-black/24 p-5 backdrop-blur-xl">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/38">
                      <BadgeCheck className="h-4 w-4 text-emerald-300" />
                      total ativo
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/50">
                      {data.summary.activeWindowLabel}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-end gap-4">
                    <p className="text-5xl font-bold tracking-[-0.06em] text-white md:text-7xl">
                      +<LiveCounter value={data.summary.viewsTotal} duration={2} />
                    </p>
                    <div className="mb-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm">
                      <p className="font-semibold text-emerald-300">+{data.summary.deltaPercentage}%</p>
                      <p className="text-white/45">janela atual</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/58">
                      cobertura {data.summary.accountsCovered}/{data.summary.accountsTotal}
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/58">
                      {data.health.healthyAccounts} contas saudaveis
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/58">
                      {data.health.staleAccounts} alertas
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <PlatformStack data={data} />
                <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 backdrop-blur-2xl">
                  <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/35">
                    <ShieldCheck className="h-4 w-4 text-cyan-300" />
                    malha resiliente
                  </div>
                  <p className="text-3xl font-semibold tracking-[-0.04em] text-white">
                    {Math.round(data.health.coverageRatio * 100)}%
                  </p>
                  <p className="mt-2 text-sm leading-5 text-white/48">
                    o design continua vivo mesmo com cobertura parcial
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          <section id="metricas" className="grid gap-5">
            <GrowthChart
              data={data.chart}
              title="Desempenho geral"
              subtitle="fluxo consolidado de views por snapshot"
              total={data.summary.viewsTotal}
              delta={data.summary.deltaPercentage}
            />
            <StatsGrid summary={data.summary} health={data.health} />
          </section>
        </header>

        <div className="mb-6">
          <ActivityTicker activities={data.events} />
        </div>

        <main className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <section id="contas" className="space-y-6">
            <div>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/35">operacao conectada</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-white">Malha de contas</h2>
                  <p className="mt-1 text-sm text-white/45">
                    conectadas, sincronizando, em alerta ou assistidas manualmente
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/55">
                  {data.accounts.length} contas monitoradas
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {data.accounts.map((account, index) => (
                  <AccountCard key={account.id} account={account} delay={0.1 + index * 0.04} />
                ))}
              </div>
            </div>

            <AudiencePanel data={data} />
          </section>

          <section id="cases" className="space-y-6">
            <div>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/35">prova narrativa</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-white">Cases vivos</h2>
                  <p className="mt-1 text-sm text-white/45">mini dashboards, nao galeria estatica</p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/55">
                  {data.cases.length} publicados
                </div>
              </div>

              {data.cases.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {data.cases.map((caseStudy, index) => (
                    <CaseCard
                      key={caseStudy.id}
                      title={caseStudy.title}
                      platform={caseStudy.platform}
                      before={caseStudy.before}
                      after={caseStudy.after}
                      growth={caseStudy.growth}
                      strategy={caseStudy.strategy}
                      thumbnail={caseStudy.thumbnail}
                      chartData={caseStudy.chartData}
                      color={caseStudy.color}
                      status={caseStudy.status}
                      delay={0.16 + index * 0.04}
                    />
                  ))}
                </div>
              ) : (
                <EmptyCaseState />
              )}
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Cobertura e tolerancia</h2>
                  <p className="text-sm text-white/45">
                    contas que passam ou nao passam pela integracao nao interrompem a experiencia.
                  </p>
                </div>
                {error ? (
                  <div className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
                    stream oscilando
                  </div>
                ) : (
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                    backend online
                  </div>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {data.warnings.length > 0 ? (
                  data.warnings.map((warning) => (
                    <div
                      key={warning.id}
                      className={`rounded-2xl border p-4 ${
                        warning.severity === "warning"
                          ? "border-amber-400/20 bg-amber-500/10"
                          : "border-white/10 bg-black/15"
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-200" />
                        <p className="font-medium text-white">{warning.title}</p>
                      </div>
                      <p className="text-sm text-white/65">{warning.description}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/10 p-4 md:col-span-2">
                    <div className="mb-2 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-300" />
                      <p className="font-medium text-white">Nenhum alerta operacional</p>
                    </div>
                    <p className="text-sm text-white/55">
                      A vitrine esta usando os snapshots disponiveis sem interromper a narrativa publica.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {showOpsPanel ? (
              <ConnectionsPanel />
            ) : (
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Camada operacional protegida</h2>
                    <p className="mt-1 text-sm text-white/45">
                      Conexoes OAuth e sync manual ficam fora da narrativa publica. Acesse com <span className="text-white/70">?admin=1</span>.
                    </p>
                  </div>
                  <a
                    href="/?admin=1"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 transition-colors hover:bg-white/10"
                  >
                    Abrir operacao
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
