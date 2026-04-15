"use client";
import React, { useEffect, useState } from 'react';
import ChatInterface from '@/components/chat/ChatInterface';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ChatPage() {
  const [userId, setUserId] = useState('');
  const [adminSettings, setAdminSettings] = useState({ name: 'Maestro', avatar: '' });

  useEffect(() => {
    // Basic user tracking
    let storedId = localStorage.getItem('userId');
    if (!storedId) {
      storedId = 'user_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('userId', storedId);
    }
    setUserId(storedId);

    // Load admin profile from Supabase
    const loadAdminSettings = async () => {
      try {
        const { data } = await supabase
          .from('configuracion_admin')
          .select('nombre, avatar')
          .single();
        if (data) {
          setAdminSettings({
            name: data.nombre || 'Maestro',
            avatar: data.avatar || ''
          });
        }
      } catch (e) {
        // use defaults
      }
    };
    loadAdminSettings();
  }, []);

  if (!userId) return null;

  return (
    <div
      className="bg-[#0a0a0a] flex flex-col items-center justify-center relative overflow-hidden"
      style={{ height: '100dvh' }}
    >
      {/* Decorative background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#1a1a1a_0%,_transparent_50%)] opacity-30 pointer-events-none" />

      <div className="w-full h-full md:max-w-lg md:h-[90vh] md:rounded-3xl overflow-hidden md:border md:border-white/5 md:shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative z-10">
        <ChatInterface userId={userId} role="user" receiverId="admin" adminSettings={adminSettings} />
      </div>
    </div>
  );
}
