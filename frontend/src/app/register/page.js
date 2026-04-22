"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css'; 
import { playSound } from '@/components/common/MysticAtmosphere';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone || !reason.trim()) return;
    
    playSound('chime');
    setLoading(true);

    // Generate/retrieve userId and save data locally first
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userId', userId);
    }
    localStorage.setItem('userName', name);
    localStorage.setItem('userPhone', phone);
    localStorage.setItem('userReason', reason);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      if (backendUrl) {
        await fetch(`${backendUrl}/api/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, name, phone, reason })
        });
      }
    } catch (err) {
      // Backend error is non-blocking — user still progresses
      console.warn('Backend registration failed (non-blocking):', err);
    } finally {
      setLoading(false);
      router.push('/scanner');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen text-white p-4 relative overflow-x-hidden overflow-y-auto bg-transparent">
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 1 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl text-gold-500 mb-2 text-mystic-glow uppercase tracking-[0.2em]">
            Tu Camino Comienza...
          </h1>
          <p className="font-sans text-red-300/60 text-[10px] uppercase tracking-widest font-bold">
            Explícanos brevemente qué revelación buscas hoy
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 glass-mystic p-8 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* Decorative background flare */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-2 group">
            <label className="font-sans text-[9px] uppercase tracking-[0.3em] text-gold-500/50 ml-1 font-bold">Nombre Sagrado</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => playSound('sparkle')}
              placeholder="Ej. María Sánchez"
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-gold-500/50 transition-all placeholder:text-gray-700 font-serif tracking-widest"
            />
            <AnimatePresence>
              {name.length > 3 && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-gold-500 text-[10px] italic ml-1 font-serif"
                >
                  Tu energía es fuerte, {name}...
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2">
            <label className="font-sans text-[9px] uppercase tracking-[0.3em] text-gold-500/50 ml-1 font-bold">Vínculo de Comunicación (WhatsApp)</label>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-1 focus-within:border-gold-500/50 transition-all">
              <PhoneInput
                international
                defaultCountry="US"
                value={phone}
                onChange={setPhone}
                onFocus={() => playSound('sparkle')}
                className="phone-input-custom"
                placeholder="Número de conexión"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-sans text-[9px] uppercase tracking-[0.3em] text-gold-500/50 ml-1 font-bold">¿Qué te aflige el alma?</label>
            <textarea 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onFocus={() => playSound('sparkle')}
              placeholder="Ej. El regreso de mi ser amado..."
              required
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-gold-500/50 transition-all placeholder:text-gray-700 font-serif tracking-widest resize-none"
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading || !name.trim() || !phone || !reason.trim()}
            whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(212,175,55,0.4)" }}
            onHoverStart={() => playSound('sparkle')}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-5 rounded-2xl font-serif font-bold tracking-[0.3em] uppercase text-xs transition-all flex items-center justify-center gap-3
              ${(!name.trim() || !phone || !reason.trim() || loading) ? 'bg-gray-900 text-gray-700 cursor-not-allowed border border-white/5' : 'bg-gold-500 text-black shadow-[0_10px_30px_rgba(212,175,55,0.3)]'}`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Abriendo Portales...
              </>
            ) : 'Iniciar Ritual Espiritual'}
          </motion.button>
        </form>
      </motion.div>
      <style jsx global>{`
        .phone-input-custom .PhoneInputInput {
          background: transparent;
          border: none;
          color: white;
          padding: 15px 10px;
          outline: none;
          font-family: var(--font-cinzel);
          letter-spacing: 0.1em;
        }
        .phone-input-custom .PhoneInputCountryIcon {
          box-shadow: none;
          border: 1px solid rgba(255,255,255,0.1);
        }
      `}</style>
    </div>
  );
}
