"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { 
  Users, Phone, Search, LogOut, CheckCircle, AlertCircle, XCircle, Menu, User, Star, MapPin, Calendar, Clock, MessageSquare, PlusCircle, Bookmark, Eye, Hand, Flame, Trash, Trash2, Shield, Heart, PieChart, Bell, Filter, Archive, ExternalLink, Send, Zap, HelpCircle, MoreVertical, Camera
} from 'lucide-react';
import ChatInterface from '@/components/chat/ChatInterface';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5555';


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

  const [globalDistribute, setGlobalDistribute] = useState(true);
  const [maestrosList, setMaestrosList] = useState([]);

  useEffect(() => {
    // Check auth
    const token = localStorage.getItem('admin_token');
    const userStr = localStorage.getItem('admin_user');
    if (!token || !userStr) {
      router.push('/admin/login');
      return;
    }

    let currentUser;
    try {
      currentUser = JSON.parse(userStr);
    } catch (e) {
      localStorage.removeItem('admin_user');
      localStorage.removeItem('admin_token');
      router.push('/admin/login');
      return;
    }
    
    setAdminProfile({
      name: currentUser.name,
      avatar: currentUser.avatar || '',
      email: currentUser.email,
      role: currentUser.role,
      id: currentUser.id
    });

    const s = io(SOCKET_URL);
    setSocket(s);
    s.emit('join', { userId: currentUser.id, role: 'admin' });

    fetch(`${SOCKET_URL}/api/users?maestroId=${currentUser.id}`)
      .then(res => res.json())
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]));

    fetch(`${SOCKET_URL}/api/quick-replies`)
      .then(res => res.json())
      .then(data => setQuickReplies(Array.isArray(data) ? data : []))
      .catch(() => setQuickReplies([]));

    if (currentUser.role === 'superadmin') {
      fetch(`${SOCKET_URL}/api/admin/distribution`)
        .then(res => res.json())
        .then(data => setGlobalDistribute(data.autoDistribute));
        
      fetch(`${SOCKET_URL}/api/maestros`)
        .then(res => res.json())
        .then(data => setMaestrosList(data));
    }


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
      
      // Add user to the list if we are superadmin, or if it's assigned to us
      if (currentUser.role === 'superadmin' || (user.quizData && user.quizData.assignedTo === currentUser.id)) {
        setUsers(prev => {
          if (prev.find(u => u.userId === user.userId)) return prev;
          return [user, ...prev].sort((a,b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
        });
      }
    });

    s.on('receive_message', (msg) => {
      if (msg.senderId !== 'admin') {
        setUsers(prev => {
          const userExists = prev.some(u => u.userId === msg.senderId);
          if (currentUser.role === 'superadmin' || userExists) {
            const audio = new Audio('/sounds/notification.mp3');
            audio.play().catch(()=>{});
            setNotifications(n => [...n, { id: Date.now(), text: `💬 Mensaje de ${msg.senderId}` }]);
            
            if (!userExists) {
              fetch(`${SOCKET_URL}/api/users/${msg.senderId}`)
                .then(res => res.json())
                .then(u => {
                  if (u && u.userId) {
                    setUsers(curr => {
                      if (curr.some(x => x.userId === u.userId)) return curr;
                      return [u, ...curr].sort((a,b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
                    });
                  }
                }).catch(()=>{});
              return prev;
            }
            return prev.map(u => u.userId === msg.senderId ? { ...u, updatedAt: Date.now() } : u).sort((a,b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
          }
          return prev;
        });
      }
    });

    return () => s.disconnect();
  }, [router]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsEditing(true);
    // Profile editing is limited for now, mostly handled via Superadmin directly in code/db
    setTimeout(() => {
       setIsEditing(false);
       setShowProfileModal(false);
    }, 1000);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target.result;
        setAdminProfile(prev => ({ ...prev, avatar: base64 }));
        
        // Save using backend API directly
        await fetch(`${SOCKET_URL}/api/admin/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...adminProfile, avatar: base64 })
        });
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

  const handleReassign = async (userId, maestroId) => {
    if (!maestroId) return;
    try {
      const res = await fetch(`${SOCKET_URL}/api/users/${userId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maestroId })
      });
      const updatedUser = await res.json();
      setUsers(prev => prev.map(u => u.userId === userId ? updatedUser : u));
    } catch(e) {}
  };

  const toggleDistribution = async () => {
    const newValue = !globalDistribute;
    setGlobalDistribute(newValue);
    try {
      await fetch(`${SOCKET_URL}/api/admin/distribution`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoDistribute: newValue })
      });
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

  const handleWhatsApp = async (userId, phone, name) => {
    if (!phone) return;
    
    // Register WhatsApp click in backend
    try {
      const res = await fetch(`${SOCKET_URL}/api/users/${userId}/whatsapp-click`, { method: 'PUT' });
      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(prev => prev.map(u => u.userId === userId ? updatedUser : u));
      }
    } catch(e) {}

    const cleanPhone = phone.replace(/\D/g, '');
    const msg = `Hola ${name}, soy el Maestro. He analizado tu caso y es importante que hablemos...`;
    window.open(`https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  // --- STATISTICS CALCULATIONS ---
  const totalLeads = users.length;
  const statusCounts = {
    nuevo: users.filter(u => u.crmStatus === 'nuevo' || !u.crmStatus).length,
    conversacion: users.filter(u => u.crmStatus === 'conversacion').length,
    caliente: users.filter(u => u.crmStatus === 'caliente').length,
    cerrado: users.filter(u => u.crmStatus === 'cerrado').length,
    perdido: users.filter(u => u.crmStatus === 'perdido').length,
  };
  const interactedCount = statusCounts.conversacion + statusCounts.caliente + statusCounts.cerrado;
  const unrespondedCount = statusCounts.nuevo;
  const whatsappContacted = users.filter(u => u.tags && u.tags.includes('whatsapp_contactado')).length;


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
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-dark-800 flex flex-col border-r border-white/5 transition-transform duration-300 transform lg:translate-x-0 lg:static lg:flex ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-white/5 bg-dark-900/50 shrink-0">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-serif text-gold-500 flex items-center gap-2 uppercase tracking-wider">
                <Users size={20} />
                PANEL ADMINISTRATIVO
             </h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowQuickReplyManager(true)} className="p-1.5 text-gold-500/60 hover:text-gold-500 transition-colors" title="Gestor de Respuestas"><PlusCircle size={20} /></button>
                <button onClick={() => setShowMobileSidebar(false)} className="lg:hidden p-1 text-gray-400"><XCircle size={20} /></button>
              </div>
          </div>
          
          <button 
            onClick={() => { setActiveChat(null); setShowMobileSidebar(false); }}
            className={`w-full py-2 mb-4 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${!activeChat ? 'bg-gold-500/20 text-gold-500 border-gold-500/50 shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'bg-dark-950 text-gray-400 border-white/5 hover:border-white/20'}`}
          >
            <PieChart size={14} className="inline mr-2" /> Resumen Estadístico
          </button>

          <div className="flex gap-2 mb-4">
            <button onClick={() => setTab('chats')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'chats' ? 'bg-red-900 text-white' : 'text-gray-500 hover:text-white'}`}>CHATS</button>
            <button onClick={() => setTab('leads')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'leads' ? 'bg-gold-500 text-black' : 'text-gray-500 hover:text-white'}`}>LEADS</button>
          </div>

          <div className="relative">
             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
             <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar almas..." className="w-full bg-dark-950 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-xs text-white outline-none focus:border-gold-500/50" />
          </div>

          {adminProfile.role === 'superadmin' && (
            <div className="mt-4 p-3 bg-dark-950 border border-white/5 rounded-lg flex justify-between items-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Distribución Auto</span>
              <button 
                onClick={toggleDistribution}
                className={`w-10 h-5 rounded-full relative transition-colors ${globalDistribute ? 'bg-green-500' : 'bg-gray-600'}`}
              >
                <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${globalDistribute ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredUsers.map(u => (
            <div key={u.userId} onClick={() => { setActiveChat(u.userId); setShowMobileSidebar(false); }} className={`p-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5 ${activeChat === u.userId ? 'bg-red-900/30 border-l-4 border-gold-500 font-bold' : ''}`}>
              <div className="flex justify-between items-center mb-1">
                 <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${u.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
                    <span className="text-white font-medium truncate max-w-[120px]">{u.name || 'Anónimo'}</span>
                 </div>
                 <span className="text-[10px] text-gray-500">{formatDistanceToNow(new Date(u.updatedAt || u.createdAt || Date.now()), { locale: es, addSuffix: false })}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                 <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold text-white ${CRM_STATUSES[u.crmStatus || 'nuevo'].color}`}>{CRM_STATUSES[u.crmStatus || 'nuevo'].label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 relative">
        {/* Desktop Header Top Right Profile */}
        <div className="hidden lg:flex shrink-0 h-16 bg-dark-900/50 border-b border-white/5 px-6 items-center justify-between z-30">
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
        <div className="lg:hidden shrink-0 h-14 bg-dark-800 border-b border-white/5 flex items-center justify-between px-4 z-30">
          <button onClick={() => setShowMobileSidebar(true)} className="p-2 text-gold-500"><Menu size={20} /></button>
          <div className="flex items-center gap-2" onClick={() => setShowProfileModal(true)}>
             <div className="w-8 h-8 rounded-full border border-gold-500/30 overflow-hidden flex items-center justify-center bg-dark-950">
                {adminProfile.avatar ? <img src={adminProfile.avatar} className="w-full h-full object-cover" alt="admin" /> : <User size={14} className="text-gold-500" />}
             </div>
             <span className="text-xs text-white font-serif">{adminProfile.name}</span>
          </div>
          {activeChat ? (
            <button onClick={() => setShowMobileDetails(!showMobileDetails)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gold-500/50 text-gold-500 bg-gold-500/10 hover:bg-gold-500/20 transition-all text-[10px] font-bold uppercase tracking-wider">
              <User size={14} /> Info Cliente
            </button>
          ) : (
            <div className="w-24" /> /* spacer to keep name centered */
          )}
        </div>

        {activeChat ? (
          <div className="flex-1 flex relative min-h-0">
            <div className={`flex-1 flex flex-col min-w-0 min-h-0 transition-opacity duration-300 ${showMobileDetails ? 'opacity-20 lg:opacity-100' : 'opacity-100'}`}>
               <ChatInterface userId="admin" role="admin" receiverId={activeChat} activeChat={activeChat} chatName={activeUserData?.name} quickReplies={quickReplies} onManageQuickReplies={() => setShowQuickReplyManager(true)} onBack={() => { setActiveChat(null); setShowMobileSidebar(true); }} onShowMobileInfo={() => setShowMobileDetails(true)} />
            </div>

            <AnimatePresence>
              {showMobileDetails && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMobileDetails(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" />
              )}
            </AnimatePresence>

            {/* Details Panel Right Sidebar */}
            <div className={`fixed inset-y-0 right-0 z-50 w-80 bg-dark-800 flex flex-col border-l border-white/5 transition-transform duration-300 transform xl:translate-x-0 xl:static xl:flex ${showMobileDetails ? 'translate-x-0' : 'translate-x-full'}`}>
              <div className="p-4 border-b border-white/5 bg-dark-900/50 flex justify-between items-center shrink-0">
                 <h3 className="text-xs font-bold text-gold-500 uppercase tracking-widest">Atributos del Alma</h3>
                 <button onClick={() => setShowMobileDetails(false)} className="lg:hidden p-1 text-gray-500"><XCircle size={18} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                <div className="text-center mb-8">
                  <div className="relative inline-block mb-4">
                    <div className="w-20 h-20 bg-dark-950 border-2 border-red-900 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)]"><Star className="text-gold-500" size={32} /></div>
                    <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-4 border-dark-800 ${activeUserData?.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                  <h4 className="text-lg text-white font-serif">{activeUserData?.name || 'Anónimo'}</h4>
                  <p className="text-[10px] text-gray-500 uppercase mt-1 tracking-widest">Desde {formatDistanceToNow(new Date(activeUserData?.createdAt || Date.now()), { locale: es, addSuffix: true })}</p>
                  {activeUserData?.reason && (
                    <div className="bg-red-900/20 border border-red-600/20 rounded-xl p-3 mt-4 mx-2 text-center">
                       <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest block mb-1">Motivo de Consulta</span>
                       <p className="text-sm font-serif text-gray-200 italic">"{activeUserData.reason}"</p>
                    </div>
                  )}
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
                  {adminProfile.role === 'superadmin' && (
                    <div className="pt-4 border-t border-white/5">
                      <span className="text-[10px] text-gray-600 font-bold uppercase block mb-3">Asignar a Maestro</span>
                      <select 
                        value={activeUserData?.quizData?.assignedTo || ''}
                        onChange={(e) => handleReassign(activeChat, e.target.value)}
                        className="w-full bg-dark-950 border border-white/10 rounded-lg p-3 text-xs text-white outline-none focus:border-gold-500 shadow-inner appearance-none cursor-pointer"
                      >
                        <option value="">-- Seleccionar Maestro --</option>
                        {maestrosList.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {activeUserData?.phone && (
                    <div className="bg-dark-950 p-4 rounded-xl border border-white/5 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-[9px] text-gray-600 font-bold uppercase"><span><Phone size={10} className="inline mr-1" /> WhatsApp</span><button onClick={() => handleWhatsApp(activeUserData.userId, activeUserData.phone, activeUserData.name)} className="text-green-500 hover:text-green-400 transition-colors">CONTACTAR</button></div>
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
          <div className="flex-1 flex flex-col items-center justify-start xl:justify-center p-4 lg:p-12 overflow-y-auto custom-scrollbar relative">
             {/* Background ambiances */}
             <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold-500/5 blur-[150px] rounded-full pointer-events-none" />
             
             <div className="w-full max-w-4xl z-10 space-y-6 lg:space-y-10 mt-6 lg:mt-0 pb-12">
                <div className="text-center mb-6 lg:mb-10 mt-4 lg:mt-0">
                   <h2 className="text-2xl lg:text-4xl font-serif text-gold-500 tracking-[0.2em] uppercase mb-2">Visión del Destino</h2>
                   <p className="text-[9px] lg:text-xs text-gray-400 font-serif tracking-[0.3em] uppercase opacity-70">Resumen Estadístico de Almas y Conexiones</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                   <div className="bg-dark-900 border border-white/5 rounded-2xl p-5 lg:p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden group hover:border-gold-500/30 transition-colors">
                      <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />
                      <div className="text-blue-500 mb-3"><Users size={24} strokeWidth={1.5} /></div>
                      <div className="text-3xl font-serif text-white mb-1">{totalLeads}</div>
                      <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Total Almas</div>
                   </div>
                   <div className="bg-dark-900 border border-white/5 rounded-2xl p-5 lg:p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden group hover:border-gold-500/30 transition-colors">
                      <div className="absolute -right-4 -top-4 w-16 h-16 bg-green-500/10 rounded-full blur-xl group-hover:bg-green-500/20 transition-all pointer-events-none" />
                      <div className="text-green-500 mb-3"><Phone size={24} strokeWidth={1.5} /></div>
                      <div className="text-3xl font-serif text-white mb-1">{whatsappContacted}</div>
                      <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Clics WA</div>
                   </div>
                   <div className="bg-dark-900 border border-white/5 rounded-2xl p-5 lg:p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden group hover:border-gold-500/30 transition-colors">
                      <div className="absolute -right-4 -top-4 w-16 h-16 bg-yellow-500/10 rounded-full blur-xl group-hover:bg-yellow-500/20 transition-all pointer-events-none" />
                      <div className="text-yellow-500 mb-3"><MessageSquare size={24} strokeWidth={1.5} /></div>
                      <div className="text-3xl font-serif text-white mb-1">{interactedCount}</div>
                      <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Atendidos</div>
                   </div>
                   <div className="bg-dark-900 border border-white/5 rounded-2xl p-5 lg:p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden group hover:border-gold-500/30 transition-colors">
                      <div className="absolute -right-4 -top-4 w-16 h-16 bg-red-500/10 rounded-full blur-xl group-hover:bg-red-500/20 transition-all pointer-events-none" />
                      <div className="text-red-500 mb-3"><AlertCircle size={24} strokeWidth={1.5} /></div>
                      <div className="text-3xl font-serif text-white mb-1">{unrespondedCount}</div>
                      <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Sin Responder</div>
                   </div>
                </div>

                <div className="bg-dark-900 border border-white/5 rounded-2xl p-6 lg:p-10 shadow-2xl mt-8">
                   <div className="flex items-center justify-between mb-8">
                     <h3 className="text-[10px] text-gold-500 uppercase tracking-widest font-bold flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gold-500" /> Estado del Pipeline</h3>
                     <span className="text-[9px] text-gray-600 font-mono tracking-wider">{totalLeads} TOTAL</span>
                   </div>
                   <div className="space-y-5">
                      {Object.entries(CRM_STATUSES).map(([key, value]) => {
                         const count = statusCounts[key];
                         const max = Math.max(totalLeads, 1);
                         const percentage = (count / max) * 100;
                         return (
                           <div key={key} className="flex items-center gap-4 group">
                              <div className="w-24 lg:w-36 text-right flex items-center justify-end gap-2">
                                <value.icon size={12} className="text-gray-500 group-hover:text-gold-500 transition-colors hidden sm:block delay-75" />
                                <span className="text-[9px] lg:text-[10px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-white transition-colors">{value.label}</span>
                              </div>
                              <div className="flex-1 h-2 lg:h-2.5 rounded-full overflow-hidden bg-dark-950 border border-white/5 relative">
                                 <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                                    className={`absolute left-0 top-0 bottom-0 ${value.color} shadow-[0_0_10px_currentColor]`}
                                 />
                              </div>
                              <div className="w-8 lg:w-12 text-left">
                                <span className="text-[10px] lg:text-xs font-mono text-white opacity-80">{count}</span>
                              </div>
                           </div>
                         )
                      })}
                   </div>
                </div>
             </div>
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
              <motion.div key={n.id} initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} className="bg-red-900/95 backdrop-blur-md border border-gold-500/30 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs pointer-events-auto">
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
