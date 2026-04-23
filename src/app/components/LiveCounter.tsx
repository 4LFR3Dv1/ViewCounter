import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect } from "react";

interface LiveCounterProps {
  value: number;
  duration?: number;
}

export function LiveCounter({ value, duration = 2 }: LiveCounterProps) {
  const count = useMotionValue(0);
  const finalText = Math.round(value).toLocaleString("pt-BR");
  const rounded = useTransform(count, (latest) => {
    return Math.round(latest).toLocaleString("pt-BR");
  });

  useEffect(() => {
    const animation = animate(count, value, { duration, ease: "easeOut" });
    return animation.stop;
  }, [value, count, duration]);

  return (
    <motion.span
      className="inline-block tabular-nums"
      style={{
        minWidth: `${finalText.length}ch`,
        fontVariantNumeric: "tabular-nums",
        fontFeatureSettings: '"tnum" 1, "lnum" 1',
      }}
    >
      {rounded}
    </motion.span>
  );
}
