const mongoose = require('mongoose')

const skillSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SkillCategory',
    required: [true, 'SkillCategory reference is required']
  },
  name: {
    type: String,
    required: [true, 'Skill name is required'],
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: [true, 'Skill slug is required'],
    trim: true,
    lowercase: true,
    unique: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
  },
  estimatedHours: {
    type: Number,
    default: 10,
    min: 1
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill'
  }],
  tags: [{
    type: String,
    trim: true
  }],
  thumbnail: {
    type: String,
    default: ''
  },
  isPublished: {
    type: Boolean,
    default: true
  }
}, { timestamps: true })

skillSchema.index({ category: 1, isPublished: 1 })
skillSchema.index({ difficulty: 1 })

module.exports = mongoose.model('Skill', skillSchema)
