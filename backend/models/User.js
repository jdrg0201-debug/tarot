const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  socketId: { type: String },
  name: { type: String, default: 'Invitado' },
  phone: { type: String, default: '' },
  status: { type: String, default: 'offline' }, // online/offline
  crmStatus: { type: String, default: 'nuevo' }, // nuevo, conversacion, caliente, cerrado, perdido
  labels: [{ type: String }],
  notes: [{ 
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  reason: { type: String, default: '' },
  quizData: { type: Object, default: {} },
  isArchived: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
