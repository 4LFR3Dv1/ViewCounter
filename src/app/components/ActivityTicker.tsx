import { motion } from "motion/react";
import { Sparkles, TrendingUp, Award, Zap } from "lucide-react";
import type { ActivityEvent } from "../types/dashboard";

const fallbackActivities = [
  { icon: TrendingUp, text: "YouTube alimentando o total global", color: "#FF0033" },
  { icon: Sparkles, text: "TikTok aguardando aprovacao oficial", color: "#00f2ea" },
  { icon: Award, text: "Portfolio opera mesmo com cobertura parcial", color: "#a78bfa" },
  { icon: Zap, text: "Novas contas entram sem quebrar a interface", color: "#38bdf8" },
];

function getIcon(index: number) {
  const iconPool = [TrendingUp, Sparkles, Award, Zap];
  return iconPool[index % iconPool.length];
}

export function ActivityTicker({ activities }: { activities?: ActivityEvent[] }) {
  const items =
    activities && activities.length > 0
      ? activities.map((activity, index) => ({
          icon: getIcon(index),
          text: activity.text,
          color: activity.color,
        }))
      : fallbackActivities;
  const loop = [...items, ...items, ...items];

  return (
    <div className="relative overflow-hidden rounded-full border border-white/10 bg-[#07101a]/72 py-3 shadow-2xl shadow-black/20 backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#07101a] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#07101a] to-transparent" />

      <motion.div
        className="flex w-max items-center gap-3"
        animate={{ x: ["0%", "-33.333%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        {loop.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={`${item.text}-${index}`}
              className="mx-1 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2"
            >
              <div className="grid h-7 w-7 place-items-center rounded-full bg-white/5" style={{ color: item.color }}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <span className="whitespace-nowrap text-sm font-medium text-white/68">{item.text}</span>
              <motion.span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: item.color }}
                animate={{ opacity: [0.35, 1, 0.35], scale: [1, 1.4, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: index * 0.08 }}
              />
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
