const mongoose = require('mongoose')

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  youtubeId: { type: String, required: true },
  duration: { type: String, required: true },
  channel: { type: String, default: '' },
  thumbnail: { type: String, default: '' }
})

const notesSchema = new mongoose.Schema({
  markdown: { type: String, required: true },
  summary: { type: String, default: '' },
  keyPoints: [{ type: String }],
  commonMistakes: [{ type: String }]
})

const resourcesSchema = new mongoose.Schema({
  officialDocs: { type: String, default: '' },
  githubRepo: { type: String, default: '' },
  cheatSheet: { type: String, default: '' },
  practiceWebsite: { type: String, default: '' },
  blogArticles: { type: String, default: '' },
  referencePDFs: { type: String, default: '' }
})

const quizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  explanation: { type: String, default: '' },
  difficulty: { type: String, default: 'Easy' }
})

const codingExerciseSchema = new mongoose.Schema({
  problem: { type: String, required: true },
  starterCode: { type: String, default: '' },
  expectedOutput: { type: String, default: '' },
  hints: [{ type: String }],
  hiddenTestCases: [{
    input: { type: String },
    expected: { type: String }
  }]
})

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  submissionType: { type: String, default: 'text' }, // text, file, github
  evaluationCriteria: [{ type: String }]
})

const miniProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  instructions: { type: String, required: true }
})

const interviewQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  difficulty: { type: String, default: 'Medium' }
})

const moduleSchema = new mongoose.Schema({
  moduleNumber: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  estimatedTime: { type: String, default: '1h 30m' },
  difficulty: { type: String, default: 'Intermediate' },
  learningObjectives: [{ type: String }],
  video: videoSchema,
  notes: notesSchema,
  resources: resourcesSchema,
  quiz: [quizQuestionSchema],
  codingExercise: codingExerciseSchema,
  assignment: assignmentSchema,
  miniProject: miniProjectSchema,
  interviewQuestions: [interviewQuestionSchema],
  revisionNotes: { type: String, default: '' },
  completionXp: { type: Number, default: 100 }
})

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  category: { type: String, required: true }, // programming, datascience, webdev, devops, cloud, aiml
  difficulty: { type: String, required: true }, // Beginner, Intermediate, Advanced
  instructor: { type: String, required: true },
  estimatedHours: { type: String, default: '12 hrs' },
  prerequisites: [{ type: String }],
  learningOutcomes: [{ type: String }],
  careerRoles: [{ type: String }],
  certification: { type: String, default: '' },
  rating: { type: Number, default: 4.8 },
  technology: { type: String },
  technologies: [{ type: String }],
  tags: [{ type: String }],
  thumbnail: { type: String, default: '' },
  banner: { type: String, default: '' },
  xpReward: { type: Number, default: 300 },
  modules: [moduleSchema]
}, { timestamps: true })

module.exports = mongoose.model('Course', courseSchema)
