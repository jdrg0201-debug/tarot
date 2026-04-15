# Experiencia Mística - Tarot Premium
App Full-Stack (Next.js, TailwindCSS, Express, Socket.io, MongoDB)

## Requisitos Previos

- Node.js (v18+ recomendado)
- MongoDB en ejecución (por defecto conecta a `mongodb://127.0.0.1:27017/tarot_experiencia`)

## Instalación y Ejecución

Esta aplicación consta de un frontend y un backend.

### 1. Iniciar el Backend

Abre una terminal y ejecuta:

```bash
cd backend
npm install
npm run start
```
*(Si deseas modo desarrollo, puedes usar `npx nodemon server.js`)*

### 2. Iniciar el Frontend

Abre otra terminal y ejecuta:

```bash
cd frontend
npm install
npm run dev
```

El Frontend estará disponible en: [http://localhost:3000](http://localhost:3000)

### 3. Rutas principales

- **Experiencia de Usuario:** `http://localhost:3000/` (Página de inicio que lleva al escáner de huella y luego al chat)
- **Panel Administrativo:** `http://localhost:3000/admin` (Dashboard para el maestro)

## Sonidos (Opcional pero Recomendado)
Añade archivos de sonido en formato `.mp3` en la carpeta `frontend/public/sounds/` con los siguientes nombres:
- `click.mp3` (click de botón)
- `success.mp3` (completar huella)
- `receive.mp3` (mensaje entrante)
- `send.mp3` (mensaje enviado)
- `notification.mp3` (notificación admin)

## Funcionalidades Incluidas

- Animaciones premium con Framer Motion.
- Chat en tiempo real usando Socket.IO.
- Grabación de audios in-app y subida de imágenes.
- Indicador de "escribiendo...".
- Notificaciones en tiempo real en el Dashboard del Administrador.
- Manejo de clientes concurrentes (etiquetado, notas privadas, tiempos de actividad).
