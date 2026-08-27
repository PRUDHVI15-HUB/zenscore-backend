const mongoose = require('mongoose')

const timelineEntrySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  remarks: {
    type: String,
    default: ''
  }
}, { _id: false })

const jobApplicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobListing',
    required: true
  },
  applicationType: {
    type: String,
    enum: ['external', 'internal'],
    default: 'external'
  },
  status: {
    type: String,
    enum: [
      'Applied',
      'Resume Reviewed',
      'Assessment',
      'Technical Interview',
      'HR Interview',
      'Offer',
      'Rejected',
      'Withdrawn'
    ],
    default: 'Applied'
  },
  timeline: [timelineEntrySchema],
  recruiterNotes: {
    type: String,
    default: ''
  },
  interviewDate: {
    type: Date
  },
  offerPackage: {
    type: String,
    default: ''
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  resumeUrl: {
    type: String,
    default: ''
  },
  coverLetter: {
    type: String,
    default: ''
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true })

// Unique compound index preventing duplicate applications for the same job
jobApplicationSchema.index({ user: 1, job: 1 }, { unique: true })

module.exports = mongoose.model('JobApplication', jobApplicationSchema)
