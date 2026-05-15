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

    // Load assigned maestro from backend
    const loadAssignedMaestro = async () => {
      try {
        const [userRes, maestrosRes] = await Promise.all([
          fetch(`${SOCKET_URL}/api/users/${storedId}`),
          fetch(`${SOCKET_URL}/api/maestros`)
        ]);
        const userData = await userRes.json();
        const maestrosData = await maestrosRes.json();
        
        let maestroName = 'Maestro';
        if (userData && userData.quizData && userData.quizData.assignedTo) {
          const maestro = maestrosData.find(m => m.id === userData.quizData.assignedTo);
          if (maestro) {
            maestroName = maestro.name.replace('MAESTRA', 'M.').replace('MAESTRO', 'M.');
          }
        }
        setAdminSettings({ name: maestroName, avatar: '' });
      } catch (e) {
        setAdminSettings({ name: 'Maestro', avatar: '' });
      }
    };
    loadAssignedMaestro();
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
