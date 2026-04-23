import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect } from "react";

interface LiveCounterProps {
  value: number;
  duration?: number;
}

export function LiveCounter({ value, duration = 2 }: LiveCounterProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    return Math.round(latest).toLocaleString('pt-BR');
  });

  useEffect(() => {
    const animation = animate(count, value, { duration, ease: "easeOut" });
    return animation.stop;
  }, [value, count, duration]);

  return <motion.span>{rounded}</motion.span>;
}
