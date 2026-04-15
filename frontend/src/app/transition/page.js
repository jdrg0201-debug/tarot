"use client";
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function TransitionPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/chat');
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#2d1b4e_0%,_transparent_70%)] opacity-30 pointer-events-none animate-pulse"></div>

      <div className="z-10 flex flex-col items-center text-center space-y-12">
        <motion.div
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 1 }}
           className="relative"
        >
          {/* Animated Energy Rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="w-48 h-48 rounded-full border border-gold-500/20" 
            />
            <motion.div 
              animate={{ rotate: -360, scale: [1.2, 1, 1.2] }} 
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              className="absolute w-64 h-64 rounded-full border-[0.5px] border-purple-500/20" 
            />
          </div>

          <div className="relative bg-dark-900 w-32 h-32 rounded-full flex items-center justify-center border border-gold-500/40 shadow-[0_0_50px_rgba(212,175,55,0.2)]">
            <div className="w-16 h-16 border-t-2 border-r-2 border-gold-500 rounded-full animate-spin" />
          </div>
        </motion.div>

        <div className="space-y-4">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="font-serif text-2xl text-gold-500 tracking-widest"
          >
            Voy a enviar tu caso directamente al maestro...
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3 }}
            className="font-sans text-sm text-gray-400 uppercase tracking-[0.3em]"
          >
            Él va a revisar lo que está pasando contigo
          </motion.p>
        </div>
      </div>
      
      {/* Background glitch/energy effects */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="h-full w-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>
    </div>
  );
}
