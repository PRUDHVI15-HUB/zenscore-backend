const mongoose = require('mongoose')

const roadmapNodeSchema = new mongoose.Schema({
  nodeId: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  linkedSkill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
  prerequisiteNodeIds: [{ type: String }],
  estimatedHours: { type: Number, default: 10 },
  order: { type: Number, required: true },
  isOptional: { type: Boolean, default: false },
  description: { type: String, default: '' }
}, { _id: false })

const skillRoadmapSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '🚀' },
  estimatedHours: { type: Number, default: 40 },
  estimatedWeeks: { type: Number, default: 8 },
  category: { type: String, default: 'Engineering' },
  difficulty: { type: String, default: 'Intermediate' },
  isPublished: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 1 },
  nodes: [roadmapNodeSchema]
}, { timestamps: true })

module.exports = mongoose.model('SkillRoadmap', skillRoadmapSchema)
