"use client";
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Image as ImageIcon, Camera, Paperclip, X, StopCircle, PlusCircle, Play, Pause, Trash } from 'lucide-react';
import { format } from 'date-fns';

const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5555';
let socket;

// Custom WhatsApp-style Audio Player
const CustomAudioMessage = ({ src }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      setCurrentTime(current);
      const total = audioRef.current.duration || 1;
      setProgress((current / total) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const handleSeek = (e) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percent = clickX / rect.width;
      audioRef.current.currentTime = percent * audioRef.current.duration;
      setProgress(percent * 100);
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 w-[220px] max-w-full my-1.5">
      <audio 
        ref={audioRef} 
        src={src} 
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        className="hidden" 
      />
      
      <button 
        onClick={togglePlay}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-gold-500 text-black hover:bg-gold-400 hover:scale-105 transition-all shrink-0 shadow-lg"
      >
        {isPlaying ? <Pause size={18} className="fill-current" /> : <Play size={18} className="fill-current translate-x-[1px]" />}
      </button>

      <div className="flex-1 flex flex-col gap-1.5 justify-center py-1">
        <div 
          className="h-1.5 bg-white/20 rounded-full relative cursor-pointer group"
          onClick={handleSeek}
        >
           <div 
             className="absolute top-0 left-0 h-full bg-gold-500 rounded-full transition-all duration-75 ease-linear flex items-center justify-end"
             style={{ width: `${progress}%` }}
           >
              <div className="w-3 h-3 bg-gold-500 rounded-full shadow-[0_0_10px_rgba(212,175,55,0.8)] -mr-1.5 shrink-0" />
           </div>
        </div>
        <div className="flex justify-between text-[10px] text-white/70 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{duration ? formatTime(duration) : '--:--'}</span>
        </div>
      </div>
    </div>
  );
};


export default function ChatInterface({ userId, role = 'user', receiverId = 'admin', activeChat = null, chatName = null, quickReplies = [], onManageQuickReplies, adminSettings = {} }) {
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
  const socketRef = useRef(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Socket connect and fetch initial
  useEffect(() => {
    const s = io(SOCKET_URL);
    socketRef.current = s;
    
    s.emit('join', { userId: activeChat || userId, role });

    // Fetch previous messages
    const fetchMessages = async () => {
      try {
        const idToFetch = activeChat || userId;
        const res = await fetch(`${SOCKET_URL}/api/messages/${idToFetch}`);
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };
    fetchMessages();

    // Auto-messages logic
    if (role === 'user') {
      const autoMessages = [
        { text: "Hola, soy el Maestro. Veo que el destino te ha guiado hasta el portal con éxito.", delay: 2000 },
        { text: "Deseo ayudarte a encontrar la claridad y resolver lo que te aflige. Cuéntame con confianza, ¿qué situación sentimental o espiritual te trajo aquí y cómo puedo guiarte hoy?", delay: 5000 }
      ];

      autoMessages.forEach((msg, i) => {
        setTimeout(() => {
          setMessages(prev => {
            const exists = prev.find(m => m._id === `auto${i}`);
            if (exists) return prev;
            return [...prev, { _id: `auto${i}`, senderId: 'admin', text: msg.text, createdAt: new Date() }];
          });
        }, msg.delay);
      });
    }

    s.on('receive_message', (message) => {
      try {
        if (!message || !message.senderId) return;
        // Validate correct chat window
        if (role === 'admin' && activeChat && message.senderId !== activeChat && message.receiverId !== activeChat) return;
        
        setMessages((prev) => {
          if (prev.some(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
        
        // Play sound
        if (message.senderId !== (role === 'admin' ? 'admin' : userId)) {
          new Audio('/sounds/receive.mp3').play().catch(()=>{});
        }
      } catch (err) {
        console.error("Error in receive_message:", err);
      }
    });

    s.on('user_typing', ({ isTyping }) => setTheirTyping(isTyping));
    s.on('admin_typing', ({ isTyping }) => setTheirTyping(isTyping));

    return () => {
      s.disconnect();
    };
  }, [userId, role, activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, theirTyping]);

  const handleTyping = (e) => {
    setInputText(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current?.emit('typing', { userId: activeChat || userId, isTyping: true, role });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current?.emit('typing', { userId: activeChat || userId, isTyping: false, role });
    }, 1500);
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file, file.name || 'blob_file');
    try {
      const res = await fetch(`${SOCKET_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      return `${SOCKET_URL}${data.url}`;
    } catch (error) {
      console.error('File upload failed', error);
      return null;
    }
  };

  const sendMessage = async (e, customText = null) => {
    try {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      const textToSend = typeof customText === 'string' ? customText : inputText;
      if (!textToSend?.trim() && !mediaFile) return;

      let mediaUrl = null;
      let mediaType = null;

      if (mediaFile) {
        mediaUrl = await uploadFile(mediaFile);
        mediaType = mediaFile?.type?.startsWith('image/') ? 'image' : 'audio';
      }

      const messageData = {
        senderId: role === 'admin' ? 'admin' : userId,
        receiverId: role === 'admin' ? (activeChat || receiverId) : 'admin',
        text: textToSend || "",
        mediaUrl,
        mediaType
      };

      socketRef.current?.emit('send_message', messageData);
      
      if (!customText) {
        setInputText('');
        setMediaFile(null);
        setMediaPreview(null);
        socketRef.current?.emit('typing', { userId: activeChat || userId, isTyping: false, role });
      }
    } catch (err) {
      console.error("Critical error in sendMessage:", err);
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
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioBlob.name = `audio.${ext}`;
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
    <div className={`flex flex-col min-h-0 w-full flex-1 bg-[#111] ${role === 'user' ? 'max-w-md shadow-2xl relative overflow-hidden' : ''}`}>
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
              {role === 'user' ? (adminSettings?.name || 'Maestro') : `Chat con ${chatName || activeChat}`}
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
                     <CustomAudioMessage src={msg.mediaUrl} />
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
          <div className="mb-3 flex items-center justify-between w-full max-w-[300px] bg-dark-900 border border-white/10 rounded-xl p-2 shadow-lg">
             {mediaFile?.type?.startsWith('image/') ? (
               <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                 <img src={mediaPreview} alt="preview" className="object-cover w-full h-full" />
               </div>
             ) : (
               <div className="flex-1 overflow-hidden shrink-0">
                 <CustomAudioMessage src={mediaPreview} />
               </div>
             )}
             <div className="flex flex-col gap-2 shrink-0 ml-3">
               <button 
                 type="button"
                 onClick={() => sendMessage(null)}
                 className="bg-gold-500 hover:bg-gold-400 p-2 rounded-full text-black transition-colors shadow-md flex items-center justify-center translate-x-1"
                 title="Enviar adjunto"
               >
                 <Send size={16} className="-ml-0.5" />
               </button>
               <button 
                 type="button"
                 onClick={() => { setMediaPreview(null); setMediaFile(null); }}
                 className="bg-red-500/80 hover:bg-red-500 p-2 rounded-full text-white transition-colors shadow-md flex items-center justify-center translate-x-1"
                 title="Eliminar archivo"
               >
                 <Trash size={16} />
               </button>
             </div>
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

            {!!(inputText.trim() || mediaPreview || mediaFile) && (
               <button 
                type="submit" 
                key="send-btn"
                className="p-2 bg-gradient-to-r from-gold-500 to-yellow-300 text-black rounded-full hover:scale-105 transition shadow-[0_0_10px_rgba(212,175,55,0.4)]"
               >
                 <Send size={18} className="translate-x-[1px]" />
               </button>
            )}
            
            {!(inputText.trim() || mediaPreview || mediaFile) && (
               <button 
                type="button" 
                key="mic-btn"
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
