import { motion } from "motion/react";
import { AlertCircle, RefreshCw, ShieldCheck, Wrench } from "lucide-react";
import { LiveCounter } from "./LiveCounter";
import type { AccountCardData, ConnectionStatus } from "../types/dashboard";

const statusMeta: Record<
  ConnectionStatus,
  { label: string; icon: typeof ShieldCheck; tone: string; border: string }
> = {
  connected: {
    label: "ativo",
    icon: ShieldCheck,
    tone: "text-emerald-300",
    border: "border-emerald-400/20",
  },
  syncing: {
    label: "sincronizando",
    icon: RefreshCw,
    tone: "text-sky-300",
    border: "border-sky-400/20",
  },
  warning: {
    label: "snapshot valido",
    icon: AlertCircle,
    tone: "text-amber-300",
    border: "border-amber-400/20",
  },
  disconnected: {
    label: "pausado",
    icon: AlertCircle,
    tone: "text-white/50",
    border: "border-white/10",
  },
  expired: {
    label: "expirado",
    icon: AlertCircle,
    tone: "text-rose-300",
    border: "border-rose-400/20",
  },
  pending_auth: {
    label: "aguardando auth",
    icon: AlertCircle,
    tone: "text-white/60",
    border: "border-white/10",
  },
  pending_approval: {
    label: "aguardando aprovacao",
    icon: AlertCircle,
    tone: "text-white/60",
    border: "border-white/10",
  },
  manual_mode: {
    label: "modo manual",
    icon: Wrench,
    tone: "text-violet-300",
    border: "border-violet-400/20",
  },
};

export function AccountCard({ account, delay = 0 }: { account: AccountCardData; delay?: number }) {
  const meta = statusMeta[account.status];
  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      whileHover={{ y: -4 }}
      className="group relative"
    >
      <div
        className="absolute inset-0 rounded-2xl opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle at top left, ${account.color}25, transparent 70%)` }}
      />

      <div className={`relative rounded-2xl border bg-[#0d1118]/85 p-4 backdrop-blur-xl ${meta.border}`}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">{account.displayName}</p>
            <p className="text-xs text-white/45">{account.handle}</p>
          </div>
          <div className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] ${meta.border} ${meta.tone}`}>
            <Icon className={`h-3 w-3 ${account.status === "syncing" ? "animate-spin" : ""}`} />
            <span>{meta.label}</span>
          </div>
        </div>

        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-[0.22em] text-white/35">{account.platform}</p>
            <p className="text-2xl font-semibold text-white">
              <LiveCounter value={account.views} duration={1.5} />
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-white/35">delta</p>
            <p className="text-sm font-semibold" style={{ color: account.color }}>
              +{account.delta}%
            </p>
          </div>
        </div>

        <div className="space-y-1 text-xs text-white/45">
          <p>{account.coverageLabel}</p>
          <p>ultimo sync: {new Date(account.lastSyncedAt).toLocaleTimeString("pt-BR")}</p>
        </div>
      </div>
    </motion.div>
  );
}
