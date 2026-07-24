const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: [
      'new_course',
      'completed_course',
      'certificate_earned',
      'daily_challenge_reset',
      'learning_goal_completed',
      'streak_milestone',
      'quiz_graded',
      'assignment_graded',
      'achievement_unlocked'
    ],
    required: true
  },
  read: { type: Boolean, default: false }
}, { timestamps: true })

module.exports = mongoose.model('Notification', notificationSchema)
