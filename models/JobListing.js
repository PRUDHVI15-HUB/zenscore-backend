const mongoose = require('mongoose')

const jobListingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String },
  domain: { type: String },
  level: { type: String, enum: ['Internship', 'Entry', 'Mid', 'Senior'], default: 'Entry' },
  requiredSkills: [{ type: String }],
  requiredCGPA: { type: Number, default: 0 },
  salary: { type: String },
  applyLink: { type: String },
  deadline: { type: Date },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

module.exports = mongoose.model('JobListing', jobListingSchema)
