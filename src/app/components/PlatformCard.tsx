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
  delay?: number;
}

const statusLabel: Record<ConnectionStatus, string> = {
  connected: "ativo",
  syncing: "sincronizando",
  warning: "cobertura parcial",
  disconnected: "desconectado",
  expired: "expirado",
  pending_auth: "aguardando auth",
  pending_approval: "aguardando aprovacao",
  manual_mode: "modo manual",
};

function StatusGlyph({ status }: { status: ConnectionStatus }) {
  if (status === "connected") return <ShieldCheck className="h-3 w-3" />;
  if (status === "syncing") return <RefreshCw className="h-3 w-3 animate-spin" />;
  if (status === "manual_mode") return <Wrench className="h-3 w-3" />;
  return <AlertCircle className="h-3 w-3" />;
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
  delay = 0,
}: PlatformCardProps) {
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.02, x: 4 }}
      className="relative group"
    >
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at center, ${color}20, transparent 70%)`,
          filter: 'blur(15px)'
        }}
      />

      <div className="relative bg-[#0f1117] border border-white/5 rounded-xl p-3 backdrop-blur-xl">
        <div className="mb-2 flex items-center justify-between">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
            <div style={{ color }}>{icon}</div>
          </div>
          <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{Math.abs(change)}%</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-white/50 text-xs">{platform}</p>
            <div className="flex items-center gap-1 rounded-full border border-white/8 px-2 py-1 text-[10px] text-white/55">
              <StatusGlyph status={status} />
              <span>{statusLabel[status]}</span>
            </div>
          </div>

          <p className="text-xl font-semibold text-white">
            <LiveCounter value={views} />
          </p>
          <p className="text-[11px] text-white/40">
            cobertura {accountsCovered}/{accountsTotal} contas
          </p>
        </div>

        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl"
          style={{ backgroundColor: color }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: delay + 0.2, duration: 0.6 }}
        />
      </div>
    </motion.div>
  );
}
