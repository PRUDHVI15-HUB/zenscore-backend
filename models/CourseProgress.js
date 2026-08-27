const mongoose = require('mongoose')

const studyNoteSchema = new mongoose.Schema({
  moduleIndex: { type: Number, required: true },
  content: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
})

const videoProgressSchema = new mongoose.Schema({
  moduleIndex: { type: Number, required: true },
  percentWatched: { type: Number, default: 0 },
  lastPosition: { type: Number, default: 0 }
})

const quizAttemptSchema = new mongoose.Schema({
  moduleIndex: { type: Number, required: true },
  score: { type: Number, required: true },
  correctCount: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  passed: { type: Boolean, required: true },
  date: { type: Date, default: Date.now },
  submittedAt: { type: Date, default: Date.now },
  attemptNumber: { type: Number, default: 1 },
  answers: [{ type: Number }]
})

const assignmentSubmissionSchema = new mongoose.Schema({
  moduleIndex: { type: Number, required: true },
  submissionText: { type: String, default: '' },
  type: { type: String, default: 'text' },
  fileUrl: { type: String, default: '' },
  grade: { type: Number, default: 0 },
  feedback: { type: String, default: '' },
  status: { type: String, default: 'Pending' }
})

const codingAttemptSchema = new mongoose.Schema({
  attemptNumber: { type: Number, default: 1 },
  code: { type: String, default: '' },
  testsPassed: { type: Number, default: 0 },
  testsTotal: { type: Number, default: 0 },
  passed: { type: Boolean, default: false },
  output: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now }
}, { _id: false })

const codingProgressSchema = new mongoose.Schema({
  moduleIndex: { type: Number, required: true },
  code: { type: String, default: '' },
  language: { type: String, default: 'javascript' },
  passed: { type: Boolean, default: false },
  testsPassed: { type: Number, default: 0 },
  testsTotal: { type: Number, default: 0 },
  attempts: [codingAttemptSchema],
  lastSubmittedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
})


const projectTestResultSchema = new mongoose.Schema({
  testIndex: { type: Number, default: 1 },
  description: { type: String, default: '' },
  passed: { type: Boolean, default: false },
  expected: { type: String, default: '' },
  actual: { type: String, default: '' }
}, { _id: false })

const projectAttemptSchema = new mongoose.Schema({
  attemptNumber: { type: Number, default: 1 },
  code: { type: String, default: '' },
  finalScore: { type: Number, default: 0 },
  testScore: { type: Number, default: 0 },
  qualityScore: { type: Number, default: 0 },
  requirementsScore: { type: Number, default: 0 },
  architectureScore: { type: Number, default: 0 },
  passed: { type: Boolean, default: false },
  testResults: [projectTestResultSchema],
  aiFeedback: {
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    missingRequirements: [{ type: String }],
    suggestions: [{ type: String }],
    summary: { type: String, default: '' }
  },
  submittedAt: { type: Date, default: Date.now }
}, { _id: false })

const projectProgressSchema = new mongoose.Schema({
  moduleIndex: { type: Number, required: true },
  code: { type: String, default: '' },
  language: { type: String, default: 'javascript' },
  passed: { type: Boolean, default: false },
  bestScore: { type: Number, default: 0 },
  attempts: [projectAttemptSchema],
  lastSubmittedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
})


const projectSubmissionSchema = new mongoose.Schema({
  moduleIndex: { type: Number, required: true },
  code: { type: String, default: '' },
  language: { type: String, default: 'javascript' },
  score: { type: Number, default: 0 },
  passed: { type: Boolean, default: false },
  testScore: { type: Number, default: 0 },
  requirementsScore: { type: Number, default: 0 },
  qualityScore: { type: Number, default: 0 },
  architectureScore: { type: Number, default: 0 },
  aiFeedback: {
    strengths: [{ type: String }],
    suggestions: [{ type: String }],
    summary: { type: String, default: '' }
  },
  testsPassed: { type: Number, default: 0 },
  testsTotal: { type: Number, default: 0 },
  executionTime: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now }
}, { _id: false });

const courseProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  completedVideos: [{ type: String }],
  completedNotes: [{ type: String }],
  completedQuizzes: [{ type: String }],
  completedCoding: [{ type: String }],
  completedAssignments: [{ type: String }],
  projectProgress: [projectProgressSchema],
  completedModules: [{ type: String }],
  completionPercentage: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  lastStudiedAt: { type: Date, default: Date.now },

  lastOpenedModuleIndex: { type: Number, default: 0 },
  videoProgress: [videoProgressSchema],
  quizAttempts: [quizAttemptSchema],
  assignments: [assignmentSubmissionSchema],
  codingProgress: [codingProgressSchema],
  projectDrafts: { type: Map, of: String, default: () => new Map() },
  projectSubmissions: [projectSubmissionSchema],
  projectBestScores: { type: Map, of: Number, default: () => new Map() },
  studyNotes: [studyNoteSchema],
  enrollmentTimestamp: { type: Date, default: Date.now }
}, { timestamps: true })

courseProgressSchema.index({ user: 1, course: 1 }, { unique: true })

module.exports = mongoose.model('CourseProgress', courseProgressSchema)
