"use client";

import { Gift } from "lucide-react";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import Link from "next/link";
import { useState, useEffect } from "react";

export const AnimatedLogo = () => {
  const [key, setKey] = useState(0);
  const [wasScrolled, setWasScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100) {
      setWasScrolled(true);
    } else if (wasScrolled && latest <= 100) {
      // Trigger animation when returning to top
      setKey(prev => prev + 1);
      setWasScrolled(false);
    }
  });

  return (
    <Link
      href="/"
      className="relative z-20 flex items-center gap-1 group"
      onMouseEnter={() => setKey(prev => prev + 1)}
    >
      {/* Animated Logo Mark */}
      <div className="relative w-9 h-9">
        {/* Rotating shapes */}
        <motion.div
          key={`shape1-${key}`}
          className="absolute w-[80%] h-[80%] top-[10%] left-[10%] rounded-[20%] bg-[#d4b483] mix-blend-multiply"
          initial={{ rotate: 45 }}
          animate={{ rotate: 180 }}
          transition={{
            duration: 2,
            ease: [0.66, -0.7, 0.27, 1.6],
          }}
        />
        <motion.div
          key={`shape2-${key}`}
          className="absolute w-[80%] h-[80%] top-[10%] left-[10%] rounded-[20%] bg-[#556b68] mix-blend-multiply"
          initial={{ rotate: 45 }}
          animate={{ rotate: 270 }}
          transition={{
            duration: 2,
            ease: [0.66, -0.7, 0.27, 1.6],
          }}
        />
        <motion.div
          key={`shape3-${key}`}
          className="absolute w-[80%] h-[80%] top-[10%] left-[10%] rounded-[20%] bg-[#96ceb4] mix-blend-multiply"
          initial={{ rotate: 45 }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            ease: [0.66, -0.7, 0.27, 1.6],
          }}
        />
        
    
        <Gift className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-foreground stroke-[1.5]" />
      </div>

      {/* Brand Text */}
      <motion.div 
        className="flex flex-col"
        whileHover={{ x: 2 }}
        transition={{ duration: 0.2 }}
      >
        <span className="font-extrabold text-foreground text-base tracking-wider leading-none">
          MONNIEGIFT
        </span>
       
      </motion.div>
    </Link>
  );
};
