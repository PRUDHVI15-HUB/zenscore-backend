const mongoose = require('mongoose')

const userLessonNoteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true
  },
  content: {
    type: String,
    default: '',
    trim: true
  }
}, { timestamps: true })

userLessonNoteSchema.index({ user: 1, skill: 1, lesson: 1 }, { unique: true })
userLessonNoteSchema.index({ user: 1, lesson: 1 })

module.exports = mongoose.model('UserLessonNote', userLessonNoteSchema)
