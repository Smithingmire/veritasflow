import React from 'react';
import { motion } from 'framer-motion';

export const LiquidBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#050505]">
      {/* Dark Ambient overlay */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#050505] opacity-80" />

      {/* Blob 1: Cyan/Blue */}
      <motion.div
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full liquid-blob bg-gradient-to-br from-sky-300/20 to-blue-200/10 opacity-[0.08]"
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 50, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Blob 2: Purple/Violet */}
      <motion.div
        className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full liquid-blob bg-gradient-to-tl from-violet-300/20 to-purple-200/10 opacity-[0.08]"
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -30, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Blob 3: Cyan Accent */}
      <motion.div
        className="absolute top-[30%] right-[10%] w-[35vw] h-[35vw] rounded-full liquid-blob bg-gradient-to-tr from-teal-200/15 to-cyan-100/10 opacity-[0.06]"
        animate={{
          x: [0, 30, -40, 0],
          y: [0, 50, -20, 0],
          scale: [1, 1.2, 0.85, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Blob 4: Soft Central Highlight */}
      <motion.div
        className="absolute top-[40%] left-[20%] w-[40vw] h-[40vw] rounded-full liquid-blob bg-gradient-to-br from-white/5 to-slate-300/5 opacity-[0.04]"
        animate={{
          scale: [0.9, 1.1, 0.9],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Noise overlay texture */}
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
};
