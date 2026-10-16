/**
 * analyze_feedback.js
 * 
 * User Study & Feedback Analytics Script for ZenScore AI.
 * Computes:
 * - Sample size n
 * - Number of institutions
 * - SUS score: mean, sample standard deviation, and median
 * - Mean and standard deviation for each of the 5 platform Likert items
 * - Raw comments list (NO LLM summarization)
 * - If n < 5, prints "NOT ENOUGH RESPONSES" and documents reasons
 * 
 * Generates:
 * - results/feedback_analysis.csv
 * - results/feedback_analysis.md
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const connectDB = require('../config/db')
const Feedback = require('../models/Feedback')

const RESULTS_DIR = path.resolve(__dirname, '../results')
const CSV_FILE = path.join(RESULTS_DIR, 'feedback_analysis.csv')
const MD_FILE = path.join(RESULTS_DIR, 'feedback_analysis.md')

function calculateMean(arr) {
  if (!arr || arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function calculateSampleSD(arr, meanVal = null) {
  if (!arr || arr.length < 2) return 0
  const mean = meanVal !== null ? meanVal : calculateMean(arr)
  const sumSq = arr.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0)
  return Math.sqrt(sumSq / (arr.length - 1))
}

function calculateMedian(arr) {
  if (!arr || arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

async function analyzeFeedback() {
  console.log('================================================================')
  console.log('  ZenScore AI — Student Feedback & User Study Analysis')
  console.log('================================================================\n')

  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true })
  }

  const conn = await connectDB()
  if (!conn) {
    console.error('❌ Failed to connect to MongoDB Atlas.')
    process.exit(1)
  }

  const feedbacks = await Feedback.find({}).lean()
  const n = feedbacks.length
  console.log(`Total feedback submissions in database: n = ${n}`)

  const institutions = new Set()
  const susScores = []
  const likertData = {
    dashboardClear: [],
    recommendationsUseful: [],
    transcriptSavedTime: [],
    careerReadinessUnderstandable: [],
    wouldKeepUsing: []
  }
  const rawComments = []

  feedbacks.forEach(f => {
    if (f.institution) institutions.add(f.institution.trim())
    if (typeof f.susScore === 'number' && !isNaN(f.susScore)) {
      susScores.push(f.susScore)
    }
    if (f.likertResponses) {
      if (typeof f.likertResponses.dashboardClear === 'number') likertData.dashboardClear.push(f.likertResponses.dashboardClear)
      if (typeof f.likertResponses.recommendationsUseful === 'number') likertData.recommendationsUseful.push(f.likertResponses.recommendationsUseful)
      if (typeof f.likertResponses.transcriptSavedTime === 'number') likertData.transcriptSavedTime.push(f.likertResponses.transcriptSavedTime)
      if (typeof f.likertResponses.careerReadinessUnderstandable === 'number') likertData.careerReadinessUnderstandable.push(f.likertResponses.careerReadinessUnderstandable)
      if (typeof f.likertResponses.wouldKeepUsing === 'number') likertData.wouldKeepUsing.push(f.likertResponses.wouldKeepUsing)
    }
    if (f.freeText && f.freeText.trim().length > 0) {
      rawComments.push({
        institution: f.institution || 'Anonymous',
        year: f.year,
        comment: f.freeText.trim()
      })
    }
  })

  // Format statistics
  const susMean = susScores.length > 0 ? calculateMean(susScores) : null
  const susSD = susScores.length >= 2 ? calculateSampleSD(susScores, susMean) : (susScores.length === 1 ? 0 : null)
  const susMedian = susScores.length > 0 ? calculateMedian(susScores) : null

  const getLikertStats = (arr) => {
    if (arr.length === 0) return { mean: 'N/A', sd: 'N/A' }
    const m = calculateMean(arr)
    const sd = arr.length >= 2 ? calculateSampleSD(arr, m) : 0
    return { mean: m.toFixed(2), sd: sd.toFixed(2) }
  }

  const likertResults = {
    dashboardClear: getLikertStats(likertData.dashboardClear),
    recommendationsUseful: getLikertStats(likertData.recommendationsUseful),
    transcriptSavedTime: getLikertStats(likertData.transcriptSavedTime),
    careerReadinessUnderstandable: getLikertStats(likertData.careerReadinessUnderstandable),
    wouldKeepUsing: getLikertStats(likertData.wouldKeepUsing)
  }

  // Build CSV
  let csv = 'Metric,Value,SD,Median\n'
  csv += `SampleSize_N,${n},N/A,N/A\n`
  csv += `InstitutionsCount,${institutions.size},N/A,N/A\n`
  csv += `SUS_Score,${susMean !== null ? susMean.toFixed(2) : 'N/A'},${susSD !== null ? susSD.toFixed(2) : 'N/A'},${susMedian !== null ? susMedian.toFixed(2) : 'N/A'}\n`
  csv += `Likert_DashboardClear,${likertResults.dashboardClear.mean},${likertResults.dashboardClear.sd},N/A\n`
  csv += `Likert_RecommendationsUseful,${likertResults.recommendationsUseful.mean},${likertResults.recommendationsUseful.sd},N/A\n`
  csv += `Likert_TranscriptSavedTime,${likertResults.transcriptSavedTime.mean},${likertResults.transcriptSavedTime.sd},N/A\n`
  csv += `Likert_CareerReadinessUnderstandable,${likertResults.careerReadinessUnderstandable.mean},${likertResults.careerReadinessUnderstandable.sd},N/A\n`
  csv += `Likert_WouldKeepUsing,${likertResults.wouldKeepUsing.mean},${likertResults.wouldKeepUsing.sd},N/A\n`

  if (rawComments.length > 0) {
    csv += '\n--- Raw Free-Text Comments ---\n'
    csv += 'Institution,Year,Comment\n'
    rawComments.forEach(c => {
      csv += `"${c.institution}",${c.year},"${c.comment.replace(/"/g, '""')}"\n`
    })
  }

  fs.writeFileSync(CSV_FILE, csv, 'utf-8')

  // Build Markdown
  let md = '# ZenScore AI — Student Usability & User Study Report\n\n'
  md += `**Generated**: ${new Date().toISOString()}\n`
  md += `**Sample Size (n)**: ${n}\n`
  md += `**Institutions Represented**: ${institutions.size} (${Array.from(institutions).join(', ') || 'None'})\n\n`

  if (n < 5) {
    md += '> [!WARNING]\n'
    md += '> **Status**: NOT ENOUGH RESPONSES (NOT MEASURED)\n'
    md += `> **Reason**: Currently only n = ${n} student feedback submission(s) recorded in database. A minimum cohort of n >= 5 (and ideally n >= 30 across 3+ universities) is required for peer-reviewed usability statistics.\n\n`
  }

  md += '### System Usability Scale (SUS) Score\n\n'
  md += '| Metric | Value |\n'
  md += '| :--- | :--- |\n'
  md += `| **Mean SUS Score** | ${susMean !== null ? susMean.toFixed(2) + ' / 100' : 'N/A'} |\n`
  md += `| **Standard Deviation (SD)** | ${susSD !== null ? '±' + susSD.toFixed(2) : 'N/A'} |\n`
  md += `| **Median SUS Score** | ${susMedian !== null ? susMedian.toFixed(2) : 'N/A'} |\n\n`

  md += '### Platform-Specific Likert Questions (1–5 Scale)\n\n'
  md += '| Item | Question Statement | Mean | Standard Deviation (SD) |\n'
  md += '| :--- | :--- | :--- | :--- |\n'
  md += `| 1 | The dashboard is clear | ${likertResults.dashboardClear.mean} | ${likertResults.dashboardClear.sd} |\n`
  md += `| 2 | The next-step recommendations are useful | ${likertResults.recommendationsUseful.mean} | ${likertResults.recommendationsUseful.sd} |\n`
  md += `| 3 | The transcript import saved me time | ${likertResults.transcriptSavedTime.mean} | ${likertResults.transcriptSavedTime.sd} |\n`
  md += `| 4 | The career readiness score is understandable | ${likertResults.careerReadinessUnderstandable.mean} | ${likertResults.careerReadinessUnderstandable.sd} |\n`
  md += `| 5 | I would keep using it | ${likertResults.wouldKeepUsing.mean} | ${likertResults.wouldKeepUsing.sd} |\n\n`

  md += '### Raw Free-Text Student Comments\n\n'
  if (rawComments.length === 0) {
    md += '_No free-text comments submitted yet._\n'
  } else {
    rawComments.forEach((c, idx) => {
      md += `${idx + 1}. **[${c.institution} - Year ${c.year}]**: "${c.comment}"\n`
    })
  }

  fs.writeFileSync(MD_FILE, md, 'utf-8')

  console.log(`Results written to: ${CSV_FILE} and ${MD_FILE}`)

  if (n < 5) {
    console.log('\n⚠️ NOT ENOUGH RESPONSES')
  }

  await mongoose.disconnect()
}

analyzeFeedback().catch(err => {
  console.error('Error analyzing feedback:', err)
  process.exit(1)
})
