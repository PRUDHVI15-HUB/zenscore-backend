const mongoose = require('mongoose')

const CandidateSchema = new mongoose.Schema({
  name: { type: String, default: null },
  email: { type: String, default: null },
  phone: { type: String, default: null },
  location: { type: String, default: null },
  linkedin: { type: String, default: null },
  github: { type: String, default: null },
  portfolio: { type: String, default: null }
}, { _id: false })

const EducationItemSchema = new mongoose.Schema({
  degree: { type: String, default: null },
  fieldOfStudy: { type: String, default: null },
  institution: { type: String, default: null },
  location: { type: String, default: null },
  startDate: { type: String, default: null },
  endDate: { type: String, default: null },
  gpa: { type: String, default: null },
  description: { type: String, default: null }
}, { _id: false })

const ExperienceItemSchema = new mongoose.Schema({
  title: { type: String, default: null },
  company: { type: String, default: null },
  location: { type: String, default: null },
  startDate: { type: String, default: null },
  endDate: { type: String, default: null },
  isCurrent: { type: Boolean, default: false },
  highlights: [{ type: String }],
  description: { type: String, default: null }
}, { _id: false })

const InternshipItemSchema = new mongoose.Schema({
  title: { type: String, default: null },
  company: { type: String, default: null },
  location: { type: String, default: null },
  startDate: { type: String, default: null },
  endDate: { type: String, default: null },
  highlights: [{ type: String }]
}, { _id: false })

const ProjectItemSchema = new mongoose.Schema({
  title: { type: String, default: null },
  technologies: [{ type: String }],
  link: { type: String, default: null },
  highlights: [{ type: String }],
  description: { type: String, default: null }
}, { _id: false })

const CertificationItemSchema = new mongoose.Schema({
  name: { type: String, default: null },
  issuer: { type: String, default: null },
  date: { type: String, default: null },
  url: { type: String, default: null }
}, { _id: false })

const CareerMatchSchema = new mongoose.Schema({
  targetCareer: { type: String, default: null },
  matchScore: { type: Number, default: 0 },
  matchingSkills: [{ type: String }],
  missingSkills: [{ type: String }],
  recommendedSkills: [{ type: String }]
}, { _id: false })

const AnalysisSchema = new mongoose.Schema({
  provider: { type: String, enum: ['external', 'internal'], default: 'internal' },
  atsScore: { type: Number, default: 0 },
  keywordMatch: { type: Number, default: 0 },
  formattingScore: { type: Number, default: 0 },
  contentScore: { type: Number, default: 0 },
  sectionScore: { type: Number, default: 0 },
  completeness: { type: Number, default: 0 },
  skillsDetected: [{ type: String }],
  matchingKeywords: [{ type: String }],
  missingKeywords: [{ type: String }],
  missingSections: [{ type: String }],
  formatIssues: [{ type: String }],
  recommendations: [{ type: mongoose.Schema.Types.Mixed }],
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  scoringReasons: [{ type: String }],
  careerMatch: { type: CareerMatchSchema, default: () => ({}) },
  fallbackNotice: { type: String, default: null },
  analyzedAt: { type: Date, default: Date.now }
}, { _id: false })

const ResumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true, enum: ['pdf', 'docx'] },
  fileSize: { type: Number, default: 0 },
  uploadedAt: { type: Date, default: Date.now, index: true },
  parsedAt: { type: Date, default: Date.now },

  candidate: { type: CandidateSchema, default: () => ({}) },
  summary: { type: String, default: null },

  education: [EducationItemSchema],
  experience: [ExperienceItemSchema],
  internships: [InternshipItemSchema],
  projects: [ProjectItemSchema],
  skills: [{ type: String }],
  certifications: [CertificationItemSchema],
  achievements: [{ type: String }],
  languages: [{ type: String }],

  provider: {
    name: { type: String, default: 'RChilli' },
    parserVersion: { type: String, default: 'v8' },
    requestId: { type: String, default: null }
  },

  analysis: { type: AnalysisSchema, default: () => ({}) },

  optimization: { type: mongoose.Schema.Types.Mixed, default: null },

  status: {
    type: String,
    enum: ['uploading', 'parsing', 'analyzed', 'parsed', 'ocr_required', 'failed'],
    default: 'analyzed'
  },

  isCurrent: { type: Boolean, default: true, index: true },
  parentResume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', default: null },
  version: { type: Number, default: 1 },
  versionLabel: { type: String, default: 'Original Upload' },
  isDraft: { type: Boolean, default: false, index: true },
  createdFrom: { type: String, enum: ['upload', 'draft', 'optimization', 'builder'], default: 'upload' },
  modifiedSections: [{ type: String }],
  contentSource: { type: String, default: 'original' },
  parserVersion: { type: String, default: 'RChilli_v8' }
}, {
  timestamps: true
})

ResumeSchema.index({ user: 1, isCurrent: 1 })
ResumeSchema.index({ user: 1, uploadedAt: -1 })

module.exports = mongoose.model('Resume', ResumeSchema)
