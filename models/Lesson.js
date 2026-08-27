const mongoose = require('mongoose')

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
  provider: { type: String, default: 'Documentation' },
  type: { type: String, default: 'reading' },
  difficulty: { type: String, default: 'Beginner' },
  estimatedMinutes: { type: Number, default: 10 }
}, { _id: false })

const codeExampleSchema = new mongoose.Schema({
  language: { type: String, default: 'javascript' },
  code: { type: String, required: true },
  explanation: { type: String, default: '' }
}, { _id: false })

const exerciseSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  difficulty: { type: String, default: 'Easy' },
  problemStatement: { type: String, default: '' },
  instructions: { type: String, default: '' },
  expectedInput: { type: String, default: '' },
  expectedOutput: { type: String, default: '' },
  starterCode: { type: String, default: '' },
  solutionCode: { type: String, default: '' },
  hints: [{ type: String }]
}, { _id: false })

const quizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOptionIndex: { type: Number, required: true },
  explanation: { type: String, default: '' }
}, { _id: false })

const lessonSchema = new mongoose.Schema({
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: [true, 'Skill reference is required']
  },
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
    trim: true
  },
  lessonNumber: {
    type: Number,
    required: true,
    min: 1
  },
  description: { type: String, default: '', trim: true },
  introduction: { type: String, default: '' },
  whatYouWillLearn: [{ type: String }],
  coreConcepts: [{ type: String }],
  syntax: { type: String, default: '' },
  codeExamples: [codeExampleSchema],
  commonMistakes: [{ type: String }],
  bestPractices: [{ type: String }],
  summary: { type: String, default: '' },
  estimatedMinutes: { type: Number, default: 30, min: 1 },
  learningObjectives: [{ type: String, trim: true }],
  resources: [resourceSchema],
  exercisePlaceholder: exerciseSchema,
  quizPlaceholder: {
    title: { type: String, default: '' },
    questions: [quizQuestionSchema]
  }
}, { timestamps: true })

lessonSchema.index({ skill: 1, lessonNumber: 1 })

module.exports = mongoose.model('Lesson', lessonSchema)
