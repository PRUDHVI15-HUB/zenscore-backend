const mongoose = require('mongoose')

const FeedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  round: {
    type: String,
    required: true,
    default: '2026-R1',
    trim: true
  },
  institution: {
    type: String,
    required: [true, 'Institution name is required'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Academic year is required'],
    min: 1,
    max: 5
  },
  // 10 Standard System Usability Scale (SUS) Questions (1-5 scale)
  susResponses: {
    q1: { type: Number, required: true, min: 1, max: 5 }, // Frequently use
    q2: { type: Number, required: true, min: 1, max: 5 }, // Unnecessarily complex
    q3: { type: Number, required: true, min: 1, max: 5 }, // Easy to use
    q4: { type: Number, required: true, min: 1, max: 5 }, // Need tech support
    q5: { type: Number, required: true, min: 1, max: 5 }, // Well integrated
    q6: { type: Number, required: true, min: 1, max: 5 }, // Inconsistency
    q7: { type: Number, required: true, min: 1, max: 5 }, // Learn quickly
    q8: { type: Number, required: true, min: 1, max: 5 }, // Cumbersome
    q9: { type: Number, required: true, min: 1, max: 5 }, // Confident
    q10: { type: Number, required: true, min: 1, max: 5 } // Needed to learn a lot
  },
  // 5 Specific Platform Likert Questions (1-5 scale)
  likertResponses: {
    dashboardClear: { type: Number, required: true, min: 1, max: 5 }, // The dashboard is clear
    recommendationsUseful: { type: Number, required: true, min: 1, max: 5 }, // The next-step recommendations are useful
    transcriptSavedTime: { type: Number, required: true, min: 1, max: 5 }, // The transcript import saved me time
    careerReadinessUnderstandable: { type: Number, required: true, min: 1, max: 5 }, // The career readiness score is understandable
    wouldKeepUsing: { type: Number, required: true, min: 1, max: 5 } // I would keep using it
  },
  susScore: {
    type: Number,
    min: 0,
    max: 100
  },
  freeText: {
    type: String,
    trim: true,
    default: ''
  }
}, { timestamps: true })

// Enforce single submission per user per study round
FeedbackSchema.index({ user: 1, round: 1 }, { unique: true })

/**
 * Calculates standard SUS score on 0-100 scale (Brooke, 1996)
 */
FeedbackSchema.statics.calculateSUS = function (responses) {
  if (!responses) return 0
  const q = responses
  let sum = 0
  // Odd questions (positive): (score - 1)
  sum += (Number(q.q1) - 1)
  sum += (Number(q.q3) - 1)
  sum += (Number(q.q5) - 1)
  sum += (Number(q.q7) - 1)
  sum += (Number(q.q9) - 1)
  // Even questions (negative): (5 - score)
  sum += (5 - Number(q.q2))
  sum += (5 - Number(q.q4))
  sum += (5 - Number(q.q6))
  sum += (5 - Number(q.q8))
  sum += (5 - Number(q.q10))

  return parseFloat((sum * 2.5).toFixed(2))
}

module.exports = mongoose.model('Feedback', FeedbackSchema)
