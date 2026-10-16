const Feedback = require('../models/Feedback')

const CURRENT_STUDY_ROUND = process.env.CURRENT_STUDY_ROUND || '2026-R1'

/**
 * POST /api/feedback
 * Submit SUS and Likert study feedback.
 * Enforces authentication and one submission per user per round.
 */
const submitFeedback = async (req, res) => {
  try {
    const userId = req.user._id
    const round = req.body.round || CURRENT_STUDY_ROUND

    // Check for existing submission in this round
    const existing = await Feedback.findOne({ user: userId, round })
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Feedback has already been submitted for round ${round}. Only one submission per user is allowed.`
      })
    }

    const {
      institution,
      year,
      susResponses,
      likertResponses,
      freeText = ''
    } = req.body

    if (!institution || !year || !susResponses || !likertResponses) {
      return res.status(400).json({
        success: false,
        message: 'Institution, year, susResponses (10 items), and likertResponses (5 items) are all required.'
      })
    }

    // Validate 10 SUS questions are present and integers 1-5
    for (let i = 1; i <= 10; i++) {
      const val = Number(susResponses[`q${i}`])
      if (isNaN(val) || val < 1 || val > 5) {
        return res.status(400).json({
          success: false,
          message: `SUS question q${i} must be an integer between 1 and 5.`
        })
      }
    }

    // Validate 5 Likert questions are present and integers 1-5
    const requiredLikertKeys = [
      'dashboardClear',
      'recommendationsUseful',
      'transcriptSavedTime',
      'careerReadinessUnderstandable',
      'wouldKeepUsing'
    ]
    for (const key of requiredLikertKeys) {
      const val = Number(likertResponses[key])
      if (isNaN(val) || val < 1 || val > 5) {
        return res.status(400).json({
          success: false,
          message: `Likert item '${key}' must be an integer between 1 and 5.`
        })
      }
    }

    const susScore = Feedback.calculateSUS(susResponses)

    const feedbackDoc = await Feedback.create({
      user: userId,
      round,
      institution: String(institution).trim(),
      year: Number(year),
      susResponses,
      likertResponses,
      susScore,
      freeText: String(freeText).trim()
    })

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your feedback has been recorded successfully.',
      data: {
        id: feedbackDoc._id,
        round: feedbackDoc.round,
        susScore: feedbackDoc.susScore
      }
    })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Feedback has already been submitted for this round.'
      })
    }
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal Server Error'
    })
  }
}

/**
 * GET /api/feedback/status
 * Check if the currently authenticated user has already submitted for this round.
 */
const getFeedbackStatus = async (req, res) => {
  try {
    const userId = req.user._id
    const round = req.query.round || CURRENT_STUDY_ROUND

    const existing = await Feedback.findOne({ user: userId, round }).select('-user')
    return res.status(200).json({
      success: true,
      data: {
        hasSubmitted: !!existing,
        round,
        submission: existing || null
      }
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal Server Error'
    })
  }
}

/**
 * GET /api/feedback/export-csv
 * Admin-only CSV export of all user feedback records.
 */
const exportFeedbackCSV = async (req, res) => {
  try {
    const records = await Feedback.find({})
      .populate('user', 'email name')
      .sort({ createdAt: -1 })
      .lean()

    const headers = [
      'SubmissionId',
      'Date',
      'Round',
      'Institution',
      'Year',
      'SUS_Score',
      'SUS_Q1',
      'SUS_Q2',
      'SUS_Q3',
      'SUS_Q4',
      'SUS_Q5',
      'SUS_Q6',
      'SUS_Q7',
      'SUS_Q8',
      'SUS_Q9',
      'SUS_Q10',
      'Likert_DashboardClear',
      'Likert_RecommendationsUseful',
      'Likert_TranscriptSavedTime',
      'Likert_CareerReadinessUnderstandable',
      'Likert_WouldKeepUsing',
      'Comments'
    ]

    let csvContent = headers.join(',') + '\n'

    records.forEach(r => {
      const row = [
        r._id,
        new Date(r.createdAt).toISOString(),
        `"${r.round || ''}"`,
        `"${(r.institution || '').replace(/"/g, '""')}"`,
        r.year || '',
        r.susScore || 0,
        r.susResponses?.q1 || '',
        r.susResponses?.q2 || '',
        r.susResponses?.q3 || '',
        r.susResponses?.q4 || '',
        r.susResponses?.q5 || '',
        r.susResponses?.q6 || '',
        r.susResponses?.q7 || '',
        r.susResponses?.q8 || '',
        r.susResponses?.q9 || '',
        r.susResponses?.q10 || '',
        r.likertResponses?.dashboardClear || '',
        r.likertResponses?.recommendationsUseful || '',
        r.likertResponses?.transcriptSavedTime || '',
        r.likertResponses?.careerReadinessUnderstandable || '',
        r.likertResponses?.wouldKeepUsing || '',
        `"${(r.freeText || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
      ]
      csvContent += row.join(',') + '\n'
    })

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="zenscore_feedback_${Date.now()}.csv"`)
    return res.status(200).send(csvContent)
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Error exporting feedback CSV'
    })
  }
}

module.exports = {
  submitFeedback,
  getFeedbackStatus,
  exportFeedbackCSV
}
