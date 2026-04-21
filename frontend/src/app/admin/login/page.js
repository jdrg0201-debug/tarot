"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Lock, User, Eye, EyeOff } from 'lucide-react';
import { playSound } from '@/components/common/MysticAtmosphere';

// Principal credentials (Supabase)
const ADMIN_EMAIL = 'angel@tarot.com';
const ADMIN_PASSWORD = 'MaestroAngel777';

// Backup credentials (Legacy/MongoDB)
const BACKUP_EMAIL = 'admin@tarot.com';
const BACKUP_PASSWORD = 'admin123';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    playSound('click-magic');

    // Small delay for UX effect
    setTimeout(() => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      const isPrimaryMatch = cleanEmail === ADMIN_EMAIL && cleanPassword === ADMIN_PASSWORD;
      const isBackupMatch = cleanEmail === BACKUP_EMAIL && cleanPassword === BACKUP_PASSWORD;

      if (isPrimaryMatch || isBackupMatch) {
        playSound('sparkle');
        localStorage.setItem('admin_token', 'mistic_token_123');
        router.push('/admin');
      } else {
        setError('Acceso denegado. Las credenciales no coinciden.');
        playSound('whoosh');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-cosmic flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background pulses */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[150px] animate-pulse" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30, filter: 'blur(20px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        className="relative z-10 w-full max-w-md glass-mystic p-10 rounded-[2.5rem] border border-gold-500/20 shadow-[0_30px_100px_rgba(0,0,0,0.5)]"
      >
        <div className="text-center mb-10">
           <div className="w-20 h-20 bg-dark-900 border-2 border-gold-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
              <Shield className="text-gold-500" size={36} />
           </div>
           <h1 className="text-3xl font-serif text-gold-500 tracking-[0.2em] uppercase text-mystic-glow">PANEL ADMINISTRATIVO</h1>
           <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em] mt-3 font-bold">Inicia el ritual administrativo</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
           <div className="space-y-2">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-1">E-mail Sagrado</label>
              <div className="relative">
                 <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500/40" size={18} />
                 <input 
                   type="email" 
                   required
                   value={email}
                   onChange={e => setEmail(e.target.value)}
                   placeholder="maestro@cosmos.com"
                   className="w-full bg-dark-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-gold-500/50 outline-none transition-all placeholder:text-gray-700 font-serif"
                 />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-1">Palabra de Poder</label>
              <div className="relative">
                 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500/40" size={18} />
                 <input 
                   type={showPassword ? "text" : "password"}
                   required
                   value={password}
                   onChange={e => setPassword(e.target.value)}
                   placeholder="********"
                   className="w-full bg-dark-950 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white focus:border-gold-500/50 outline-none transition-all placeholder:text-gray-700 font-serif"
                 />
                 <button 
                   type="button" 
                   onClick={() => setShowPassword(!showPassword)}
                   className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                 >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                 </button>
              </div>
           </div>

           {error && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-2 px-4 bg-red-950/30 border border-red-500/30 rounded-xl">
                <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{error}</span>
             </motion.div>
           )}

           <button 
             type="submit" 
             disabled={loading}
             className="w-full py-5 bg-gradient-to-r from-gold-600 to-yellow-400 text-black font-bold uppercase tracking-[0.3em] rounded-2xl shadow-[0_10px_40px_rgba(212,175,55,0.2)] hover:shadow-[0_15px_60px_rgba(212,175,55,0.4)] hover:scale-[1.02] transition-all disabled:opacity-50 mt-4"
           >
              {loading ? 'Validando Energía...' : 'Entrar al Templo'}
           </button>
        </form>

        <div className="mt-10 text-center">
            <button onClick={() => router.push('/')} className="text-gray-600 text-[10px] uppercase tracking-widest font-bold hover:text-gold-500 transition-colors">Volver al Infinito</button>
        </div>
      </motion.div>
    </div>
  );
}
