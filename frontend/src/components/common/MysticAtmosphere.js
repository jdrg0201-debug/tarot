"use client";
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export const playSound = (type) => {
  const sounds = {
    sparkle: '/sounds/sparkle.mp3',
    chime: '/sounds/chime.mp3',
    whoosh: '/sounds/whoosh.mp3',
    click: '/sounds/click-magic.mp3'
  };
  const audio = new Audio(sounds[type]);
  audio.volume = 0.3;
  audio.play().catch(() => {});
};

export default function MysticAtmosphere() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState([]);
  const audioRef = useRef(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Initial particles
    const initialParticles = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 5 + 5,
      delay: Math.random() * 5
    }));
    setParticles(initialParticles);

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const enableAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsAudioEnabled(true);
    }
  };

  return (
    <>
      {/* Ambient Audio */}
      <audio 
        ref={audioRef}
        src="/sounds/ambient-mystic.mp3" 
        loop 
        preload="auto"
      />

      {/* particles background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle animate-magical-float"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              '--x': `${(Math.random() - 0.5) * 200}px`,
              '--y': `${-300}px`,
              '--duration': `${p.duration}s`,
              '--delay': `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Magical Cursor */}
      <motion.div
        className="magic-cursor hidden md:block"
        animate={{
          x: mousePos.x - 10,
          y: mousePos.y - 10,
          scale: 1,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 250, restDelta: 0.001 }}
      />

      {/* Audio Toggle (Discreet) */}
      {!isAudioEnabled && !pathname?.includes('/admin') && !pathname?.includes('/chat') && (
        <button 
          onClick={enableAudio}
          className="fixed bottom-4 right-4 z-50 p-2 bg-gold-500/10 border border-gold-500/30 rounded-full text-gold-500 text-[8px] uppercase tracking-widest hover:bg-gold-500/20 transition-all opacity-40 hover:opacity-100"
        >
          🔮 Activar Magia
        </button>
      )}
    </>
  );
}
