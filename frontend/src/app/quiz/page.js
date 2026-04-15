"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const questions = [
    {
      id: 1,
      text: "¿Sigues en contacto?",
      options: ["Sí", "No", "A veces"]
    },
    {
      id: 2,
      text: "¿Esa persona cambió contigo?",
      options: ["Sí", "No", "Mucho"]
    },
    {
      id: 3,
      text: "¿Qué quieres que pase?",
      options: ["Recuperarlo", "Que piense en mí", "Alejar a alguien", "Endulzarlo"]
    }
  ];

  const handleOption = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setStep(3); // Interpretation Step
    }
  };

  const handleFinalNext = () => {
    router.push('/transition');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a1a1a_0%,_transparent_80%)] opacity-30 pointer-events-none"></div>

      <AnimatePresence mode="wait">
        {step < questions.length ? (
          <motion.div
            key={`q-${step}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md z-10"
          >
            <div className="mb-4 text-center">
               <span className="text-[10px] uppercase tracking-[0.4em] text-gold-500/50">Precisión Energética</span>
               <div className="flex gap-1 justify-center mt-2">
                 {questions.map((_, i) => (
                   <div key={i} className={`h-1 w-8 rounded-full transition-all duration-500 ${i <= step ? 'bg-gold-500' : 'bg-white/10'}`} />
                 ))}
               </div>
            </div>

            <h2 className="font-serif text-2xl md:text-3xl text-center mb-10 text-white tracking-wide">
              {questions[step].text}
            </h2>

            <div className="grid gap-4">
              {questions[step].options.map((opt, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(212, 175, 55, 0.1)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleOption}
                  className="w-full py-5 px-6 rounded-2xl border border-white/10 bg-dark-900/50 backdrop-blur-md text-left font-sans text-gray-200 transition-all hover:border-gold-500/50"
                >
                  <div className="flex items-center justify-between">
                    <span>{opt}</span>
                    <div className="w-5 h-5 rounded-full border border-gold-500/30" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="interpretation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-2xl z-10 space-y-12 text-center"
          >
            <div className="space-y-6">
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="font-serif text-2xl md:text-3xl text-gold-500 italic"
              >
                "Lo que acabas de confirmar es clave..."
              </motion.p>
              
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 }}
                className="font-sans text-lg md:text-xl text-gray-300 leading-relaxed"
              >
                Tu caso muestra una conexión real, pero hay algo bloqueando el resultado que mereces.
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 4 }}
              className="bg-red-950/20 border border-red-900/30 p-8 rounded-3xl backdrop-blur-md"
            >
              <p className="font-serif text-xl md:text-2xl text-red-400 mb-4">
                Y esto no va a mejorar solo...
              </p>
              <p className="font-sans text-sm text-gray-400 uppercase tracking-widest leading-loose">
                De hecho, puede empeorar <br /> si no se actúa ahora mismo.
              </p>
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 6.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFinalNext}
              className="px-12 py-5 bg-gold-500 text-black font-bold rounded-full uppercase tracking-[0.2em] text-xs shadow-[0_10px_30px_rgba(212,175,55,0.4)]"
            >
              Consultar con el Maestro
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
