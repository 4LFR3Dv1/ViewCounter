import { motion } from "motion/react";

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#050812]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />

      <motion.div
        className="absolute -top-24 left-[12%] h-[30rem] w-[30rem] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(14, 165, 233, 0.18), transparent 70%)",
          filter: "blur(80px)",
        }}
        animate={{ y: [0, 45, 0], x: [0, 30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute right-[8%] top-[18%] h-[28rem] w-[28rem] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.16), transparent 70%)",
          filter: "blur(90px)",
        }}
        animate={{ y: [0, -38, 0], x: [0, -24, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute bottom-[3%] left-[24%] h-[32rem] w-[32rem] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(245, 158, 11, 0.1), transparent 70%)",
          filter: "blur(90px)",
        }}
        animate={{ y: [0, 54, 0], x: [0, -34, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute left-1/2 top-1/2 h-[44rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/10"
        animate={{ rotate: 360, scale: [1, 1.04, 1] }}
        transition={{ rotate: { duration: 42, repeat: Infinity, ease: "linear" }, scale: { duration: 9, repeat: Infinity } }}
      />
      <motion.div
        className="absolute left-[58%] top-[48%] h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-200/10"
        animate={{ rotate: -360, scale: [1, 0.96, 1] }}
        transition={{ rotate: { duration: 36, repeat: Infinity, ease: "linear" }, scale: { duration: 8, repeat: Infinity } }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050812]/20 to-[#050812]" />
    </div>
  );
}
