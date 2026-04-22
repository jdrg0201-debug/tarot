"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { playSound } from '@/components/common/MysticAtmosphere';

export default function TarotPage() {
  const router = useRouter();
  const [selected, setSelected] = useState(null);
  const [revealedCard, setRevealedCard] = useState(null);

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

  // Pre-load all tarot images on mount
  useEffect(() => {
    tarotCards.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const handleSelect = (index) => {
    if (selected !== null) return;

    const randomPath = tarotCards[Math.floor(Math.random() * tarotCards.length)];
    setRevealedCard(randomPath);
    setSelected(index);

    playSound('chime');
    setTimeout(() => playSound('sparkle'), 700);

    // Navigate to quiz after flip completes
    setTimeout(() => {
      router.push('/quiz');
    }, 4500);
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen text-white p-6 relative overflow-x-hidden overflow-y-auto bg-transparent"
      style={{ perspective: '1200px' }}
    >
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1 }}
        className="text-center mb-16 z-20"
      >
        <h1 className="font-serif text-3xl md:text-6xl text-gold-500 mb-6 tracking-[0.4em] uppercase text-mystic-glow">
          Revela tu Destino
        </h1>
        <p className="font-sans text-red-300/50 italic tracking-[0.5em] text-[10px] uppercase font-bold">
          El cosmos ha hablado a través de tu intención sagrada
        </p>
      </motion.div>

      {/* 3 Cards */}
      <div className="flex flex-wrap justify-center gap-8 md:gap-16 z-10">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            animate={{
              opacity: selected !== null && selected !== i ? 0.15 : 1,
              y: 0,
              scale: selected === i ? 1.15 : 1,
            }}
            transition={{ delay: i * 0.25, duration: 0.6 }}
            className={`relative w-52 h-80 md:w-72 md:h-[28rem] cursor-pointer
              ${selected === i ? 'z-50' : 'z-10'}
              ${selected !== null && selected !== i ? 'pointer-events-none' : ''}
            `}
            style={{ perspective: '1200px' }}
            onClick={() => handleSelect(i)}
          >
            {/* CSS flip container */}
            <div
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                transformStyle: 'preserve-3d',
                transition: selected === i
                  ? 'transform 1.2s cubic-bezier(0.4, 0.0, 0.2, 1)'
                  : 'none',
                transform: selected === i ? 'rotateY(180deg)' : 'rotateY(0deg)',
                willChange: 'transform',
              }}
            >
              {/* BACK FACE */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  borderRadius: '2rem',
                  overflow: 'hidden',
                  border: '2px solid rgba(212,175,55,0.2)',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                  background: '#050510',
                }}
              >
                <NextImage
                  src="/images/card-back.png"
                  alt="Arcano"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  style={{ objectFit: 'cover', opacity: 0.85 }}
                  priority
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(135deg, rgba(88,28,135,0.3), transparent, rgba(212,175,55,0.05))',
                  mixBlendMode: 'color-dodge'
                }} />

                {/* Hover glow when not selected */}
                {selected === null && (
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '2rem',
                    boxShadow: 'inset 0 0 40px rgba(212,175,55,0.0)',
                    transition: 'box-shadow 0.3s ease',
                  }} className="card-hover-glow" />
                )}
              </div>

              {/* FRONT FACE */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  borderRadius: '2rem',
                  overflow: 'hidden',
                  border: '2px solid rgba(212,175,55,0.7)',
                  boxShadow: '0 0 80px rgba(212,175,55,0.35)',
                  background: '#000',
                }}
              >
                {revealedCard && (
                  <NextImage
                    src={revealedCard}
                    alt="Carta del Tarot"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                )}
                <div style={{
                  position: 'absolute', inset: 0,
                  boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)',
                  pointerEvents: 'none',
                }} />
              </div>
            </div>

            {/* Revealed Message Under Chosen Card */}
            <AnimatePresence>
              {selected === i && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5, duration: 1 }}
                  className="absolute top-full mt-6 left-1/2 -translate-x-1/2 w-80 text-center pointer-events-none"
                >
                  <p className="font-serif text-xl md:text-2xl text-white leading-relaxed text-mystic-glow drop-shadow-xl h-auto">
                    Tu destino ha sido revelado.
                  </p>
                  <p className="text-gold-500 text-[10px] mt-3 italic font-sans tracking-[0.4em] uppercase font-bold animate-pulse drop-shadow-xl">
                    Interpretando fuerzas...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        ))}
      </div>

    </div>
  );
}
