const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true }, // 'admin' or userId
  text: { type: String, default: '' },
  mediaUrl: { type: String, default: null }, // for images/audio
  mediaType: { type: String, enum: ['text', 'image', 'audio', 'video', null], default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
