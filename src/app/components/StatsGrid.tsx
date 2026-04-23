import { motion } from "motion/react";
import { Activity, Eye, ShieldAlert, Wrench } from "lucide-react";
import { LiveCounter } from "./LiveCounter";
import type { DashboardHealth, DashboardSummary } from "../types/dashboard";

interface StatsGridProps {
  summary: DashboardSummary;
  health: DashboardHealth;
}

export function StatsGrid({ summary, health }: StatsGridProps) {
  const stats = [
    { icon: Eye, label: "Views Totais", value: summary.viewsTotal, color: "#6366f1" },
    { icon: Activity, label: "Cobertura Ativa", value: summary.accountsCovered, color: "#8b5cf6" },
    { icon: ShieldAlert, label: "Contas em Alerta", value: health.staleAccounts, color: "#ec4899" },
    { icon: Wrench, label: "Modo Manual", value: health.manualAccounts, color: "#06b6d4" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.05, duration: 0.4 }}
            whileHover={{ scale: 1.05 }}
            className="relative group"
          >
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: `radial-gradient(circle at center, ${stat.color}20, transparent 70%)`,
                filter: 'blur(12px)'
              }}
            />

            <div className="relative bg-[#0f1117] border border-white/5 rounded-xl p-3 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${stat.color}15` }}>
                  <Icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <p className="text-xs text-white/40">{stat.label}</p>
              </div>
              <p className="text-lg font-bold text-white">
                <LiveCounter value={stat.value} duration={1.5} />
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
