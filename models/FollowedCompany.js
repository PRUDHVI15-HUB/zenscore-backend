const mongoose = require('mongoose')

const followedCompanySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  companyLogo: {
    type: String,
    default: '🏢'
  },
  companyWebsite: {
    type: String,
    default: ''
  },
  companyDomain: {
    type: String,
    default: ''
  },
  followedAt: {
    type: Date,
    default: Date.now
  },
  notificationsEnabled: {
    type: Boolean,
    default: true
  }
}, { timestamps: true })

// Unique compound index preventing duplicate company follows by the same student
followedCompanySchema.index({ user: 1, companyName: 1 }, { unique: true })

module.exports = mongoose.model('FollowedCompany', followedCompanySchema)
