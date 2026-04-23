import { motion } from "motion/react";

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#080a12]" />

      <motion.div
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{
          y: [0, 50, 0],
          x: [0, 30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12), transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{
          y: [0, -40, 0],
          x: [0, -20, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-1/4 left-1/3 w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1), transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{
          y: [0, 60, 0],
          x: [0, -40, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#080a12]/50" />
    </div>
  );
}
