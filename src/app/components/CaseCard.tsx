import { motion } from "motion/react";
import { ArrowUpRight, Play, Radio } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
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

function formatCompact(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
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
  delay = 0,
}: CaseCardProps) {
  const data = chartData.map((value, index) => ({ value, index }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -5 }}
      className="group relative cursor-pointer"
    >
      <div
        className="absolute inset-0 rounded-[1.7rem] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle at center, ${color}24, transparent 72%)` }}
      />

      <div className="relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#0b111b]/86 backdrop-blur-xl">
        <div className="relative h-36 overflow-hidden">
          {thumbnail ? (
            <ImageWithFallback src={thumbnail} alt={title} className="h-full w-full object-cover opacity-60" />
          ) : (
            <>
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(circle at 30% 20%, ${color}44, transparent 42%), linear-gradient(135deg, #101827, #080b13 58%, ${color}22)`,
                }}
              />
              <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(135deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:18px_18px]" />
              <div className="absolute inset-0 grid place-items-center">
                <div className="grid h-14 w-14 place-items-center rounded-full border border-white/12 bg-black/35 backdrop-blur-xl">
                  <Play className="h-6 w-6 text-white/58" />
                </div>
              </div>
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b111b] via-[#0b111b]/15 to-transparent" />
          <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/70 backdrop-blur-xl">
            <Radio className={`h-3 w-3 ${status === "live" ? "text-emerald-300" : "text-white/50"}`} />
            <span>{status}</span>
          </div>
          <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-xs text-white/75 backdrop-blur-xl">
            {platform}
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-white transition-colors group-hover:text-cyan-100">
              {title}
            </h3>
            <p className="mt-1 text-sm leading-5 text-white/45">{strategy}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">antes</p>
              <p className="mt-1 text-sm font-semibold text-white/65">{formatCompact(before)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">depois</p>
              <p className="mt-1 text-sm font-semibold text-white">{formatCompact(after)}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/10 p-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-200/55">growth</p>
              <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-emerald-300">
                <ArrowUpRight className="h-3 w-3" />+{growth}%
              </p>
            </div>
          </div>

          <div className="h-16 rounded-2xl border border-white/10 bg-black/20 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.length > 0 ? data : [{ value: before, index: 0 }, { value: after, index: 1 }]}>
                <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.4} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
