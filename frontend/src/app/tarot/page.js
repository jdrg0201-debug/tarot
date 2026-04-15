"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { playSound } from '@/components/common/MysticAtmosphere';

export default function TarotPage() {
  const router = useRouter();
  const [selected, setSelected] = useState(null);
  const [revealedCard, setRevealedCard] = useState(null);
  const [isFlipping, setIsFlipping] = useState(false);

  // Pool of available cards (must match the absolute paths in /public/images/tarot/)
  const tarotCards = [
    "/images/tarot/card1.png",
    "/images/tarot/card2.png",
    "/images/tarot/card3.png",
    "/images/tarot/card4.png",
    "/images/tarot/card5.png",
    "/images/tarot/card6.png",
    "/images/tarot/card7.png",
    "/images/tarot/card8.png",
    "/images/tarot/card9.png"
  ];

  // Pre-load images as soon as component mounts
  useEffect(() => {
    tarotCards.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const handleSelect = (index) => {
    if (selected !== null) return;
    
    // Choose the random mystery image immediately
    const randomPath = tarotCards[Math.floor(Math.random() * tarotCards.length)];
    
    setRevealedCard(randomPath);
    setSelected(index);
    setIsFlipping(true);
    
    // Sound interaction
    playSound('chime');
    setTimeout(() => playSound('sparkle'), 600);
    
    // Auto-advance ritual
    setTimeout(() => {
      router.push('/quiz');
    }, 9000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white p-6 relative overflow-hidden bg-transparent" style={{ perspective: '2000px' }}>
      
      {/* Title section */}
      <motion.div 
        initial={{ opacity: 0, y: -20, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        className="text-center mb-16 z-20"
      >
        <h1 className="font-serif text-3xl md:text-6xl text-gold-500 mb-6 tracking-[0.4em] uppercase text-mystic-glow">
          Revela tu Destino
        </h1>
        <p className="font-sans text-purple-200/50 italic tracking-[0.5em] text-[10px] uppercase font-bold">
          El cosmos ha hablado a través de tu intención sagrada
        </p>
      </motion.div>

      {/* 3 Interactive Cards */}
      <div className="flex flex-wrap justify-center gap-8 md:gap-16 z-10 max-w-7xl">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: selected === i ? 1.25 : 1,
              rotateY: selected === i ? 180 : 0,
              y: selected === null ? 0 : (selected === i ? -60 : 0),
              filter: selected === null ? "blur(0px)" : (selected === i ? "blur(0px)" : "blur(12px)")
            }}
            transition={{ 
              rotateY: { duration: 1.8, ease: [0.6, 0.05, -0.01, 0.9] },
              scale: { duration: 0.8 },
              opacity: { delay: i * 0.3 }
            }}
            whileHover={selected === null ? { 
              y: -50, 
              scale: 1.05,
              transition: { duration: 0.4 }
            } : {}}
            onHoverStart={() => selected === null && playSound('whoosh')}
            onClick={() => handleSelect(i)}
            className={`relative w-64 h-96 md:w-80 md:h-[30rem] cursor-pointer transform-gpu
              ${selected === i ? 'z-50' : 'z-10'}
              ${selected !== null && selected !== i ? 'opacity-20 pointer-events-none' : 'opacity-100'}
            `}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* BACK FACE */}
            <div 
              className="absolute inset-0 w-full h-full rounded-[2.5rem] overflow-hidden glass-mystic p-3 border-2 border-gold-500/20 shadow-2xl bg-[#050505]"
              style={{ backfaceVisibility: 'hidden' }}
            >
               <div className="w-full h-full rounded-[2rem] overflow-hidden relative">
                 <img 
                   src="/images/card-back.png" 
                   alt="Arcano" 
                   className="w-full h-full object-cover opacity-80"
                   loading="eager"
                 />
                 <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/40 via-transparent to-gold-500/5 mix-blend-color-dodge" />
               </div>
            </div>

            {/* FRONT FACE (Shown on Flip) */}
            <div 
              className="absolute inset-0 w-full h-full rounded-[2.5rem] bg-black border-2 border-gold-500 overflow-hidden shadow-[0_0_120px_rgba(212,175,55,0.4)]"
              style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
            >
               {selected === i && revealedCard && (
                 <div className="w-full h-full relative flex items-center justify-center">
                    {/* High-quality revealed card */}
                    <img 
                       src={revealedCard} 
                       className="w-full h-full object-cover"
                       alt="Mandala del Destino"
                       loading="eager"
                    />
                    
                    {/* Final mystic layer for depth */}
                    <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.8)] pointer-events-none" />
                    <motion.div 
                       initial={{ opacity: 0 }} 
                       animate={{ opacity: 1 }} 
                       transition={{ delay: 0.8, duration: 1 }}
                       className="absolute inset-0 bg-gold-500/5 mix-blend-overlay"
                    />
                 </div>
               )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Confirmation Message */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 2.2, duration: 1.2 }}
            className="mt-20 text-center z-20 max-w-2xl px-10"
          >
            <motion.p 
              className="font-serif text-3xl md:text-5xl text-white leading-relaxed text-mystic-glow"
            >
              Las sombras se han disipado... tu verdad ha hablado.
            </motion.p>
            <div className="h-px w-32 bg-gold-500/50 mx-auto mt-8" />
            <p className="text-gold-500 text-[10px] mt-8 italic font-sans tracking-[0.6em] uppercase font-bold animate-pulse">
              Interpretando fuerzas astrales...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
