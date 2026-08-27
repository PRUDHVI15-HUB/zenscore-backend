const mongoose = require('mongoose')

const userRoadmapSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roadmap: { type: mongoose.Schema.Types.ObjectId, ref: 'SkillRoadmap', required: true },
  completedNodeIds: [{ type: String }],
  currentProgressPercentage: { type: Number, default: 0 },
  lastActivityAt: { type: Date, default: Date.now }
}, { timestamps: true })

userRoadmapSchema.index({ user: 1, roadmap: 1 }, { unique: true })

module.exports = mongoose.model('UserRoadmap', userRoadmapSchema)
