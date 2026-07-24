const mongoose = require('mongoose')

const assessmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Assignment', 'Quiz', 'Mid', 'Final', 'Lab', 'Internal', 'External', 'Project', 'Presentation', 'Other'],
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  maxScore: {
    type: Number,
    required: true,
    min: 1
  },
  weightage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
})

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  credits: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  attendance: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  finalGrade: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  assessments: [assessmentSchema],
  lastStudied: {
    type: Date
  }
})

const semesterSchema = new mongoose.Schema({
  semesterNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  status: {
    type: String,
    enum: ['Current', 'Completed'],
    default: 'Current'
  },
  sgpa: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  subjects: [subjectSchema]
})

const dailyTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  durationMinutes: {
    type: Number,
    default: 30
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  category: {
    type: String,
    enum: ['Revision', 'Practice', 'Notes', 'Assignment'],
    default: 'Revision'
  }
})

const studyPlanSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  tasks: [dailyTaskSchema],
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  }
})

const academicRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  currentCGPA: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  targetCGPA: {
    type: Number,
    default: 8.0,
    min: 0,
    max: 10
  },
  predictedCGPA: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  predictionInsights: {
    type: [String],
    default: []
  },
  predictionLastUpdated: {
    type: Date
  },
  semesters: {
    type: [semesterSchema],
    validate: {
      validator: function(v) {
        const numbers = v.map(s => s.semesterNumber);
        return numbers.length === new Set(numbers).size;
      },
      message: 'Semester numbers must be unique within an academic record.'
    }
  },
  studyPlans: [studyPlanSchema]
}, { timestamps: true })

module.exports = mongoose.model('AcademicRecord', academicRecordSchema)
