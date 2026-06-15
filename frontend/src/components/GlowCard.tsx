import React, { useRef, useState } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../utils/cn'; // Let's make a utility file for tailwind merge

interface GlowCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  glowColor?: string; // e.g. 'rgba(0, 240, 255, 0.15)'
  delay?: number;
}

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className,
  glowColor = 'rgba(255, 255, 255, 0.08)',
  delay = 0,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCoords({ x, y });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ 
        duration: 0.8, 
        delay, 
        type: "spring", 
        stiffness: 70, 
        damping: 15 
      }}
      className={cn(
        "glass-panel glass-panel-hover relative overflow-hidden rounded-2xl p-6 text-left",
        className
      )}
      style={{
        // Define mouse coords as CSS variables for reactive gradient
        ['--mouse-x' as any]: `${coords.x}px`,
        ['--mouse-y' as any]: `${coords.y}px`,
      } as React.CSSProperties}
      {...props}
    >
      {/* Light Reflection Layer */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-10"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), ${glowColor}, transparent 80%)`,
        }}
      />

      {/* Subtle border highlight reflection */}
      <div 
        className="absolute inset-0 pointer-events-none rounded-2xl z-20 border border-transparent transition-all duration-300"
        style={{
          borderImage: isHovered 
            ? `radial-gradient(150px circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 50%, transparent 100%) 1`
            : undefined
        }}
      />

      {/* Inner Card Content */}
      <div className="relative z-30 h-full w-full">
        {children}
      </div>
    </motion.div>
  );
};
