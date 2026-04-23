import { motion } from "motion/react";
import { ArrowUpRight, Play, Radio } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface CaseCardProps {
  title: string;
  platform: string;
  before: number;
  after: number;
  growth: number;
  strategy: string;
  thumbnail?: string;
  chartData: number[];
  color: string;
  status?: "live" | "stable" | "archived";
  delay?: number;
}

export function CaseCard({
  title,
  platform,
  before,
  after,
  growth,
  strategy,
  thumbnail,
  chartData,
  color,
  status = "live",
  delay = 0
}: CaseCardProps) {
  const data = chartData.map((value, index) => ({ value, index }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group relative cursor-pointer"
    >
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at center, ${color}30, transparent 70%)`,
          filter: 'blur(20px)'
        }}
      />

      <div className="relative bg-[#0f1117] border border-white/5 rounded-xl overflow-hidden h-full flex flex-col">
        <div className="relative h-24 overflow-hidden">
          {thumbnail ? (
            <ImageWithFallback
              src={thumbnail}
              alt={title}
              className="h-full w-full object-cover opacity-60"
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 to-purple-900/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="w-8 h-8 text-white/50" />
              </div>
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-[#0f1117]/15 to-transparent" />
          <div className="absolute top-2 right-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-black/50 backdrop-blur-xl text-white border border-white/10">
              {platform}
            </span>
          </div>
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-white/70">
            <Radio className={`h-3 w-3 ${status === "live" ? "text-emerald-300" : "text-white/50"}`} />
            <span>{status}</span>
          </div>
        </div>

        <div className="p-3 space-y-2 flex-1 flex flex-col">
          <div>
            <h3 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">
              {title}
            </h3>
            <p className="text-xs text-white/40">{strategy}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-white/40 mb-0.5">Antes</p>
              <p className="font-semibold text-white/60">{(before / 1000).toFixed(0)}k</p>
            </div>
            <div>
              <p className="text-white/40 mb-0.5">Depois</p>
              <p className="font-semibold text-white">{(after / 1000).toFixed(0)}k</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-auto">
            <div className="flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" style={{ color }} />
              <span className="text-xs font-semibold" style={{ color }}>
                +{growth}%
              </span>
            </div>

            <div className="w-16 h-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
