"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { 
  Users, MessageSquare, Bell, Search, Star, Filter, Calendar, Phone, 
  Archive, Trash, ExternalLink, Clock, Flame, CheckCircle, XCircle, 
  Send, AlertCircle, Zap, Heart, Shield, HelpCircle, MoreVertical, Menu, PlusCircle, LogOut, Camera, User
} from 'lucide-react';
import ChatInterface from '@/components/chat/ChatInterface';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5555';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminDashboard() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [tab, setTab] = useState('chats'); 
  const [showArchived, setShowArchived] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMobileDetails, setShowMobileDetails] = useState(false);

  // Profile Management
  const [adminProfile, setAdminProfile] = useState({ name: 'El Maestro', avatar: '', email: '' });
  const [adminRowId, setAdminRowId] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [quickReplies, setQuickReplies] = useState([]);
  const [showQuickReplyManager, setShowQuickReplyManager] = useState(false);
  const [newQuickReply, setNewQuickReply] = useState({ label: '', text: '' });

  const CRM_STATUSES = {
    nuevo: { label: 'Nuevo', color: 'bg-blue-500', icon: Bell },
    conversacion: { label: 'En Conversación', color: 'bg-yellow-500', icon: MessageSquare },
    caliente: { label: 'Cliente Caliente', color: 'bg-red-500', icon: Flame },
    cerrado: { label: 'Cerrado', color: 'bg-green-500', icon: CheckCircle },
    perdido: { label: 'Perdido', color: 'bg-gray-500', icon: XCircle },
  };

  useEffect(() => {
    // Check auth
    if (!localStorage.getItem('admin_token')) {
      router.push('/admin/login');
      return;
    }

    const s = io(SOCKET_URL);
    setSocket(s);
    s.emit('join', { userId: 'admin', role: 'admin' });

    fetch(`${SOCKET_URL}/api/users`)
      .then(res => res.json())
      .then(data => setUsers(data));

    fetch(`${SOCKET_URL}/api/quick-replies`)
      .then(res => res.json())
      .then(data => setQuickReplies(data));

    // Load admin settings directly from Supabase (backend not required)
    supabase
      .from('configuracion_admin')
      .select('id, nombre, avatar, email')
      .single()
      .then(({ data }) => {
        if (data) {
          setAdminRowId(data.id);
          setAdminProfile({
            name: data.nombre || 'El Maestro',
            avatar: data.avatar || '',
            email: data.email || ''
          });
        }
      });

    s.on('user_updated', (user) => {
      setUsers(prev => {
        const idx = prev.findIndex(u => u.userId === user.userId);
        if (idx !== -1) {
          const newUsers = [...prev];
          newUsers[idx] = { ...newUsers[idx], ...user };
          return newUsers.sort((a,b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
        }
        return [user, ...prev].sort((a,b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
      });
    });

    s.on('new_lead', (user) => {
      const audio = new Audio('/sounds/notification.mp3');
      audio.play().catch(()=>{});
      setNotifications(prev => [...prev, { id: Date.now(), text: `🌟 NUEVO LEAD: ${user.name}` }]);
    });

    s.on('receive_message', (msg) => {
      if (msg.senderId !== 'admin') {
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(()=>{});
        setNotifications(prev => [...prev, { id: Date.now(), text: `💬 Mensaje de ${msg.senderId}` }]);
        setUsers(prev => prev.map(u => u.userId === msg.senderId ? { ...u, updatedAt: Date.now() } : u).sort((a,b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)));
      }
    });

    return () => s.disconnect();
  }, [router]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsEditing(true);
    try {
      const filter = adminRowId ? supabase.from('configuracion_admin').update({
        nombre: adminProfile.name,
        avatar: adminProfile.avatar,
        email: adminProfile.email,
        actualizado_en: new Date().toISOString()
      }).eq('id', adminRowId) : supabase.from('configuracion_admin').update({
        nombre: adminProfile.name,
        avatar: adminProfile.avatar,
        email: adminProfile.email,
        actualizado_en: new Date().toISOString()
      }).not('id', 'is', null);
      await filter;
      setShowProfileModal(false);
    } catch(e) { console.error(e); } finally { setIsEditing(false); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target.result;
        setAdminProfile(prev => ({ ...prev, avatar: base64 }));
        // Persist to Supabase using the stored row ID
        const query = supabase
          .from('configuracion_admin')
          .update({ avatar: base64, actualizado_en: new Date().toISOString() });
        const result = adminRowId
          ? await query.eq('id', adminRowId)
          : await query.not('id', 'is', null);
        if (result.error) console.error('Save avatar error:', result.error);
      };
      reader.readAsDataURL(file);
    } catch(e) { console.error('Avatar upload failed:', e); }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  };

  const handleAddQuickReply = async () => {
    if (!newQuickReply.label.trim() || !newQuickReply.text.trim()) return;
    try {
      await fetch(`${SOCKET_URL}/api/quick-replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuickReply)
      });
      fetch(`${SOCKET_URL}/api/quick-replies`).then(res => res.json()).then(setQuickReplies);
      setNewQuickReply({ label: '', text: '' });
    } catch(e) {}
  };

  const handleDeleteQuickReply = async (id) => {
    try {
      await fetch(`${SOCKET_URL}/api/quick-replies/${id}`, { method: 'DELETE' });
      setQuickReplies(prev => prev.filter(r => r._id !== id));
    } catch(e) {}
  };

  const handleAddNote = async (userId, text) => {
    if (!text.trim()) return;
    try {
      const res = await fetch(`${SOCKET_URL}/api/users/${userId}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const updatedUser = await res.json();
      setUsers(prev => prev.map(u => u.userId === userId ? updatedUser : u));
    } catch(e) {}
  };

  const handleCrmStatusChange = async (userId, crmStatus) => {
    try {
      const res = await fetch(`${SOCKET_URL}/api/users/${userId}/status-crm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crmStatus })
      });
      const updatedUser = await res.json();
      setUsers(prev => prev.map(u => u.userId === userId ? updatedUser : u));
    } catch(e) {}
  };

  const handleArchive = async (userId, isArchived) => {
    try {
      const res = await fetch(`${SOCKET_URL}/api/users/${userId}/archive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived })
      });
      const updatedUser = await res.json();
      setUsers(prev => prev.map(u => u.userId === userId ? updatedUser : u));
    } catch(e) {}
  };

  const handleDelete = async (userId) => {
    if (!confirm('¿Seguro que deseas eliminar este contacto?')) return;
    try {
      await fetch(`${SOCKET_URL}/api/users/${userId}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.userId !== userId));
      if (activeChat === userId) setActiveChat(null);
    } catch(e) {}
  };

  const handleWhatsApp = (phone, name) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    const msg = `Hola ${name}, soy el Maestro. He analizado tu caso y es importante que hablemos...`;
    window.open(`https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  const filteredUsers = users
    .filter(u => {
      if (showArchived) return u.isArchived;
      if (tab === 'leads' && !u.phone) return false;
      if (filterStatus !== 'all' && u.crmStatus !== filterStatus) return false;
      return !u.isArchived;
    })
    .filter(u => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (u.name?.toLowerCase().includes(term) || u.phone?.includes(term) || u.userId?.toLowerCase().includes(term));
    });

  const activeUserData = users.find(u => u.userId === activeChat);

  return (
    <div className="flex h-screen w-full bg-dark-950 border-t-2 border-gold-500 overflow-hidden text-sm font-sans relative">
      
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {showMobileSidebar && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMobileSidebar(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-dark-800 flex flex-col border-r border-white/5 transition-transform duration-300 transform lg:translate-x-0 lg:static lg:block ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-white/5 bg-dark-900/50">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-serif text-gold-500 flex items-center gap-2">
                <Users size={20} />
                Portal Maestro
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowQuickReplyManager(true)} className="p-1.5 text-gold-500/60 hover:text-gold-500 transition-colors" title="Gestor de Respuestas"><PlusCircle size={20} /></button>
                <button onClick={() => setShowMobileSidebar(false)} className="lg:hidden p-1 text-gray-400"><XCircle size={20} /></button>
              </div>
          </div>
          
          <div className="flex gap-2 mb-4">
            <button onClick={() => setTab('chats')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'chats' ? 'bg-purple-800 text-white' : 'text-gray-500 hover:text-white'}`}>CHATS</button>
            <button onClick={() => setTab('leads')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'leads' ? 'bg-gold-500 text-black' : 'text-gray-500 hover:text-white'}`}>LEADS</button>
          </div>

          <div className="relative">
             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
             <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar almas..." className="w-full bg-dark-950 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-xs text-white outline-none focus:border-gold-500/50" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredUsers.map(u => (
            <div key={u.userId} onClick={() => { setActiveChat(u.userId); setShowMobileSidebar(false); }} className={`p-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5 ${activeChat === u.userId ? 'bg-purple-900/30 border-l-4 border-gold-500 font-bold' : ''}`}>
              <div className="flex justify-between items-center mb-1">
                 <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${u.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
                    <span className="text-white font-medium truncate max-w-[120px]">{u.name || 'Anónimo'}</span>
                 </div>
                 <span className="text-[10px] text-gray-500">{formatDistanceToNow(new Date(u.updatedAt || u.createdAt), { locale: es, addSuffix: false })}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                 <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold text-white ${CRM_STATUSES[u.crmStatus || 'nuevo'].color}`}>{CRM_STATUSES[u.crmStatus || 'nuevo'].label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Desktop Header Top Right Profile */}
        <div className="hidden lg:flex h-16 bg-dark-900/50 border-b border-white/5 px-6 items-center justify-between z-30">
           <div className="flex items-center gap-4">
             <span className="text-xs text-gold-500 font-serif tracking-widest uppercase italic">Canal Sagrado</span>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setShowProfileModal(true)}>
                 <div className="text-right flex flex-col">
                    <span className="text-xs text-white font-bold group-hover:text-gold-500 transition-colors">{adminProfile.name}</span>
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest">Maestro Admin</span>
                 </div>
                 <div className="w-10 h-10 rounded-full border-2 border-gold-500/30 group-hover:border-gold-500 transition-all overflow-hidden flex items-center justify-center bg-dark-950">
                    {adminProfile.avatar ? <img src={adminProfile.avatar} className="w-full h-full object-cover" alt="admin" /> : <User size={20} className="text-gold-500" />}
                 </div>
              </div>
              <button onClick={handleLogout} className="text-gray-600 hover:text-red-500 transition-colors p-2" title="Cerrar Sesión"><LogOut size={20} /></button>
           </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden h-14 bg-dark-800 border-b border-white/5 flex items-center justify-between px-4 z-30">
          <button onClick={() => setShowMobileSidebar(true)} className="p-2 text-gold-500"><Menu size={20} /></button>
          <div className="flex items-center gap-2" onClick={() => setShowProfileModal(true)}>
             <div className="w-8 h-8 rounded-full border border-gold-500/30 overflow-hidden flex items-center justify-center bg-dark-950">
                {adminProfile.avatar ? <img src={adminProfile.avatar} className="w-full h-full object-cover" alt="admin" /> : <User size={14} className="text-gold-500" />}
             </div>
             <span className="text-xs text-white font-serif">{adminProfile.name}</span>
          </div>
          <button onClick={() => setShowMobileDetails(!showMobileDetails)} className={`p-2 transition-all ${activeChat ? 'text-gold-500' : 'text-gray-800'}`} disabled={!activeChat}><Star size={20} /></button>
        </div>

        {activeChat ? (
          <div className="flex-1 flex relative">
            <div className={`flex-1 flex flex-col min-w-0 transition-opacity duration-300 ${showMobileDetails ? 'opacity-20 lg:opacity-100' : 'opacity-100'}`}>
               <ChatInterface userId="admin" role="admin" receiverId={activeChat} activeChat={activeChat} quickReplies={quickReplies} onManageQuickReplies={() => setShowQuickReplyManager(true)} />
            </div>

            <AnimatePresence>
              {showMobileDetails && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMobileDetails(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" />
              )}
            </AnimatePresence>

            {/* Details Panel Right Sidebar */}
            <div className={`fixed inset-y-0 right-0 z-50 w-80 bg-dark-800 flex flex-col border-l border-white/5 transition-transform duration-300 transform lg:translate-x-0 lg:static lg:block ${showMobileDetails ? 'translate-x-0' : 'translate-x-full'}`}>
              <div className="p-4 border-b border-white/5 bg-dark-900/50 flex justify-between items-center">
                 <h3 className="text-xs font-bold text-gold-500 uppercase tracking-widest">Atributos del Alma</h3>
                 <button onClick={() => setShowMobileDetails(false)} className="lg:hidden p-1 text-gray-500"><XCircle size={18} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                <div className="text-center mb-8">
                  <div className="relative inline-block mb-4">
                    <div className="w-20 h-20 bg-dark-950 border-2 border-purple-800 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)]"><Star className="text-gold-500" size={32} /></div>
                    <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-4 border-dark-800 ${activeUserData?.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                  <h4 className="text-lg text-white font-serif">{activeUserData?.name || 'Anónimo'}</h4>
                  <p className="text-[10px] text-gray-500 uppercase mt-1 tracking-widest">Desde {formatDistanceToNow(new Date(activeUserData?.createdAt || Date.now()), { locale: es, addSuffix: true })}</p>
                </div>
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] text-gray-600 font-bold uppercase block mb-3">Estado del Ritual</span>
                    <div className="grid grid-cols-1 gap-2">
                       {Object.entries(CRM_STATUSES).map(([key, value]) => (
                         <button key={key} onClick={() => handleCrmStatusChange(activeChat, key)} className={`w-full py-2 px-3 rounded-lg text-xs flex items-center gap-3 transition-all border ${activeUserData?.crmStatus === key ? `${value.color} text-white border-transparent` : 'bg-dark-900 border-white/5 text-gray-400 hover:border-white/20'}`}>
                           <value.icon size={14} /> {value.label}
                         </button>
                       ))}
                    </div>
                  </div>
                  {activeUserData?.phone && (
                    <div className="bg-dark-950 p-4 rounded-xl border border-white/5 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-[9px] text-gray-600 font-bold uppercase"><span><Phone size={10} className="inline mr-1" /> WhatsApp</span><button onClick={() => handleWhatsApp(activeUserData.phone, activeUserData.name)} className="text-green-500">CONTACTAR</button></div>
                      <div className="text-white font-mono text-sm">{activeUserData.phone}</div>
                    </div>
                  )}
                  <div className="pt-4 border-t border-white/5">
                    <span className="text-[10px] text-gray-600 font-bold uppercase block mb-3">Notas Astrales</span>
                    <textarea rows={2} onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleAddNote(activeChat, e.target.value); e.target.value=''; } }} className="w-full bg-dark-950 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-gold-500 resize-none shadow-inner" placeholder="Añadir revelación..." />
                  </div>
                  <button onClick={() => handleDelete(activeChat)} className="w-full py-2 bg-red-900/20 border border-red-500/20 rounded-lg text-red-500 hover:bg-red-600 hover:text-white transition-all text-[10px] font-bold uppercase">Eliminar Contacto</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-4">
            <div className="w-20 h-20 bg-dark-900 border border-white/5 rounded-full flex items-center justify-center opacity-20 shadow-[0_0_50px_p-gold]"><MessageSquare size={40} className="text-gold-500" /></div>
            <p className="text-[10px] uppercase font-serif tracking-widest italic animate-pulse">Aguardando señales del destino...</p>
          </div>
        )}

        {/* Profile Edit Modal */}
        <AnimatePresence>
          {showProfileModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProfileModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-dark-800 border-2 border-gold-500/30 rounded-[3rem] shadow-[0_0_100px_rgba(212,175,55,0.2)] overflow-hidden">
                <div className="p-8 border-b border-white/5 bg-dark-900/50 flex flex-col items-center">
                   <div className="relative group cursor-pointer mb-6" onClick={() => fileInputRef.current?.click()}>
                      <div className="w-24 h-24 rounded-full border-2 border-gold-500/50 overflow-hidden flex items-center justify-center bg-dark-950 shadow-2xl group-hover:border-gold-500 transition-all">
                         {adminProfile.avatar ? <img src={adminProfile.avatar} className="w-full h-full object-cover" alt="admin" /> : <User size={40} className="text-gold-500" />}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-full transition-opacity">
                         <Camera size={24} className="text-white" />
                      </div>
                      <input type="file" ref={fileInputRef} className="hidden" onChange={handleAvatarUpload} accept="image/*" />
                   </div>
                   <h3 className="text-xl font-serif text-gold-500 tracking-[0.2em] uppercase">Perfil Sagrado</h3>
                </div>
                
                <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
                   <div className="space-y-4">
                      <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1 mb-2 block">Nombre del Maestro</label>
                        <input value={adminProfile.name} onChange={e => setAdminProfile({...adminProfile, name: e.target.value})} className="w-full bg-dark-950 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-gold-500 outline-none shadow-inner" />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1 mb-2 block">E-mail de Acceso</label>
                        <input value={adminProfile.email} onChange={e => setAdminProfile({...adminProfile, email: e.target.value})} className="w-full bg-dark-950 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-gold-500 outline-none shadow-inner" />
                      </div>
                   </div>
                   <button type="submit" disabled={isEditing} className="w-full py-4 bg-gold-500 text-black rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all transform hover:-translate-y-1">
                      {isEditing ? 'Sincronizando...' : 'Guardar Cambios'}
                   </button>
                   <button type="button" onClick={() => setShowProfileModal(false)} className="w-full text-gray-500 text-[10px] uppercase font-bold tracking-[0.2em] mt-2">Cancelar</button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Quick Reply Manager Modal */}
        <AnimatePresence>
          {showQuickReplyManager && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowQuickReplyManager(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-dark-800 border-2 border-gold-500/30 rounded-[2.5rem] shadow-[0_0_100px_rgba(212,175,55,0.15)] overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-dark-900/50">
                   <h3 className="text-lg font-serif text-gold-500 uppercase tracking-widest flex items-center gap-3">
                     <MessageSquare size={20} />
                     Gestor de Respuestas
                   </h3>
                   <button onClick={() => setShowQuickReplyManager(false)} className="text-gray-500 hover:text-white transition-colors"><XCircle size={24} /></button>
                </div>
                <div className="p-6 space-y-6">
                  <div className="space-y-4 bg-dark-950 p-6 rounded-3xl border border-white/5 shadow-inner">
                    <input value={newQuickReply.label} onChange={e => setNewQuickReply({...newQuickReply, label: e.target.value})} placeholder="Etiqueta (Ej. Saludo)" className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-gold-500/50" />
                    <textarea value={newQuickReply.text} onChange={e => setNewQuickReply({...newQuickReply, text: e.target.value})} placeholder="Mensaje ritual..." rows={3} className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-gold-500/50 resize-none" />
                    <button onClick={handleAddQuickReply} className="w-full py-4 bg-gold-500 text-black rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all">Crear Respuesta</button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                     {quickReplies.map(r => (
                       <div key={r._id} className="p-3 bg-dark-900 border border-white/5 rounded-xl flex justify-between items-center group">
                          <div><div className="text-[9px] text-gold-500 font-bold uppercase">{r.label}</div><div className="text-[10px] text-gray-500 italic">"{r.text}"</div></div>
                          <button onClick={() => handleDeleteQuickReply(r._id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash size={14} /></button>
                       </div>
                     ))}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Global Notifications */}
        <div className="fixed bottom-4 right-4 z-[110] flex flex-col gap-2 pointer-events-none">
          <AnimatePresence>
            {notifications.map(n => (
              <motion.div key={n.id} initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} className="bg-purple-900/95 backdrop-blur-md border border-gold-500/30 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs pointer-events-auto">
                <Bell size={14} className="text-gold-500" /> {n.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
