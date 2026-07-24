const mongoose = require('mongoose')

const careerPathSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  requiredSkills: [{ type: String }],
  avgSalary: { type: String },
  demandLevel: { type: String, enum: ['Low', 'Medium', 'High', 'Very High'] },
  topCompanies: [{ type: String }],
  roadmap: { type: Object },
}, { timestamps: true })

module.exports = mongoose.model('CareerPath', careerPathSchema)
