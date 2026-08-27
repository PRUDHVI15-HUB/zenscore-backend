const mongoose = require('mongoose')

const skillCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: [true, 'Category slug is required'],
    trim: true,
    lowercase: true,
    unique: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  icon: {
    type: String,
    default: '🌐'
  },
  color: {
    type: String,
    default: '#EFF6FF'
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: true
  }
}, { timestamps: true })

skillCategorySchema.index({ displayOrder: 1, isPublished: 1 })

module.exports = mongoose.model('SkillCategory', skillCategorySchema)
