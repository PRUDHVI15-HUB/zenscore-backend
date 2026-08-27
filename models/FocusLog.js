const mongoose = require('mongoose')

const focusLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subject: { type: String, required: true, trim: true },
  durationMinutes: { type: Number, required: true, min: 1 },
  date: { type: Date, default: Date.now },
  notes: { type: String, default: '', trim: true },
  category: { type: String, default: 'Courses', trim: true },
  xpEarned: { type: Number, default: 0 },
  clientSessionId: { type: String, default: null }
}, { timestamps: true })

// Compound indexes for user-scoped time series queries and deduplication
focusLogSchema.index({ user: 1, date: -1 })
focusLogSchema.index({ user: 1, clientSessionId: 1 })

module.exports = mongoose.model('FocusLog', focusLogSchema)
