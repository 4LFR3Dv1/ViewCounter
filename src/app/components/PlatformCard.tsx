import { motion } from "motion/react";
import type { ReactNode } from "react";
import { AlertCircle, RefreshCw, ShieldCheck, TrendingDown, TrendingUp, Wrench } from "lucide-react";
import { LiveCounter } from "./LiveCounter";
import type { ConnectionStatus } from "../types/dashboard";

interface PlatformCardProps {
  platform: string;
  icon: ReactNode;
  views: number;
  change: number;
  color: string;
  status: ConnectionStatus;
  accountsCovered: number;
  accountsTotal: number;
  sparkline?: number[];
  delay?: number;
}

const statusLabel: Record<ConnectionStatus, string> = {
  connected: "ativo",
  syncing: "sincronizando",
  warning: "parcial",
  disconnected: "desconectado",
  expired: "expirado",
  pending_auth: "aguardando",
  pending_approval: "em review",
  manual_mode: "manual",
};

function StatusGlyph({ status }: { status: ConnectionStatus }) {
  if (status === "connected") return <ShieldCheck className="h-3 w-3" />;
  if (status === "syncing") return <RefreshCw className="h-3 w-3 animate-spin" />;
  if (status === "manual_mode") return <Wrench className="h-3 w-3" />;
  return <AlertCircle className="h-3 w-3" />;
}

function Sparkline({ values, color }: { values?: number[]; color: string }) {
  const source = values && values.length > 1 ? values : [0, 12, 8, 18, 16, 25, 30];
  const max = Math.max(...source, 1);
  const min = Math.min(...source);
  const range = Math.max(max - min, 1);
  const points = source
    .map((value, index) => {
      const x = (index / (source.length - 1)) * 100;
      const y = 30 - ((value - min) / range) * 26;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="h-9 w-24 overflow-visible" viewBox="0 0 100 34" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`0,34 ${points} 100,34`} fill={color} opacity="0.12" />
    </svg>
  );
}

export function PlatformCard({
  platform,
  icon,
  views,
  change,
  color,
  status,
  accountsCovered,
  accountsTotal,
  sparkline,
  delay = 0,
}: PlatformCardProps) {
  const isPositive = change >= 0;
  const hasAccounts = accountsTotal > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -3 }}
      className="group relative"
    >
      <div
        className="absolute inset-0 rounded-[1.45rem] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle at center, ${color}25, transparent 70%)` }}
      />

      <div className="relative overflow-hidden rounded-[1.45rem] border border-white/10 bg-[#0b111b]/85 p-4 backdrop-blur-xl">
        <div className="absolute -right-8 -top-10 h-24 w-24 rounded-full opacity-20 blur-2xl" style={{ backgroundColor: color }} />

        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2.5" style={{ color }}>
              {icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{platform}</p>
              <div className="mt-1 flex items-center gap-1 rounded-full text-[11px] text-white/45">
                <StatusGlyph status={status} />
                <span>{statusLabel[status]}</span>
              </div>
            </div>
          </div>

          <div className={`flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${
            isPositive ? "border-emerald-400/15 bg-emerald-500/10 text-emerald-300" : "border-rose-400/15 bg-rose-500/10 text-rose-300"
          }`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{Math.abs(change)}%</span>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-semibold tracking-[-0.04em] text-white">
              <LiveCounter value={views} />
            </p>
            <p className="mt-1 text-[11px] text-white/40">
              {hasAccounts ? `cobertura ${accountsCovered}/${accountsTotal} contas` : "aguardando conexao oficial"}
            </p>
          </div>
          <Sparkline values={sparkline} color={color} />
        </div>
      </div>
    </motion.div>
  );
}
