"use client";
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Image as ImageIcon, Camera, Paperclip, X, StopCircle, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';

const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5555';
let socket;

export default function ChatInterface({ userId, role = 'user', receiverId = 'admin', activeChat = null, quickReplies = [], onManageQuickReplies, adminSettings = {} }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [theirTyping, setTheirTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Socket connect and fetch initial
  useEffect(() => {
    socket = io(SOCKET_URL);
    
    socket.emit('join', { userId: activeChat || userId, role });

    // Fetch previous messages
    const fetchMessages = async () => {
      try {
        const idToFetch = activeChat || userId;
        const res = await fetch(`http://localhost:5555/api/messages/${idToFetch}`);
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };
    fetchMessages();

    // Automated initial messages for user
    if (role === 'user') {
      const autoMessages = [
        { delay: 3000, text: 'Estoy revisando tu caso...' },
        { delay: 7000, text: 'Ya tengo una percepción inicial...' },
        { delay: 11000, text: 'Veo que hay una conexión que no se ha cerrado...' },
        { delay: 15000, text: 'El maestro ya está revisando tu caso.\n\nEspera aquí en el chat su respuesta.\n\nSi tarda un poco, puede que esté atendiendo otro caso. En ese caso, te escribirá a tu WhatsApp.' }
      ];

      autoMessages.forEach((msg, i) => {
        setTimeout(() => {
          setMessages(prev => {
            const exists = prev.find(m => m._id === `auto${i}`);
            if (exists) return prev;
            return [...prev, { _id: `auto${i}`, senderId: 'admin', text: msg.text, createdAt: new Date() }];
          });
          
          if (i < autoMessages.length - 1) {
            setTheirTyping(true);
            setTimeout(() => setTheirTyping(false), 2000);
          } else {
             setTheirTyping(false);
          }
        }, msg.delay);
      });
    }

    socket.on('receive_message', (message) => {
      // Validate correct chat window
      if (role === 'admin' && activeChat && message.senderId !== activeChat && message.receiverId !== activeChat) return;
      
      setMessages((prev) => [...prev, message]);
      
      // Play sound
      try {
        if (message.senderId !== (role === 'admin' ? 'admin' : userId)) {
          new Audio('/sounds/receive.mp3').play().catch(()=>{});
        }
      } catch(e){}
    });

    socket.on(role === 'user' ? 'admin_typing' : 'user_typing', (data) => {
      if (role === 'admin' && activeChat && data.userId !== activeChat) return;
      setTheirTyping(data.isTyping);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, role, activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, theirTyping]);

  const handleTyping = (e) => {
    setInputText(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { userId: activeChat || userId, isTyping: true, role });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing', { userId: activeChat || userId, isTyping: false, role });
    }, 1500);
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('http://localhost:5555/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      return `http://localhost:5555${data.url}`;
    } catch (error) {
      console.error('File upload failed', error);
      return null;
    }
  };

  const sendMessage = async (e, customText = null) => {
    if (e) e.preventDefault();
    const textToSend = typeof customText === 'string' ? customText : inputText;
    if (!textToSend.trim() && !mediaFile) return;

    let mediaUrl = null;
    let mediaType = null;

    if (mediaFile) {
      mediaUrl = await uploadFile(mediaFile);
      mediaType = mediaFile.type.startsWith('image/') ? 'image' : 'audio';
    }

    const messageData = {
      senderId: role === 'admin' ? 'admin' : userId,
      receiverId: role === 'admin' ? (activeChat || receiverId) : 'admin',
      text: textToSend,
      mediaUrl,
      mediaType
    };

    socket.emit('send_message', messageData);
    
    if (!customText) {
      setInputText('');
      setMediaFile(null);
      setMediaPreview(null);
      socket.emit('typing', { userId: activeChat || userId, isTyping: false, role });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setMediaFile(audioBlob);
        setMediaPreview(URL.createObjectURL(audioBlob));
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop all tracks of the stream
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className={`flex flex-col w-full h-full bg-[#111] ${role === 'user' ? 'max-w-md shadow-2xl relative overflow-hidden' : ''}`}>
      {role === 'user' && (
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-purple-900/50 to-transparent pointer-events-none" />
      )}
      
      {/* Header */}
      <div className="px-4 py-3 bg-dark-800 border-b border-white/5 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          {/* Admin avatar */}
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gold-500/40 shrink-0">
            {adminSettings?.avatar ? (
              <img
                src={adminSettings.avatar}
                alt="Maestro"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-gold-500 to-purple-600 flex items-center justify-center">
                <span className="text-black font-serif font-bold text-lg">
                  {(adminSettings?.name || 'M')[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-gold-500 font-serif text-lg tracking-wide drop-shadow-[0_0_5px_rgba(212,175,55,0.3)]">
              {role === 'user' ? (adminSettings?.name || 'Maestro') : `Chat con ${activeChat}`}
            </h3>
            <p className="text-[10px] text-green-400 flex items-center gap-1.5 font-bold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,1)] animate-pulse" /> en línea
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => {
            const isMe = msg.senderId === (role === 'admin' ? 'admin' : userId);
            return (
               <motion.div
                 key={msg._id || idx}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
               >
                 <div className={`max-w-[80%] rounded-2xl p-3 ${
                   isMe 
                    ? 'bg-purple-800/80 text-white rounded-br-sm shadow-[0_4px_15px_rgba(74,42,122,0.3)]' 
                    : 'bg-dark-800 text-gray-200 rounded-bl-sm border border-white/5'
                 }`}>
                   {msg.mediaType === 'image' && msg.mediaUrl && (
                     <img src={msg.mediaUrl} alt="attachment" className="rounded-xl mb-2 max-w-full h-auto" />
                   )}
                   {msg.mediaType === 'audio' && msg.mediaUrl && (
                     <div className="flex flex-col gap-2 min-w-[200px] mb-2 bg-black/20 p-3 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-500">
                             <Mic size={18} />
                           </div>
                           <div className="flex-1">
                             <audio controls src={msg.mediaUrl} className="w-full h-8 custom-audio-player" />
                           </div>
                        </div>
                        <style jsx global>{`
                          .custom-audio-player::-webkit-media-controls-enclosure {
                            background-color: transparent;
                          }
                          .custom-audio-player::-webkit-media-controls-panel {
                            background-color: transparent;
                          }
                          .custom-audio-player::-webkit-media-controls-play-button {
                            background-color: #d4af37;
                            border-radius: 50%;
                          }
                          .custom-audio-player::-webkit-media-controls-current-time-display,
                          .custom-audio-player::-webkit-media-controls-time-remaining-display {
                            color: #fff;
                            font-size: 10px;
                          }
                        `}</style>
                     </div>
                   )}
                   {msg.text && <p className="text-sm leading-relaxed">{msg.text}</p>}
                   <span className="text-[10px] opacity-50 block mt-1 text-right">
                     {msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : format(new Date(), 'HH:mm')}
                   </span>
                 </div>
               </motion.div>
            );
          })}
        </AnimatePresence>
        
        {theirTyping && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex justify-start"
          >
            <div className="bg-dark-800 rounded-2xl rounded-bl-sm p-3 border border-white/5 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-dark-800 border-t border-white/5 shrink-0 z-10">
        {mediaPreview && (
          <div className="mb-3 relative w-20 h-20 rounded-xl overflow-hidden bg-dark-900 border border-white/10">
             {mediaFile?.type.startsWith('image/') ? (
               <img src={mediaPreview} alt="preview" className="object-cover w-full h-full" />
             ) : (
               <div className="flex items-center justify-center w-full h-full text-purple-400">
                 <Mic size={24} />
               </div>
             )}
             <button 
               onClick={() => { setMediaPreview(null); setMediaFile(null); }}
               className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white"
             >
               <X size={12} />
             </button>
          </div>
        )}
        {role === 'admin' && (
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-2 border-b border-white/5 items-center">
            <button
              onClick={onManageQuickReplies}
              className="p-1.5 text-gold-500 hover:text-white transition-colors shrink-0"
              title="Añadir Respuesta Rápida"
            >
              <PlusCircle size={18} />
            </button>
            {quickReplies.map((reply, i) => (
              <button
                key={i}
                type="button"
                onClick={() => sendMessage(null, reply.text)}
                className="shrink-0 px-3 py-1.5 bg-purple-900/40 hover:bg-purple-800 border border-purple-500/30 rounded-full text-white text-[10px] font-medium transition-all"
              >
                {reply.label}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={sendMessage} className="flex gap-2 items-end">
          <div className="flex-1 bg-dark-900 rounded-2xl flex items-end px-3 py-2 border border-white/10 focus-within:border-purple-500/50 transition-colors">
            
            <button type="button" className="p-2 text-gray-400 hover:text-gold-500 transition" onClick={() => fileInputRef.current?.click()}>
              <ImageIcon size={20} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />

            {isRecording ? (
              <div className="flex-1 flex items-center gap-4 px-4 overflow-hidden">
                 <div className="flex items-center gap-1 h-8">
                   {[...Array(8)].map((_, i) => (
                     <span key={i} className="w-1.5 bg-red-500 rounded-full animate-[pulse_0.8s_ease-in-out_infinite]" style={{ height: `${Math.random() * 60 + 40}%`, animationDelay: `${i * 0.15}s` }} />
                   ))}
                 </div>
                 <span className="text-red-400 text-xs font-bold tracking-widest uppercase animate-pulse">Grabando Voz...</span>
              </div>
            ) : (
              <textarea
                rows={1}
                value={inputText}
                onChange={handleTyping}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-transparent text-white placeholder-gray-500 px-3 py-1 outline-none resize-none mx-1 text-sm max-h-24 overflow-y-auto"
                style={{ minHeight: '36px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
            )}

            {inputText.trim() || mediaFile ? (
               <button 
                type="submit" 
                className="p-2 bg-gradient-to-r from-gold-500 to-yellow-300 text-black rounded-full hover:scale-105 transition shadow-[0_0_10px_rgba(212,175,55,0.4)]"
               >
                 <Send size={18} className="translate-x-[1px]" />
               </button>
            ) : (
               <button 
                type="button" 
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-2 rounded-full transition ${isRecording ? 'text-red-500 animate-pulse bg-red-500/10' : 'text-gray-400 hover:text-white'}`}
               >
                 {isRecording ? <StopCircle size={22} /> : <Mic size={22} />}
               </button>
            )}
          </div>
        </form>
      </div>

    </div>
  );
}
