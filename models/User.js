const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  profileImage: { type: String, default: '' },
  firebaseUid: { type: String, required: true, unique: true },
  skills: [{ type: String }],
  cgpa: { type: Number, default: 0, min: 0, max: 10 },
  projectsCount: { type: Number, default: 0 },
  branch: { type: String, default: '' },
  college: { type: String, default: '' },
  yearOfStudy: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  coins: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badges: [{
    name: { type: String },
    icon: { type: String },
    description: { type: String },
    earnedAt: { type: Date, default: Date.now }
  }],
  achievements: [{
    name: { type: String },
    unlockedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)
