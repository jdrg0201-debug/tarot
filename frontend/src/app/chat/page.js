"use client";
import React, { useEffect, useState } from 'react';
import ChatInterface from '@/components/chat/ChatInterface';

const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5555';

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

    // Load admin profile from backend
    fetch(`${SOCKET_URL}/api/admin/settings`)
      .then(res => res.json())
      .then(data => {
        setAdminSettings({
          name: data.name || 'Maestro',
          avatar: data.avatar || ''
        });
      })
      .catch(() => {});
  }, []);

  if (!userId) return null;

  return (
    <div
      className="bg-[#0a0a0a] flex flex-col items-center justify-center fixed inset-0 overflow-hidden"
    >
      {/* Decorative background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#1a1a1a_0%,_transparent_50%)] opacity-30 pointer-events-none" />

      <div 
        className="w-full h-full flex flex-col min-h-0 md:max-w-lg md:h-[90vh] md:rounded-3xl overflow-hidden md:border md:border-white/5 md:shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative z-10"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        <ChatInterface userId={userId} role="user" receiverId="admin" adminSettings={adminSettings} />
      </div>
    </div>
  );
}
