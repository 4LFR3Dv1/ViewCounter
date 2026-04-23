import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "motion/react";
import { Activity, ArrowUpRight } from "lucide-react";
import { LiveCounter } from "./LiveCounter";
import type { DashboardSeriesPoint } from "../types/dashboard";

interface GrowthChartProps {
  data: DashboardSeriesPoint[];
  title?: string;
  subtitle?: string;
  total?: number;
  delta?: number;
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function GrowthChart({
  data,
  title = "Crescimento Consolidado",
  subtitle = "Ultimos 7 snapshots agregados",
  total,
  delta = 0,
}: GrowthChartProps) {
  const lastTotal = total ?? data[data.length - 1]?.total ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="relative min-h-[360px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#07101a]/78 p-5 shadow-2xl shadow-black/25 backdrop-blur-2xl"
    >
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background: "radial-gradient(circle at 55% 0%, rgba(56, 189, 248, 0.13), transparent 55%)",
        }}
      />
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-sky-200/35 to-transparent" />

      <div className="relative flex h-full min-h-[320px] flex-col">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50">
              <Activity className="h-3.5 w-3.5 text-cyan-300" />
              live performance
            </div>
            <h3 className="text-2xl font-semibold tracking-[-0.035em] text-white">{title}</h3>
            <p className="mt-1 text-sm text-white/42">{subtitle}</p>
          </div>

          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-white/35">views totais</p>
            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-white">
              <LiveCounter value={lastTotal} duration={1.6} />
            </p>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-400/15 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
              <ArrowUpRight className="h-3 w-3" />
              +{delta}%
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.length > 0 ? data : [{ label: "agora", total: 0 }]}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                  <stop offset="45%" stopColor="#6366f1" stopOpacity={0.16} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" vertical={false} />
              <XAxis dataKey="label" stroke="#ffffff35" tickLine={false} axisLine={false} style={{ fontSize: "11px" }} />
              <YAxis
                stroke="#ffffff30"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCompact(Number(value))}
                style={{ fontSize: "11px" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0b111b",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "16px",
                  color: "#fff",
                  fontSize: "12px",
                }}
                formatter={(value) => [new Intl.NumberFormat("pt-BR").format(Number(value)), "views"]}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#38bdf8"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorTotal)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0, fill: "#e0f2fe" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
