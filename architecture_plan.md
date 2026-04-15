# Plan de Desarrollo y Arquitectura: Plataforma de Conversión Esotérica (Tarot)

Este documento define la arquitectura, esquema de base de datos y estructura real del proyecto para la **Plataforma de Conversión Esotérica (Tarot Experience)**. Está diseñado para proporcionar un contexto completo a un agente IDE, facilitando el desarrollo y la evolución del sistema.

## 1. Stack Tecnológico Actual

### Frontend (Next.js App Router)
- **Framework:** Next.js 16+ (React 19)
- **Estilos:** Tailwind CSS v4
- **Animaciones:** Framer Motion (para la experiencia inmersiva del ritual)
- **Iconografía:** Lucide React
- **Comunicación en T.R:** Socket.io-client
- **UI:** React Phone Number Input

### Backend (Node.js & Express)
- **Servidor:** Node.js con Express
- **WebSockets:** Socket.io (Comunicación bidireccional en tiempo real)
- **Base de Datos:** MongoDB (usando Mongoose). También implementa `mongodb-memory-server` como fallback de desarrollo local si no hay BD local.
- **Manejo de Archivos:** Multer (para subida de imágenes y audios en el chat)
- **Seguridad/Misc:** CORS, dotenv

---

## 2. Modelos de Base de Datos (Mongoose)

El sistema opera bajo un entorno NoSQL (MongoDB). A continuación se definen los esquemas `Mongoose` que estructuran el sistema:

### 2.1 Modelo: `User` (Leads y Usuarios)
Representa a la persona que entra a la landing page y rellena el formulario de inicio de consulta de tarot. Actúa como entidad en el CRM.
- **Campos principales:**
  - `userId`: String (Único para identificar al usuario, generado en frontend).
  - `socketId`: String (Identificador de la conexión activa de socket).
  - `name`: String, default 'Invitado'.
  - `phone`: String, default ''.
  - `status`: 'online' | 'offline'. (Para indicar presencia en vivo al admin).
  - `crmStatus`: 'nuevo', 'conversacion', 'caliente', 'cerrado', 'perdido'. (Pipeline de ventas).
  - `labels`: Array de Strings (Etiquetas personalizables).
  - `notes`: Array de Objetos `{ text: String, createdAt: Date }` (Notas privadas del admin).
  - `reason`: String (Razón de consulta).
  - `quizData`: Object (Datos adicionales o progresión).
  - `isArchived`: Boolean (Para ocultar leads en el CRM).
  - `lastSeen`: Date (Última vez conectado).

### 2.2 Modelo: `Message` (Historial de Chat)
Almacena las conversaciones entre los Leads y el Maestro (Administrador).
- **Campos principales:**
  - `senderId`: String (`userId` o 'admin').
  - `receiverId`: String (`userId` o 'admin').
  - `text`: String (Contenido del mensaje).
  - `mediaUrl`: String (Ruta local de archivos subidos /uploads).
  - `mediaType`: String (image, audio, etc).
  - `createdAt` / `updatedAt`: Date.

### 2.3 Modelo: `AdminSettings` 
Configuración y credenciales de acceso para el Maestro/Admin.
- **Campos principales:**
  - `name`: String (default: 'El Maestro').
  - `avatar`: String (URL de la imagen del maestro).
  - `email`: String (default: 'admin@tarot.com').
  - `password`: String (default: 'admin123').

### 2.4 Modelo: `QuickReply`
Respuestas rápidas predefinidas que el administrador puede disparar durante el chat para agilizar la conversación.
- **Campos principales:**
  - `label`: String (Título corto o atajo).
  - `text`: String (Texto completo a enviar).

---

## 3. Estructura del Proyecto

### Directorio: `/backend`
- `server.js`: Archivo principal. Configura CORS, Mongoose, Multer (archivos estáticos `/uploads`), e inicializa HTTP + Socket.io Server.
- `models/`: Archivos con esquemas dinámicos para `User`, `Message`, `AdminSettings`, y `QuickReply`.
- `uploads/`: Directorio donde Multer guarda imágenes/audios localmente.
- **APIs REST Core**:
  - `GET/POST /api/users` y asociados (Gestión de notas de CRM, archivado, status).
  - `POST /api/register` (Captura inicial de datos del funnel de Tarot).
  - `GET /api/messages/:userId` (Carga historial).
  - `GET/POST /api/quick-replies`
  - `GET/PUT /api/admin/settings` y `POST /api/admin/login`

### Directorio: `/frontend`
- **Rutas Principales de Usuario (Funnel Esotérico):**
  - `/page.js`: Landing principal de inmersión / inicio de la experiencia de lectura.
  - `/Transition/page.js`: Pantalla de carga para aumentar misterio/ansiedad antes de la lectura.
  - `/Scanner/page.js`: Lógica inmersiva donde el usuario coloca su huella/dedo.
  - `/Chat/page.js` (u análogos): Interfaz de conexión web socket con el Maestro.
  
- **Rutas Admin (CRM):**
  - `/admin/login/page.js`: Login administrativo.
  - `/admin/dashboard`: Gestión en tiempo real utilizando emisión de sockets de eventos como `new_lead`, `user_updated`.

---

## 4. Flujo Lógico y Ciclo de Vida del Sistema

1. **Adquisición (Frontend Usuario)**: El usuario entra vía móvil/desktop, sigue un ritual místico. En cierto punto deja su Nombre, Teléfono y Razón de consulta.
2. **Registro (REST /api/register)**: El frontend le pega a la API. El backend guarda, o actualiza, al usuario en MongoDB. Acto seguido le emite un evento Socket.io de sala global (`io.to('admins').emit('new_lead')`).
3. **Persistencia Socket.io**: Tras inicializarse, el frontend del usuario emite `join`. El backend hace ping/pongs manejando `status: 'online'` vs `'offline'`.
4. **Interacción (Chat Realtime)**:
   - Usuarios envían `send_message`.
   - Se guarda en la DB `Message`.
   - Admin recibe la notificación instantánea. La ficha del lead del admin salta en orden basado en `updatedAt`.
5. **Gestión Administrativa CRM**: El administrador visualiza al lead en vivo, y puede modificar su estatus en el pipeline (Nuevo > Conversación > Cerrado), agregar etiquetas y visualizar si está escribiendo (`typing`).

## 5. Pendientes y Evolución Natural
- Migrar archivos locales `uploads/` al Cloud en un entorno productivo (AWS S3 / Supabase Storage).
- Añadir seguridad real de JWT para `/api/admin/*` y sockets más allá de chequeos básicos de auth.
- Mejorar la escalabilidad usando Redis Pub/Sub junto a node instances si aumenta el tráfico global.
