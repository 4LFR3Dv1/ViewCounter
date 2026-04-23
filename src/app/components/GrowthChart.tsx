import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from "motion/react";
import type { DashboardSeriesPoint } from "../types/dashboard";

interface GrowthChartProps {
  data: DashboardSeriesPoint[];
  title?: string;
  subtitle?: string;
}

export function GrowthChart({
  data,
  title = "Crescimento Consolidado",
  subtitle = "Ultimos 7 snapshots agregados",
}: GrowthChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="relative bg-[#0f1117] border border-white/5 rounded-2xl p-4 backdrop-blur-xl flex-1"
    >
      <div className="absolute inset-0 rounded-2xl opacity-30"
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.1), transparent 60%)',
        }}
      />

      <div className="relative h-full flex flex-col">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-xs text-white/40">{subtitle}</p>
        </div>

        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="label" stroke="#ffffff30" style={{ fontSize: '10px' }} />
              <YAxis stroke="#ffffff30" style={{ fontSize: '10px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1d2e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotal)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
