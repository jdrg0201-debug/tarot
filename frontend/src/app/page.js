"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { playSound } from '@/components/common/MysticAtmosphere';

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => { setStep(1); playSound('whoosh'); }, 1000),
      setTimeout(() => { setStep(2); playSound('whoosh'); }, 4000),
      setTimeout(() => { setStep(3); playSound('sparkle'); }, 9000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleStart = () => {
    playSound('chime');
    router.push('/register');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white overflow-x-hidden overflow-y-auto relative px-6 bg-transparent">
      {/* Mystical Portal Ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-gold-500/10 rounded-full animate-pulse pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-red-600/10 rounded-full animate-[spin_60s_linear_infinite] pointer-events-none" />

      <div className="z-10 flex flex-col items-center max-w-4xl w-full">
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.h1
                key="step1"
                initial={{ opacity: 0, filter: "blur(20px)", scale: 0.8 }}
                animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                exit={{ opacity: 0, filter: "blur(20px)", scale: 1.1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="font-serif text-3xl md:text-5xl tracking-[0.2em] text-gold-500 text-mystic-glow"
              >
                No es casualidad que estés aquí...
              </motion.h1>
            )}
            {step === 2 && (
              <motion.h1
                key="step2"
                initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
                transition={{ duration: 1.2 }}
                className="font-serif text-2xl md:text-4xl tracking-wide text-gray-200"
              >
                Hay algo en tu vida sentimental <br className="hidden md:block" /> que necesita resolverse
              </motion.h1>
            )}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0, filter: "blur(20px)" }}
                  animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                  className="relative mb-16 px-4"
                >
                  <h1 className="font-serif text-3xl md:text-6xl text-gold-500 text-mystic-glow uppercase tracking-[0.1em] md:tracking-[0.3em] text-center">
                    Y lo sabes...
                  </h1>
                </motion.div>

                <motion.button
                  whileHover={{ 
                    scale: 1.05, 
                    boxShadow: "0px 0px 40px rgba(212, 175, 55, 0.5)",
                  }}
                  onHoverStart={() => playSound('sparkle')}
                  whileTap={{ scale: 0.95 }}
                  className="px-12 py-6 bg-[#0a0a0a] border-2 border-gold-500/50 rounded-full text-gold-500 font-serif tracking-[0.3em] uppercase text-sm shadow-[0_0_30px_rgba(212,175,55,0.2)] flex items-center justify-center backdrop-blur-md relative overflow-hidden group transition-all"
                  onClick={handleStart}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-500/30 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700" />
                  <span className="relative z-10">Revelar Mi Destino</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
