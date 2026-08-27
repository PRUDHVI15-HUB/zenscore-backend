const mongoose = require('mongoose')

const jobAlertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  keywords: [{ type: String, trim: true }],
  categories: [{ type: String, trim: true }],
  companies: [{ type: String, trim: true }],
  locations: [{ type: String, trim: true }],
  workModes: [{ type: String, trim: true }],
  employmentTypes: [{ type: String, trim: true }],
  minimumSalary: {
    type: Number,
    default: 0
  },
  notifyEmail: {
    type: Boolean,
    default: true
  },
  notifyInApp: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastCheckedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

jobAlertSchema.index({ user: 1, isActive: 1 })

module.exports = mongoose.model('JobAlert', jobAlertSchema)
