const mongoose = require('mongoose')

const jobListingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  logo: { type: String, default: '💼' },
  location: { type: String, default: 'Remote' },
  workMode: { type: String, default: 'Remote' },
  employmentType: { type: String, default: 'Full-Time' },
  experience: { type: String, default: 'Fresher' },
  salary: { type: String, default: '₹6 - ₹12 LPA' },
  minSalaryVal: { type: Number, default: 6 },
  category: { type: String, default: 'Software Engineering' },
  requiredSkills: [{ type: String }],
  description: { type: String },
  responsibilities: [{ type: String }],
  requirements: [{ type: String }],
  benefits: [{ type: String }],
  hiringProcess: [{ type: String }],
  aboutCompany: { type: String },
  eligibility: {
    cgpa: { type: String, default: '6.5+' },
    branches: [{ type: String }],
    graduationYear: { type: String, default: '2026 / 2027' }
  },
  aiMatch: { type: Number, default: 85 },
  recommendationReason: [{ type: String }],
  postedDate: { type: String, default: 'Recently' },
  deadline: { type: String, default: 'Open until filled' },
  featured: { type: Boolean, default: false },
  recommended: { type: Boolean, default: false },
  latest: { type: Boolean, default: false },
  applyLink: { type: String, default: '#' },
  source: { type: String, default: 'ZenScore' },
  externalId: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

// Indexes for high performance MongoDB queries
jobListingSchema.index({ title: 'text', company: 'text', requiredSkills: 'text' })
jobListingSchema.index({ category: 1, location: 1, workMode: 1, employmentType: 1, experience: 1 })
jobListingSchema.index({ featured: 1, recommended: 1, latest: 1, isActive: 1 })
jobListingSchema.index({ source: 1, externalId: 1 })

module.exports = mongoose.model('JobListing', jobListingSchema)
