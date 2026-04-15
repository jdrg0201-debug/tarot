const mongoose = require('mongoose');

const AdminSettingsSchema = new mongoose.Schema({
  name: { type: String, default: 'El Maestro' },
  avatar: { type: String, default: '' },
  email: { type: String, default: 'admin@tarot.com' },
  password: { type: String, default: 'admin123' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminSettings', AdminSettingsSchema);
