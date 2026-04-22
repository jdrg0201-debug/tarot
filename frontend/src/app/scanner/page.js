"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Fingerprint } from 'lucide-react';
import { playSound } from '@/components/common/MysticAtmosphere';

const MESSAGES = [
  "Entrando en tu energía...",
  "Sintonizando emociones...",
  "Reconstruyendo recuerdos...",
  "Detectando sentimientos ocultos...",
  "Analizando vínculo sentimental..."
];

export default function ScannerPage() {
  const router = useRouter();
  const [isPressing, setIsPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  
  const timerRef = useRef(null);
  const messageIntervalRef = useRef(null);
  const soundIntervalRef = useRef(null);

  useEffect(() => {
    if (isPressing && !completed) {
      if (navigator.vibrate) navigator.vibrate(50);
      playSound('whoosh');

      soundIntervalRef.current = setInterval(() => {
        playSound('sparkle');
      }, 1000);
      
      timerRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(timerRef.current);
            clearInterval(messageIntervalRef.current);
            handleComplete();
            return 100;
          }
          return prev + 1;
        });
      }, 40);

      messageIntervalRef.current = setInterval(() => {
        setMessageIndex(prev => (prev < MESSAGES.length - 1 ? prev + 1 : prev));
      }, 800);

    } else {
      clearInterval(soundIntervalRef.current);
      if (!completed) {
        clearInterval(timerRef.current);
        clearInterval(messageIntervalRef.current);
        setProgress(0);
        setMessageIndex(0);
      }
    }

    return () => {
      clearInterval(timerRef.current);
      clearInterval(messageIntervalRef.current);
      clearInterval(soundIntervalRef.current);
    };
  }, [isPressing, completed]);

  const handleComplete = () => {
    playSound('chime');
    setCompleted(true);
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    
    setTimeout(() => {
      router.push('/tarot');
    }, 4000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white overflow-x-hidden overflow-y-auto relative select-none bg-transparent">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-red-950)_0%,_transparent_60%)] opacity-20 pointer-events-none"></div>
      
      {/* Particles */}
      {isPressing && !completed && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
             <div 
               key={i} 
               className="particle w-1 h-1 md:w-2 md:h-2"
               style={{
                 left: `${40 + Math.random() * 20}%`,
                 top: `${40 + Math.random() * 20}%`,
                 animationDelay: `${Math.random() * 2}s`
               }}
             />
          ))}
        </div>
      )}

      <div className="z-10 flex flex-col items-center w-full max-w-md px-6">
        
        <AnimatePresence mode="wait">
          {!completed ? (
            <motion.div 
              key="scanner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.9, filter: "blur(20px)" }}
              className="flex flex-col items-center w-full"
            >
              <h1 className="font-serif text-3xl md:text-5xl text-center mb-16 text-gold-500 tracking-[0.2em] text-mystic-glow uppercase">
                Conexión Digital
              </h1>

              <div 
                className="relative flex items-center justify-center w-56 h-56 rounded-full cursor-pointer touch-none glass-mystic"
                onMouseDown={() => setIsPressing(true)}
                onMouseUp={() => setIsPressing(false)}
                onMouseLeave={() => setIsPressing(false)}
                onTouchStart={(e) => { e.preventDefault(); setIsPressing(true); }}
                onTouchEnd={() => setIsPressing(false)}
              >
                {isPressing && (
                  <div className="absolute inset-x-[-30px] inset-y-[-30px] rounded-full fingerprint-pulse pointer-events-none opacity-50"></div>
                )}
                
                <motion.div 
                  className={`absolute inset-0 border-2 rounded-full transition-all duration-500 ${isPressing ? 'border-gold-500 shadow-[0_0_60px_rgba(212,175,55,0.6)]' : 'border-red-900/30'}`}
                  animate={{ scale: isPressing ? 1.15 : 1 }}
                />

                <div className={`transition-all duration-700 flex flex-col items-center ${isPressing ? 'scale-110' : 'scale-100'}`}>
                  <Fingerprint 
                    size={110} 
                    strokeWidth={0.5} 
                    className={`transition-colors duration-500 ${isPressing ? 'text-gold-500 animate-pulse' : 'text-red-600 opacity-20'}`} 
                  />
                </div>

                {isPressing && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -bottom-24 w-80 text-center font-serif text-sm text-gold-500 italic tracking-[0.2em] uppercase font-bold text-mystic-glow"
                  >
                    {MESSAGES[messageIndex]}
                  </motion.div>
                )}
              </div>

              {/* Progress Bar Container */}
              <div className="w-full mt-40 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <motion.div 
                  className="h-full bg-gradient-to-r from-red-900 via-gold-500 to-white shadow-[0_0_15px_rgba(212,175,55,1)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-4 text-[10px] uppercase tracking-[0.5em] text-gold-500/40 font-bold">Analizando frecuencia del alma</p>
            </motion.div>
          ) : (
            <motion.div 
              key="completed"
              initial={{ opacity: 0, scale: 0.8, filter: "blur(20px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              className="flex flex-col items-center text-center space-y-12"
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-serif text-4xl md:text-5xl text-gold-500 tracking-wider leading-tight text-mystic-glow uppercase"
              >
                No estás imaginando las cosas...
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="space-y-6"
              >
                <p className="font-serif text-3xl text-white tracking-widest uppercase">Hay una conexión activa</p>
                <div className="h-px w-24 bg-gold-500/30 mx-auto" />
                <p className="font-serif text-2xl text-red-500 italic font-bold">Y no se ha cerrado el portal</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.5 }}
                className="pt-10"
              >
                <div className="w-10 h-10 rounded-full border-t-2 border-r-2 border-gold-500 shadow-[0_0_15px_rgba(212,175,55,0.5)] animate-spin mx-auto mb-6" />
                <p className="text-[10px] uppercase tracking-[0.4em] text-gold-500/60 font-bold animate-pulse">Sincronizando con el gran destino...</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
