const mongoose = require('mongoose')

const videoProgressSchema = new mongoose.Schema({
  moduleIndex: { type: Number, required: true },
  percentWatched: { type: Number, default: 0 },
  lastPosition: { type: Number, default: 0 }
})

const quizAttemptSchema = new mongoose.Schema({
  moduleIndex: { type: Number, required: true },
  score: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  date: { type: Date, default: Date.now },
  answers: [{ type: Number }]
})

const assignmentSubmissionSchema = new mongoose.Schema({
  moduleIndex: { type: Number, required: true },
  submissionText: { type: String, default: '' },
  type: { type: String, default: 'text' }, // text, file, github
  fileUrl: { type: String, default: '' },
  grade: { type: Number, default: 0 }, // 0 to 100
  feedback: { type: String, default: '' },
  status: { type: String, default: 'Pending' } // Pending, Graded
})

const codingProgressSchema = new mongoose.Schema({
  moduleIndex: { type: Number, required: true },
  code: { type: String, default: '' },
  passed: { type: Boolean, default: false }
})

const courseProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  completedVideos: [{ type: String }], // Completed module index strings
  completedNotes: [{ type: String }],
  completedQuizzes: [{ type: String }],
  completedAssignments: [{ type: String }],
  completedModules: [{ type: String }],
  completionPercentage: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  lastStudiedAt: { type: Date, default: Date.now },

  // Real LMS states
  lastOpenedModuleIndex: { type: Number, default: 0 },
  videoProgress: [videoProgressSchema],
  quizAttempts: [quizAttemptSchema],
  assignments: [assignmentSubmissionSchema],
  codingProgress: [codingProgressSchema],
  enrollmentTimestamp: { type: Date, default: Date.now }
}, { timestamps: true })

courseProgressSchema.index({ user: 1, course: 1 }, { unique: true })

module.exports = mongoose.model('CourseProgress', courseProgressSchema)
