const mongoose = require('mongoose')

const roadmapStepSchema = new mongoose.Schema({
  step: { type: String, required: true },
  title: { type: String, required: true },
  status: { type: String, enum: ['Completed', 'Current', 'Upcoming', 'Locked'], default: 'Upcoming' }
})

const userRoadmapSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  careerGoal: { type: String, default: 'Become a Full Stack Developer' },
  weeklyHours: { type: Number, default: 10 },
  preferredDomain: { type: String, default: 'Full Stack' },
  skillLevel: { type: String, default: 'Intermediate' },
  roadmapSteps: [roadmapStepSchema],
  completedPercent: { type: Number, default: 0 },
  estimatedMonths: { type: Number, default: 3 }
}, { timestamps: true })

module.exports = mongoose.model('UserRoadmap', userRoadmapSchema)
