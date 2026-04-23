import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, Award, Zap } from "lucide-react";
import type { ActivityEvent } from "../types/dashboard";

const fallbackActivities = [
  { icon: TrendingUp, text: "Instagram +18,2k views hoje", color: "#E1306C" },
  { icon: Sparkles, text: "TikTok em aceleracao", color: "#00f2ea" },
  { icon: Award, text: "Novo recorde semanal alcancado", color: "#a78bfa" },
  { icon: Zap, text: "YouTube +8.2% crescimento", color: "#FF0000" },
];

function getIcon(index: number) {
  const iconPool = [TrendingUp, Sparkles, Award, Zap];
  return iconPool[index % iconPool.length];
}

export function ActivityTicker({ activities }: { activities?: ActivityEvent[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const items =
    activities && activities.length > 0
      ? activities.map((activity, index) => ({
          icon: getIcon(index),
          text: activity.text,
          color: activity.color,
        }))
      : fallbackActivities;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [items.length]);

  const current = items[currentIndex];
  const Icon = current.icon;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-transparent via-white/5 to-transparent py-3 border-y border-white/5">
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="flex items-center justify-center gap-3"
      >
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <Icon className="w-4 h-4" style={{ color: current.color }} />
        </motion.div>
        <span className="text-white/70 text-sm font-medium">{current.text}</span>
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: current.color }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
    </div>
  );
}
