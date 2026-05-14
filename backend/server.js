require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// ─── Supabase ────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── MAESTROS & SYSTEM STATE ──────────────────────────────────────────────────
const MAESTROS = [
  { id: 'carmen', name: 'MAESTRA CARMEN', email: 'carmen@tarot.com', password: 'carmenpassword', role: 'maestro' },
  { id: 'samuel', name: 'MAESTRO SAMUEL', email: 'samuel@tarot.com', password: 'samuelpassword', role: 'maestro' },
  { id: 'fatima', name: 'MAESTRA FÁTIMA', email: 'fatima@tarot.com', password: 'fatimapassword', role: 'maestro' },
  { id: 'jeremias', name: 'MAESTRO JEREMIAS', email: 'jeremias@tarot.com', password: 'jeremiaspassword', role: 'maestro' },
  { id: 'ricardo', name: 'MAESTRO RICARDO', email: 'ricardo@tarot.com', password: 'ricardopassword', role: 'maestro' },
  { id: 'regina', name: 'MAESTRA REGINA', email: 'regina@tarot.com', password: 'reginapassword', role: 'maestro' },
  { id: 'miguel', name: 'MAESTRO MIGUEL', email: 'miguel@tarot.com', password: 'miguelpassword', role: 'maestro' },
  { id: 'angel', name: 'MAESTRO ANGEL', email: 'angelm@tarot.com', password: 'angelpassword', role: 'maestro' },
];

let globalSettings = {
  autoDistribute: true,
  lastAssignedIndex: 0
};

// ─── Express + Socket.io ─────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));

// ─── File Upload ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (req.file) res.json({ url: `/uploads/${req.file.filename}` });
  else res.status(400).json({ error: 'No file uploaded' });
});

// ─── USERS ────────────────────────────────────────────────────────────────────
app.get('/api/users', async (req, res) => {
  const { maestroId } = req.query;
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('archivado', false)
    .order('actualizado_en', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  
  let mappedData = data.map(mapUser);
  if (maestroId && maestroId !== 'admin') {
    mappedData = mappedData.filter(u => u.quizData && u.quizData.assignedTo === maestroId);
  }
  
  res.json(mappedData);
});

app.post('/api/register', async (req, res) => {
  const { userId, name, phone, reason } = req.body;

  const { data: existing } = await supabase
    .from('usuarios')
    .select('id, quiz_data')
    .eq('user_id', userId)
    .single();

  let assignedTo = null;
  if (!existing && globalSettings.autoDistribute) {
    assignedTo = MAESTROS[globalSettings.lastAssignedIndex].id;
    globalSettings.lastAssignedIndex = (globalSettings.lastAssignedIndex + 1) % MAESTROS.length;
  }

  let user;
  if (existing) {
    const { data } = await supabase
      .from('usuarios')
      .update({ nombre: name, telefono: phone, razon: reason, estado: 'online', actualizado_en: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();
    user = data;
  } else {
    const quizData = assignedTo ? { assignedTo } : {};
    const { data } = await supabase
      .from('usuarios')
      .insert({ user_id: userId, nombre: name, telefono: phone, razon: reason, estado: 'online', quiz_data: quizData })
      .select()
      .single();
    user = data;
  }

  const mapped = mapUser(user);
  io.to('admins').emit('new_lead', mapped);
  io.to('admins').emit('user_updated', mapped);
  res.json(mapped);
});

app.put('/api/users/:userId/notes', async (req, res) => {
  const { userId } = req.params;
  const { text } = req.body;

  // Get current notes
  const { data: curr } = await supabase.from('usuarios').select('notas').eq('user_id', userId).single();
  const notes = [...(curr?.notas || []), { text, createdAt: new Date().toISOString() }];

  const { data } = await supabase
    .from('usuarios')
    .update({ notas: notes, actualizado_en: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  const mapped = mapUser(data);
  io.to('admins').emit('user_updated', mapped);
  res.json(mapped);
});

app.put('/api/users/:userId/status-crm', async (req, res) => {
  const { userId } = req.params;
  const { crmStatus } = req.body;

  const { data } = await supabase
    .from('usuarios')
    .update({ estado_crm: crmStatus, actualizado_en: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  const mapped = mapUser(data);
  io.to('admins').emit('user_updated', mapped);
  res.json(mapped);
});

app.put('/api/users/:userId/archive', async (req, res) => {
  const { userId } = req.params;
  const { isArchived } = req.body;

  const { data } = await supabase
    .from('usuarios')
    .update({ archivado: isArchived, actualizado_en: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  const mapped = mapUser(data);
  io.to('admins').emit('user_updated', mapped);
  res.json(mapped);
});

app.put('/api/users/:userId/assign', async (req, res) => {
  const { userId } = req.params;
  const { maestroId } = req.body;

  const { data: curr } = await supabase.from('usuarios').select('quiz_data').eq('user_id', userId).single();
  const quizData = curr?.quiz_data || {};
  quizData.assignedTo = maestroId;

  const { data } = await supabase
    .from('usuarios')
    .update({ quiz_data: quizData, actualizado_en: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  const mapped = mapUser(data);
  io.to('admins').emit('user_updated', mapped);
  res.json(mapped);
});

app.put('/api/users/:userId/whatsapp-click', async (req, res) => {
  const { userId } = req.params;
  
  const { data: curr } = await supabase.from('usuarios').select('etiquetas').eq('user_id', userId).single();
  const etiquetas = curr?.etiquetas || [];
  if (!etiquetas.includes('whatsapp_contactado')) {
    etiquetas.push('whatsapp_contactado');
  }

  const { data } = await supabase
    .from('usuarios')
    .update({ etiquetas, actualizado_en: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  const mapped = mapUser(data);
  io.to('admins').emit('user_updated', mapped);
  res.json(mapped);
});

app.delete('/api/users/:userId', async (req, res) => {
  const { userId } = req.params;
  await supabase.from('mensajes').delete().or(`emisor_id.eq.${userId},receptor_id.eq.${userId}`);
  await supabase.from('usuarios').delete().eq('user_id', userId);
  io.to('admins').emit('user_deleted', userId);
  res.json({ success: true });
});

// ─── MESSAGES ────────────────────────────────────────────────────────────────
app.get('/api/messages/:userId', async (req, res) => {
  const { userId } = req.params;
  const { data, error } = await supabase
    .from('mensajes')
    .select('*')
    .or(`emisor_id.eq.${userId},receptor_id.eq.${userId}`)
    .order('creado_en', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(mapMessage));
});

// ─── QUICK REPLIES ────────────────────────────────────────────────────────────
app.get('/api/quick-replies', async (req, res) => {
  const { data } = await supabase.from('respuestas_rapidas').select('*').order('creado_en', { ascending: true });
  res.json((data || []).map(r => ({ _id: r.id, label: r.etiqueta, text: r.texto })));
});

app.post('/api/quick-replies', async (req, res) => {
  const { label, text } = req.body;
  const { data } = await supabase
    .from('respuestas_rapidas')
    .insert({ etiqueta: label, texto: text })
    .select()
    .single();
  res.json({ _id: data.id, label: data.etiqueta, text: data.texto });
});

app.delete('/api/quick-replies/:id', async (req, res) => {
  await supabase.from('respuestas_rapidas').delete().eq('id', req.params.id);
  res.json({ success: true });
});

// ─── ADMIN SETTINGS ──────────────────────────────────────────────────────────
app.get('/api/admin/settings', async (req, res) => {
  const { data } = await supabase.from('configuracion_admin').select('*').single();
  res.json(mapAdminSettings(data));
});

app.put('/api/admin/settings', async (req, res) => {
  const { name, avatar, email } = req.body;
  
  // First, find if there is an existing settings row
  const { data: existing } = await supabase.from('configuracion_admin').select('id').limit(1).single();
  
  let resultData;
  if (existing && existing.id) {
    // Update existing
    const { data } = await supabase
      .from('configuracion_admin')
      .update({ nombre: name, avatar, email, actualizado_en: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    resultData = data;
  } else {
    // Insert new if empty
    const { data } = await supabase
      .from('configuracion_admin')
      .insert({ nombre: name, avatar, email, actualizado_en: new Date().toISOString() })
      .select()
      .single();
    resultData = data;
  }
  
  res.json(mapAdminSettings(resultData));
});

app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = email?.trim().toLowerCase();
  const cleanPassword = password?.trim();

  // 1. Verificación Superadmin
  const { data: settings } = await supabase.from('configuracion_admin').select('*').single();
  const validEmail = (settings?.email || 'admin@angelcordoba.com').toLowerCase();
  const validPassword = settings?.password_hash || 'Dayanadmin2026.';

  if (cleanEmail === validEmail && cleanPassword === validPassword) {
    return res.json({ success: true, user: { id: 'admin', email: cleanEmail, name: 'Super Admin', role: 'superadmin' } });
  }

  // Backup superadmin (MongoDB legacy)
  if (cleanEmail === 'admin@tarot.com' && cleanPassword === 'admin123') {
    return res.json({ success: true, user: { id: 'admin', email: cleanEmail, name: 'Super Admin', role: 'superadmin' } });
  }

  // 2. Verificación Maestros
  const maestro = MAESTROS.find(m => m.email === cleanEmail && m.password === cleanPassword);
  if (maestro) {
    return res.json({ success: true, user: { id: maestro.id, email: maestro.email, name: maestro.name, role: maestro.role } });
  }

  res.status(401).json({ error: 'Credenciales inválidas' });
});

// Configuración de Distribución
app.get('/api/admin/distribution', (req, res) => res.json(globalSettings));
app.put('/api/admin/distribution', (req, res) => {
  globalSettings.autoDistribute = req.body.autoDistribute;
  res.json(globalSettings);
});
app.get('/api/maestros', (req, res) => res.json(MAESTROS.map(m => ({ id: m.id, name: m.name }))));

// ─── SOCKET.IO ───────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  socket.on('join', async ({ userId, role }) => {
    try {
      socket.join(userId);
      if (role === 'admin') {
        socket.join('admins');
      } else {
        const { data: existing, error: findError } = await supabase.from('usuarios').select('id').eq('user_id', userId).single();
        if (existing) {
          await supabase.from('usuarios').update({ socket_id: socket.id, estado: 'online', actualizado_en: new Date().toISOString() }).eq('user_id', userId);
        } else {
          const { error: insertError } = await supabase.from('usuarios').insert({ user_id: userId, nombre: 'Anónimo', socket_id: socket.id, estado: 'online' });
          if (insertError) console.error('Error inserting user on join:', insertError);
        }
        const { data: user } = await supabase.from('usuarios').select('*').eq('user_id', userId).single();
        if (user) io.to('admins').emit('user_updated', mapUser(user));
      }
    } catch (err) {
      console.error('Critical error in join socket handler:', err);
    }
  });

  socket.on('typing', ({ userId, isTyping, role }) => {
    if (role === 'user') io.to('admins').emit('user_typing', { userId, isTyping });
    else if (role === 'admin') io.to(userId).emit('admin_typing', { isTyping });
  });

  socket.on('send_message', async ({ senderId, receiverId, text, mediaUrl, mediaType }) => {
    try {
      const { data: msg, error } = await supabase
        .from('mensajes')
        .insert({ emisor_id: senderId, receptor_id: receiverId, texto: text, media_url: mediaUrl, media_tipo: mediaType })
        .select()
        .single();

      if (error) {
        console.error('Supabase Insert Error in send_message:', error);
      }

      if (senderId !== 'admin') {
        await supabase.from('usuarios').update({ actualizado_en: new Date().toISOString() }).eq('user_id', senderId);
      }

      // If msg is null due to error, construct a fallback mapped message so chat continues
      const mapped = mapMessage(msg) || {
        _id: 'temp_' + Date.now(),
        senderId,
        receiverId,
        text,
        mediaUrl,
        mediaType,
        createdAt: new Date().toISOString()
      };

      const rooms = [senderId];
      if (receiverId === 'admin') {
        rooms.push('admins');
      } else {
        rooms.push(receiverId);
      }
      
      io.to(rooms).emit('receive_message', mapped);
    } catch (err) {
      console.error('Critical error in send_message socket handler:', err);
    }
  });

  socket.on('disconnect', async () => {
    const { data: user } = await supabase
      .from('usuarios')
      .update({ estado: 'offline', actualizado_en: new Date().toISOString() })
      .eq('socket_id', socket.id)
      .select()
      .single();
    if (user) io.to('admins').emit('user_updated', mapUser(user));
    console.log('Disconnected:', socket.id);
  });
});

// ─── Field Mappers (Supabase → Legacy Frontend Format) ───────────────────────
function mapUser(u) {
  if (!u) return null;
  return {
    _id: u.id,
    userId: u.user_id,
    socketId: u.socket_id,
    name: u.nombre,
    phone: u.telefono,
    reason: u.razon,
    status: u.estado,
    crmStatus: u.estado_crm,
    tags: u.etiquetas,
    notes: u.notas,
    quizData: u.quiz_data,
    isArchived: u.archivado,
    lastSeen: u.ultima_vez,
    createdAt: u.creado_en,
    updatedAt: u.actualizado_en,
  };
}

function mapMessage(m) {
  if (!m) return null;
  return {
    _id: m.id,
    senderId: m.emisor_id,
    receiverId: m.receptor_id,
    text: m.texto,
    mediaUrl: m.media_url,
    mediaType: m.media_tipo,
    createdAt: m.creado_en,
  };
}

function mapAdminSettings(s) {
  if (!s) return { name: 'Ángel Córdoba, Vidente y Maestro', email: 'angel@tarot.com', avatar: '' };
  return { _id: s.id, name: s.nombre, email: s.email, avatar: s.avatar || '', updatedAt: s.actualizado_en };
}

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5555;
server.listen(PORT, () => console.log(`✨ Backend Supabase running on port ${PORT}`));
