const mongoose = require('mongoose')

const focusLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  durationMinutes: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('FocusLog', focusLogSchema)
