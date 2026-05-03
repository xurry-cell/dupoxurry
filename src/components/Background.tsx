import React from 'react';
import { motion } from 'motion/react';

export default function AtmosphericBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-bento-bg overflow-hidden">
      {/* Soft warm glows */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] rounded-full bg-bento-accent/30 blur-[120px]"
      />
      
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-[0%] right-[0%] w-[50%] h-[50%] rounded-full bg-[#11ff9d] blur-[100px]"
      />

      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-20 pointer-events-none" />
    </div>
  );
}
