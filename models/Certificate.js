const mongoose = require('mongoose')

const certificateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  earnedAt: { type: Date, default: Date.now },
  certificateUrl: { type: String, default: '' }
}, { timestamps: true })

certificateSchema.index({ user: 1, course: 1 }, { unique: true })

module.exports = mongoose.model('Certificate', certificateSchema)
