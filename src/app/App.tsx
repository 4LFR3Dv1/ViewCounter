import { motion } from "motion/react";
import { useMemo } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BadgeCheck,
  Instagram,
  Music2,
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
import type { PlatformCardData } from "./types/dashboard";

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

export default function App() {
  const { data, isLoading, error } = useDashboard();
  const showOpsPanel = useMemo(() => {
    if (typeof window === "undefined") return false;
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get("admin") === "1" || window.location.hash === "#ops";
  }, []);

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-[#070912] text-white">
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
      <div className="min-h-screen bg-[#070912] text-white">
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
    <div className="min-h-screen bg-[#070912] text-white">
      <AnimatedBackground />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6">
        <header className="mb-6 grid gap-4 lg:grid-cols-[1.35fr_0.85fr]">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[linear-gradient(140deg,rgba(14,165,233,0.16),rgba(8,10,18,0.88)_42%,rgba(245,158,11,0.10))] p-6 shadow-2xl shadow-black/35 backdrop-blur-xl"
          >
            <div className="absolute -left-12 top-8 h-44 w-44 rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-amber-400/10 blur-3xl" />
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/40 to-transparent" />

            <div className="relative flex flex-col gap-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-cyan-100/70">
                    <Radar className="h-3.5 w-3.5" />
                    JF Clipes operating system
                  </div>
                  <h1 className="max-w-3xl text-4xl font-semibold leading-[0.98] tracking-[-0.04em] md:text-6xl">
                    Uma central viva de prova social, alimentada por dados reais.
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-white/58 md:text-base">
                    YouTube ja conectado por OAuth oficial. Instagram e TikTok entram como sensores modulares: quando chegam, somam; quando oscilam, a experiencia continua operacional.
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
                  <motion.div
                    animate={{ scale: [1, 1.18, 1], opacity: [0.65, 1, 0.65] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                    className="h-2.5 w-2.5 rounded-full bg-emerald-400"
                  />
                  <span>Atualizado ha {data.secondsSinceUpdate}s</span>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-black/25 p-5">
                  <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/45">
                    <BadgeCheck className="h-3.5 w-3.5 text-emerald-300" />
                    dados oficiais
                  </div>
                  <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/40">
                    <Sparkles className="h-4 w-4 text-indigo-300" />
                    total verificado
                  </div>
                  <div className="flex flex-wrap items-end gap-4">
                    <p className="text-5xl font-bold tracking-[-0.05em] text-white md:text-7xl">
                      +<LiveCounter value={data.summary.viewsTotal} duration={2} />
                    </p>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60">
                      <p className="font-medium text-emerald-300">+{data.summary.deltaPercentage}%</p>
                      <p>{data.summary.activeWindowLabel}</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-2 sm:grid-cols-3">
                    {data.platforms.map((platform) => (
                      <div key={platform.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">{platform.platform}</p>
                        <p className="mt-1 text-sm font-semibold text-white">{formatCompact(platform.views)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/40">
                      <ShieldCheck className="h-4 w-4 text-cyan-300" />
                      cobertura
                    </div>
                    <p className="text-2xl font-semibold text-white">
                      {data.summary.accountsCovered}/{data.summary.accountsTotal}
                    </p>
                    <p className="mt-1 text-sm text-white/50">contas com snapshot oficial alimentando a vitrine</p>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/40">
                      <TrendingUp className="h-4 w-4 text-indigo-300" />
                      malha resiliente
                    </div>
                    <p className="text-2xl font-semibold text-white">{Math.round(data.health.coverageRatio * 100)}%</p>
                    <p className="mt-1 text-sm text-white/50">camada visual tolerante a integrações pendentes</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <div className="grid gap-4">
            <GrowthChart
              data={data.chart}
              title="Fluxo consolidado"
              subtitle="a cada snapshot, o agregado global continua operando"
            />
            <StatsGrid summary={data.summary} health={data.health} />
          </div>
        </header>

        <div className="mb-6">
          <ActivityTicker activities={data.events} />
        </div>

        <main className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="space-y-6">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Plataformas conectadas</h2>
                  <p className="text-sm text-white/45">cada rede entra como sensor da central, nao como dependencia estrutural</p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/55">
                  {data.platforms.filter((platform) => platform.accountsCovered > 0).length}/{data.platforms.length} redes com dados
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
                    delay={0.08 + index * 0.05}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Malha de contas</h2>
                  <p className="text-sm text-white/45">conectadas, sincronizando, em alerta ou assistidas manualmente</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {data.accounts.map((account, index) => (
                  <AccountCard key={account.id} account={account} delay={0.1 + index * 0.04} />
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Cases vivos</h2>
                  <p className="text-sm text-white/45">prova narrativa, nao galeria estatica</p>
                </div>
              </div>

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
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
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

              <div className="space-y-3">
                {data.warnings.map((warning) => (
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
                ))}
              </div>
            </div>

            {showOpsPanel ? (
              <ConnectionsPanel />
            ) : (
              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">
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
