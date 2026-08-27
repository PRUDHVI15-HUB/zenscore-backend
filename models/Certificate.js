const mongoose = require('mongoose')

const certificateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
  certificateId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  skillName: { type: String, default: 'Engineering' },
  score: { type: Number, default: 95 },
  issuedBy: { type: String, default: 'ZenScore AI Academy' },
  earnedAt: { type: Date, default: Date.now },
  certificateUrl: { type: String, default: '' }
}, { timestamps: true })

certificateSchema.index({ user: 1, skill: 1 }, { unique: true, sparse: true })
certificateSchema.index({ user: 1, course: 1 }, { unique: true, sparse: true })

module.exports = mongoose.model('Certificate', certificateSchema)
