const mongoose = require('mongoose')

const sectionEnvelopeSchema = new mongoose.Schema({
  status: { type: String, enum: ['pending', 'live', 'stale'], default: 'pending' },
  source: { type: String, default: null },
  lastUpdated: { type: Date, default: null },
  version: { type: Number, default: 1 },
  data: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false })

const studentProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.Mixed, required: true, unique: true },
  email: { type: String },
  basicProfile: { type: sectionEnvelopeSchema, default: () => ({ status: 'pending', data: {} }) },
  academicSummary: { type: sectionEnvelopeSchema, default: () => ({ status: 'pending', data: {} }) },
  careerProfile: { type: sectionEnvelopeSchema, default: () => ({ status: 'pending', data: {} }) },
  skillsSummary: { type: sectionEnvelopeSchema, default: () => ({ status: 'pending', data: {} }) },
  coursesSummary: { type: sectionEnvelopeSchema, default: () => ({ status: 'pending', data: {} }) },
  jobsSummary: { type: sectionEnvelopeSchema, default: () => ({ status: 'pending', data: {} }) },
  productivitySummary: { type: sectionEnvelopeSchema, default: () => ({ status: 'pending', data: {} }) },
  aiSummary: { type: sectionEnvelopeSchema, default: () => ({ status: 'pending', data: {} }) },
  metadata: {
    version: { type: Number, default: 1 },
    lastUpdated: { type: Date, default: Date.now }
  }
}, { timestamps: true })

module.exports = mongoose.model('StudentProfile', studentProfileSchema)
