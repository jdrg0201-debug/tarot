const mongoose = require('mongoose');

const QuickReplySchema = new mongoose.Schema({
  label: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('QuickReply', QuickReplySchema);
