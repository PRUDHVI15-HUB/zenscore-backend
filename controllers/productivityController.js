const FocusLog = require('../models/FocusLog')

// POST /api/productivity/focus-log
const addFocusLog = async (req, res) => {
  const { subject, durationMinutes, notes } = req.body
  if (!subject || !durationMinutes) {
    return res.status(400).json({ success: false, message: 'subject and durationMinutes are required.' })
  }

  try {
    const log = await FocusLog.create({
      user: req.user._id,
      subject,
      durationMinutes,
      notes: notes || '',
    })
    res.status(201).json({ success: true, data: log })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/productivity/analytics
const getAnalytics = async (req, res) => {
  try {
    const logs = await FocusLog.find({ user: req.user._id }).sort({ date: -1 })

    const totalMinutes = logs.reduce((sum, l) => sum + l.durationMinutes, 0)
    const totalHours = parseFloat((totalMinutes / 60).toFixed(1))

    // Group by subject
    const bySubject = {}
    logs.forEach(l => {
      bySubject[l.subject] = (bySubject[l.subject] || 0) + l.durationMinutes
    })

    // Last 7 days
    const last7Days = {}
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      last7Days[key] = 0
    }
    logs.forEach(l => {
      const key = new Date(l.date).toISOString().split('T')[0]
      if (key in last7Days) last7Days[key] += l.durationMinutes
    })

    res.status(200).json({
      success: true,
      data: {
        totalHours,
        totalSessions: logs.length,
        bySubject,
        last7Days,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/productivity/ai-suggestion
const getAISuggestion = async (req, res) => {
  try {
    const logs = await FocusLog.find({ user: req.user._id }).sort({ date: -1 }).limit(20)

    if (!logs.length) {
      return res.status(200).json({
        success: true,
        data: { suggestion: 'Start logging your study sessions to get personalized AI suggestions!' }
      })
    }

    const totalMinutes = logs.reduce((sum, l) => sum + l.durationMinutes, 0)
    const avgSession = totalMinutes / logs.length

    let suggestion = ''
    if (avgSession < 30) suggestion = 'Your sessions are short. Try the Pomodoro technique: 25 min focus + 5 min break.'
    else if (avgSession < 60) suggestion = 'Good session length! Try extending to 45-minute deep work blocks for better retention.'
    else if (avgSession > 120) suggestion = 'Long sessions detected. Take breaks every 90 minutes to avoid burnout.'
    else suggestion = 'Great study habits! Keep maintaining consistent daily sessions for best results.'

    const bySubject = {}
    logs.forEach(l => { bySubject[l.subject] = (bySubject[l.subject] || 0) + l.durationMinutes })
    const leastStudied = Object.entries(bySubject).sort((a, b) => a[1] - b[1])[0]

    if (leastStudied) {
      suggestion += ` Also, consider spending more time on ${leastStudied[0]} — it has the least study time.`
    }

    res.status(200).json({ success: true, data: { suggestion, avgSessionMinutes: Math.round(avgSession) } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { addFocusLog, getAnalytics, getAISuggestion }
