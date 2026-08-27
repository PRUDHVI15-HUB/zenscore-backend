const mongoose = require('mongoose')

const checkpointSchema = new mongoose.Schema({
  question: { type: String, default: '' },
  options: [{ type: String }],
  correctAnswer: { type: Number, default: 0 },
  explanation: { type: String, default: '' },
  hint: { type: String, default: '' }
}, { _id: false })

const recommendedResourceSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  provider: { type: String, default: '' },
  type: { type: String, default: '' },
  description: { type: String, default: '' },
  url: { type: String, default: '' }
}, { _id: false })

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
  difficulty: { type: String, default: 'Medium' },
  type: { type: String, default: 'multiple_choice' },
  points: { type: Number, default: 10 }
})

const testCaseSchema = new mongoose.Schema({
  input: { type: String, default: '' },
  expected: { type: String, default: '' },
  description: { type: String, default: '' },
  isHidden: { type: Boolean, default: false }
}, { _id: false })

const codingExerciseSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  problem: { type: String, required: true },
  language: { type: String, default: 'javascript' },
  difficulty: { type: String, default: 'Intermediate' },
  starterCode: { type: String, default: '' },
  solutionStub: { type: String, default: '' },
  expectedOutput: { type: String, default: '' },
  exampleInput: { type: String, default: '' },
  requirements: [{ type: String }],
  constraints: [{ type: String }],
  hints: [{ type: String }],
  testCases: [testCaseSchema],
  points: { type: Number, default: 20 },
  passingThreshold: { type: Number, default: 100 }
})

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  objective: { type: String, default: '' },
  difficulty: { type: String, default: 'Medium' },
  requirements: [{ type: String }],
  starterCode: { type: String, default: '' },
  expectedOutput: { type: String, default: '' },
  allowedLanguages: [{ type: String }],
  evaluationCriteria: [{ type: String }],
  testCases: [testCaseSchema],
  minimumScore: { type: Number, default: 70 },
  timeEstimate: { type: String, default: '30-45 mins' },
  submissionType: { type: String, default: 'code' }
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


const projectSpecSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  objective: { type: String, default: '' },
  difficulty: { type: String, default: 'Intermediate' },
  timeEstimate: { type: String, default: '30 mins' },
  allowedLanguages: [{ type: String }],
  requirements: [{ type: String }],
  rubric: [{
    criterion: { type: String },
    weight: { type: Number },
    description: { type: String }
  }],
  starterCode: { type: String, default: '' },
  testCases: [{
    input: { type: String },
    expected: { type: String },
    description: { type: String },
    hidden: { type: Boolean, default: false }
  }]
}, { _id: false });

const moduleSchema = new mongoose.Schema({
  moduleNumber: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  estimatedTime: { type: String, default: '1h 30m' },
  difficulty: { type: String, default: 'Intermediate' },
  learningObjectives: [{ type: String }],
  checkpoint: checkpointSchema,
  recommendedResources: [recommendedResourceSchema],
  video: videoSchema,
  notes: notesSchema,
  resources: resourcesSchema,
  quiz: [quizQuestionSchema],
  codingExercise: codingExerciseSchema,
  assignment: assignmentSchema,
  projectSpec: projectSpecSchema,
  miniProject: miniProjectSchema,
  interviewQuestions: [interviewQuestionSchema],
  revisionNotes: { type: String, default: '' },
  completionXp: { type: Number, default: 100 }
})

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  difficulty: { type: String, required: true },
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
