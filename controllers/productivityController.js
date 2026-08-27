const { createNotification } = require('../services/notificationService')
const mongoose = require('mongoose')
const FocusLog = require('../models/FocusLog')
const User = require('../models/User')
const { generateResponse } = require('../services/ai/aiProvider')

// POST /api/productivity/focus-log
const addFocusLog = async (req, res) => {
  try {
    const { subject, topic, durationMinutes, actualMinutes, minutes, notes, goal, category, clientSessionId, date } = req.body || {}
    const cleanSubject = (subject || topic || '').trim()
    const rawMins = durationMinutes || actualMinutes || minutes
    const mins = Number(rawMins)

    if (!cleanSubject) {
      return res.status(400).json({ success: false, message: 'subject or topic is required.' })
    }
    if (isNaN(mins) || mins <= 0 || mins > 720) {
      return res.status(400).json({ success: false, message: 'durationMinutes must be a valid number between 1 and 720.' })
    }

    // Deduplication check if clientSessionId is supplied
    if (clientSessionId) {
      const existing = await FocusLog.findOne({ user: req.user._id, clientSessionId })
      if (existing) {
        return res.status(200).json({
          success: true,
          message: 'Focus session already recorded.',
          data: existing,
          xpAwarded: 0
        })
      }
    }

    // Authoritative backend XP calculation: 1 min = 1 XP (capped at 120)
    const xpEarned = Math.min(120, Math.max(1, Math.round(mins)))

    const log = await FocusLog.create({
      user: req.user._id,
      subject: cleanSubject,
      durationMinutes: mins,
      notes: (notes || goal || '').trim(),
      category: (category || 'Courses').trim(),
      xpEarned,
      clientSessionId: clientSessionId || null,
      date: date ? new Date(date) : new Date()
    })

    // Award XP to user in MongoDB
    if (req.user?._id && mongoose.Types.ObjectId.isValid(req.user._id)) {
      await User.findByIdAndUpdate(req.user._id, { $inc: { xp: xpEarned } }).catch(err => {
        console.warn('User XP award notice:', err?.message)
      })
    }

    try {
      createNotification({
        userId: req.user._id,
        type: 'productivity',
        eventKey: `prod-focus-${log._id}`,
        title: 'Focus Session Completed',
        message: `Great job! You logged ${log.durationMinutes} minutes on ${log.subject}.`,
        icon: '⏱️',
        route: '/productivity',
        entityId: log._id,
        metadata: { duration: log.durationMinutes, subject: log.subject }
      }).catch(() => {})
    } catch (_) {}
    return res.status(201).json({ success: true, data: log, xpAwarded: xpEarned })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/productivity/focus-log
const getFocusLogs = async (req, res) => {
  try {
    const logs = await FocusLog.find({ user: req.user._id }).sort({ date: -1 })
    return res.status(200).json({ success: true, count: logs.length, data: logs })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// DELETE /api/productivity/focus-log/:id
const deleteFocusLog = async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid focus log ID.' })
    }
    const deleted = await FocusLog.findOneAndDelete({ _id: id, user: req.user._id })
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Focus log not found or access unauthorized.' })
    }
    return res.status(200).json({ success: true, message: 'Focus log deleted successfully.' })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/productivity/analytics
const getAnalytics = async (req, res) => {
  try {
    const logs = await FocusLog.find({ user: req.user._id }).sort({ date: -1 })

    const totalMinutes = logs.reduce((sum, l) => sum + (Number(l.durationMinutes) || 0), 0)
    const totalHours = parseFloat((totalMinutes / 60).toFixed(1))

    const bySubject = {}
    logs.forEach(l => {
      bySubject[l.subject] = (bySubject[l.subject] || 0) + l.durationMinutes
    })

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
        logs,
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

    const totalMinutes = logs.reduce((sum, l) => sum + (Number(l.durationMinutes) || 0), 0)
    const avgSession = totalMinutes / logs.length

    let suggestion = ''
    if (avgSession < 30) suggestion = 'Your sessions are short. Try the Pomodoro technique: 25 min focus + 5 min break.'
    else if (avgSession < 60) suggestion = 'Good session length! Try extending to 45-minute deep work blocks for better retention.'
    else if (avgSession > 120) suggestion = 'Long sessions detected. Take breaks every 90 minutes to avoid burnout.'
    else suggestion = 'Great study habits! Keep maintaining consistent daily sessions for best results.'

    const bySubject = {}
    logs.forEach(l => { bySubject[l.subject] = (bySubject[l.subject] || 0) + (Number(l.durationMinutes) || 0) })
    const leastStudied = Object.entries(bySubject).sort((a, b) => a[1] - b[1])[0]

    if (leastStudied) {
      suggestion += ' Also, consider spending more time on ' + leastStudied[0] + ' — it has the least study time.'
    }

    res.status(200).json({ success: true, data: { suggestion, avgSessionMinutes: Math.round(avgSession) } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/productivity/coach
const getProductivityCoach = async (req, res) => {
  try {
    const payload = req.body?.payload || req.body || {}
    const { focusSessions = [], health = {}, insights = {}, career = 'Software Engineer', roadmap = 'Phase 1', resume = 'In Progress', interview = 'Beginner' } = payload

    const totalSessions = focusSessions.length
    const healthScore = health.healthScore || 0
    const burnoutRisk = health.burnoutRisk || 'Low'
    const currentStreak = health.currentStreak || 0
    const summary = insights.summaryMetrics || {}

    const prompt = `You are an elite AI Productivity Coach for ZenScore AI.
Analyze this student's actual focus session metrics and provide personalized, highly actionable coaching.

STUDENT PROFILE & METRICS:
- Target Career: ${career}
- Roadmap Phase: ${roadmap}
- Resume Status: ${resume}
- Interview Readiness: ${interview}
- Health Score: ${healthScore}/100 (${health.healthTier || 'Average'})
- Burnout Risk: ${burnoutRisk}
- Current Streak: ${currentStreak} Days
- Total Focus Sessions: ${totalSessions}
- Total Focus Hours: ${summary.totalFocusTime || '0 hrs'}
- Average Session Length: ${summary.avgSessionDuration || '0 mins'}
- Longest Session: ${summary.longestSession || '0 mins'}
- Most Studied Topic/Module: ${summary.mostStudiedModule || 'General'}
- Most Productive Day: ${summary.mostProductiveDay || 'N/A'}

Return ONLY strict valid raw JSON object without markdown fences, matching this structure EXACTLY:
{
  "overallAssessment": "2-3 sentences summarizing current productivity, fatigue levels, and consistency.",
  "strengths": ["3 to 5 bullet strings describing real strengths based on data"],
  "weaknesses": ["2 to 4 bullet strings describing areas needing improvement"],
  "dailyAdvice": "Actionable daily focus tip (e.g. Spend 45 minutes on Roadmap).",
  "weeklyGoal": "Target goal for this week (e.g. Complete 6 sessions totaling 5 hours).",
  "focusRecommendation": "Optimal recommended session duration and structure.",
  "burnoutAdvice": "Advice tailored to their Burnout Risk level (${burnoutRisk}).",
  "roadmapSuggestion": "Suggestion linking productivity to their Roadmap (${roadmap}).",
  "careerSuggestion": "Career recommendation for their target role (${career}).",
  "motivation": "One inspiring, progress-aware motivational quote.",
  "nextMission": "Exactly ONE concrete, single actionable mission task for their next study session."
}`

    let rawAiResponse = ''
    try {
      rawAiResponse = await generateResponse(prompt)
    } catch (aiErr) {
      console.warn('Groq AI Call Error, falling back to deterministic coach:', aiErr?.message)
    }

    let parsedData = null
    if (rawAiResponse) {
      try {
        const cleanJson = rawAiResponse.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim()
        parsedData = JSON.parse(cleanJson)
      } catch (pErr) {
        console.warn('Failed to parse AI JSON response:', pErr?.message)
      }
    }

    // Fallback if AI call or JSON parsing fails
    if (!parsedData) {
      parsedData = generateDeterministicCoachFallback(payload)
    }

    return res.status(200).json({ success: true, data: parsedData })
  } catch (err) {
    console.error('Coach controller error:', err)
    const fallback = generateDeterministicCoachFallback(req.body?.payload || {})
    return res.status(200).json({ success: true, data: fallback })
  }
}

/**
 * Deterministic fallback generator using real user metrics
 */
function generateDeterministicCoachFallback(payload = {}) {
  const { focusSessions = [], health = {}, insights = {}, career = 'Software Engineer', roadmap = 'Phase 1' } = payload
  const summary = insights.summaryMetrics || {}
  const totalSessions = focusSessions.length
  const healthScore = health.healthScore || 70
  const burnoutRisk = health.burnoutRisk || 'Low'

  return {
    overallAssessment: `You have completed ${totalSessions} focus sessions totaling ${summary.totalFocusTime || '0 hrs'} with a Focus Health score of ${healthScore}/100. Your current pacing shows steady progress.`,
    strengths: [
      `Maintained a ${health.currentStreak || 0}-day study streak`,
      `Logged ${totalSessions} completed focus sessions`,
      `Primary focus on ${summary.mostStudiedModule || 'Core Subjects'}`,
      `Average session length of ${summary.avgSessionDuration || '30 mins'}`
    ],
    weaknesses: [
      `Need more balance across all 8 study modules`,
      `Ensure regular 10-minute micro-breaks after long sessions`
    ],
    dailyAdvice: `Spend 45 minutes on ${roadmap} and follow up with a 10-minute rest block.`,
    weeklyGoal: `Complete ${Math.max(5, totalSessions + 3)} sessions and reach ${Math.round((Number(summary.totalSessions) || 1) * 1.2)} study hours.`,
    focusRecommendation: `Recommend 45-minute deep work blocks with 10-minute recovery breaks.`,
    burnoutAdvice: burnoutRisk === 'Low'
      ? "You're maintaining a healthy balance. Keep up the consistent pace!"
      : burnoutRisk === 'Medium'
      ? "Recommend taking 15-minute breaks after 60-minute sessions."
      : burnoutRisk === 'High'
      ? "High fatigue detected! Reduce session duration to 30 minutes."
      : "Critical burnout risk! Schedule a full recovery day.",
    roadmapSuggestion: `Dedicate your next 2 sessions to advancing ${roadmap}.`,
    careerSuggestion: `For ${career}, focus heavily on core technical topics and problem-solving practice.`,
    motivation: `Consistency is the bridge between goals and accomplishment. Keep building every day!`,
    nextMission: `Complete a 45-minute focus session on ${summary.mostStudiedModule || 'DSA'}.`
  }
}

module.exports = { addFocusLog, getFocusLogs, deleteFocusLog, getAnalytics, getAISuggestion, getProductivityCoach }
