const mongoose = require('mongoose')

const dailyChallengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, required: true }, // DSA, SQL, Java, JavaScript, Aptitude, System Design
  difficulty: { type: String, required: true }, // Easy, Medium, Hard
  duration: { type: String, default: "10 mins" },
  xpReward: { type: Number, default: 15 },
  date: { type: String, required: true, unique: true }, // YYYY-MM-DD format
  submissions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true })

module.exports = mongoose.model('DailyChallenge', dailyChallengeSchema)
