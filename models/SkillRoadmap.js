const mongoose = require('mongoose')

const skillRoadmapSchema = new mongoose.Schema({
  category: { type: String, required: true, unique: true },
  beginner: [{ name: String, resource: String }],
  intermediate: [{ name: String, resource: String }],
  advanced: [{ name: String, resource: String }],
  timeline: { type: String },
  platforms: [{ type: String }],
}, { timestamps: true })

module.exports = mongoose.model('SkillRoadmap', skillRoadmapSchema)
