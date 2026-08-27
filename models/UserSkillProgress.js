const mongoose = require('mongoose')

const quizAttemptSchema = new mongoose.Schema({
  lesson: { type: mongoose.Schema.Types.Mixed, required: true },
  latestScore: { type: Number, default: 0 },
  highestScore: { type: Number, default: 0 },
  attemptsCount: { type: Number, default: 1 },
  passed: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false })

const completedResourceSchema = new mongoose.Schema({
  lesson: { type: mongoose.Schema.Types.Mixed },
  resourceUrl: { type: String, required: true },
  completedAt: { type: Date, default: Date.now }
}, { _id: false })

const completedProjectSchema = new mongoose.Schema({
  moduleId: { type: String, required: true },
  repoUrl: { type: String, default: '' },
  liveDemoUrl: { type: String, default: '' },
  notes: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now }
}, { _id: false })

const lessonStateSchema = new mongoose.Schema({
  lesson: { type: mongoose.Schema.Types.Mixed, required: true },
  learnCompleted: { type: Boolean, default: false },
  assessmentPassed: { type: Boolean, default: false },
  bestAssessmentScore: { type: Number, default: 0 },
  buildPassed: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date }
}, { _id: false })

const userSkillProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  skill: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'Skill',
    required: [true, 'Skill reference is required']
  },
  skillName: {
    type: String,
    default: ''
  },
  currentLesson: {
    type: mongoose.Schema.Types.Mixed
  },
  completedLessons: [{
    type: mongoose.Schema.Types.Mixed
  }],
  completedExercises: [{
    type: mongoose.Schema.Types.Mixed
  }],
  bookmarkedLessons: [{
    type: mongoose.Schema.Types.Mixed
  }],
  quizAttempts: [quizAttemptSchema],
  lessonStates: [lessonStateSchema],
  completedResources: [completedResourceSchema],
  completedProjects: [completedProjectSchema],
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
}, { timestamps: true })

userSkillProgressSchema.index({ user: 1, skill: 1 }, { unique: true })
userSkillProgressSchema.index({ user: 1, lastActivity: -1 })

module.exports = mongoose.model('UserSkillProgress', userSkillProgressSchema)
