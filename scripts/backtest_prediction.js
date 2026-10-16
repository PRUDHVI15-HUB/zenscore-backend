/**
 * backtest_prediction.js
 * 
 * Historical Backtesting of ZenScore GPA Prediction Engine.
 * For every real student in MongoDB with >= 3 data-rich semesters:
 * Iteratively predicts semester k from semesters 1..(k-1), compares against actual SGPA,
 * and computes n, MAE, and RMSE stratified by confidence level.
 * 
 * Generates:
 * - results/backtest_prediction.csv
 * - results/backtest_prediction.md
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const connectDB = require('../config/db')
const AcademicRecord = require('../models/AcademicRecord')
const { calculatePrediction } = require('../services/intelligence/engines/predictionEngine')
const { CONFIDENCE_THRESHOLDS } = require('../constants/academicConstants')

const RESULTS_DIR = path.resolve(__dirname, '../results')
const CSV_FILE = path.join(RESULTS_DIR, 'backtest_prediction.csv')
const MD_FILE = path.join(RESULTS_DIR, 'backtest_prediction.md')

async function runBacktest() {
  console.log('================================================================')
  console.log('  ZenScore AI — Prediction Engine Historical Backtest')
  console.log('================================================================\n')

  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true })
  }

  // Connect to live MongoDB database
  const conn = await connectDB()
  if (!conn) {
    console.error('❌ Database connection failed. Cannot access real student records.')
    process.exit(1)
  }

  // Fetch real student academic records
  const allRecords = await AcademicRecord.find({}).lean()
  console.log(`Total AcademicRecord documents in DB: ${allRecords.length}`)

  // Filter students with >= 3 data-rich semesters
  const eligibleStudents = []
  allRecords.forEach(rec => {
    if (!rec.semesters || !Array.isArray(rec.semesters)) return
    const validSemesters = rec.semesters
      .filter(s => (s.sgpa || 0) > 0 && Array.isArray(s.subjects) && s.subjects.length > 0)
      .sort((a, b) => a.semesterNumber - b.semesterNumber)
    if (validSemesters.length >= 3) {
      eligibleStudents.push({
        recordId: rec._id,
        userId: rec.user,
        semesters: validSemesters
      })
    }
  })

  console.log(`Students with >= 3 semesters of history: ${eligibleStudents.length}`)

  const confidenceStats = {
    Low: { n: 0, sumAbsError: 0, sumSqError: 0, details: [] },
    Medium: { n: 0, sumAbsError: 0, sumSqError: 0, details: [] },
    High: { n: 0, sumAbsError: 0, sumSqError: 0, details: [] },
    Overall: { n: 0, sumAbsError: 0, sumSqError: 0, details: [] }
  }

  // Perform walk-forward prediction on each eligible student
  eligibleStudents.forEach((student, sIdx) => {
    const sems = student.semesters
    for (let k = 2; k < sems.length; k++) {
      const priorSemesters = sems.slice(0, k)
      const targetSem = sems[k]
      const actualSGPA = parseFloat(targetSem.sgpa)

      // Run prediction using only history before semester k
      const predResult = calculatePrediction({ semesters: priorSemesters, targetCGPA: null }, 160)
      const predictedSGPA = predResult.predictedNextSGPA
      const confLabel = predResult.confidenceLabel || 'Low'

      const error = predictedSGPA - actualSGPA
      const absError = Math.abs(error)
      const sqError = error * error

      const recordItem = {
        studentId: `Student_${sIdx + 1}`,
        predictedSemester: targetSem.semesterNumber,
        historySemestersCount: priorSemesters.length,
        confidenceLevel: confLabel,
        predictedSGPA: parseFloat(predictedSGPA.toFixed(2)),
        actualSGPA: parseFloat(actualSGPA.toFixed(2)),
        error: parseFloat(error.toFixed(4)),
        absError: parseFloat(absError.toFixed(4))
      }

      if (confidenceStats[confLabel]) {
        confidenceStats[confLabel].n++
        confidenceStats[confLabel].sumAbsError += absError
        confidenceStats[confLabel].sumSqError += sqError
        confidenceStats[confLabel].details.push(recordItem)
      }

      confidenceStats.Overall.n++
      confidenceStats.Overall.sumAbsError += absError
      confidenceStats.Overall.sumSqError += sqError
      confidenceStats.Overall.details.push(recordItem)
    }
  })

  // Format outputs
  const formatMetrics = (stat) => {
    if (stat.n === 0) {
      return { n: 0, mae: 'N/A', rmse: 'N/A' }
    }
    const mae = stat.sumAbsError / stat.n
    const rmse = Math.sqrt(stat.sumSqError / stat.n)
    return {
      n: stat.n,
      mae: mae.toFixed(4),
      rmse: rmse.toFixed(4)
    }
  }

  const resultsTable = {
    Low: formatMetrics(confidenceStats.Low),
    Medium: formatMetrics(confidenceStats.Medium),
    High: formatMetrics(confidenceStats.High),
    Overall: formatMetrics(confidenceStats.Overall)
  }

  // Build CSV content
  let csvContent = 'ConfidenceLevel,N,MAE,RMSE\n'
  csvContent += `Low,${resultsTable.Low.n},${resultsTable.Low.mae},${resultsTable.Low.rmse}\n`
  csvContent += `Medium,${resultsTable.Medium.n},${resultsTable.Medium.mae},${resultsTable.Medium.rmse}\n`
  csvContent += `High,${resultsTable.High.n},${resultsTable.High.mae},${resultsTable.High.rmse}\n`
  csvContent += `Overall,${resultsTable.Overall.n},${resultsTable.Overall.mae},${resultsTable.Overall.rmse}\n`

  if (confidenceStats.Overall.details.length > 0) {
    csvContent += '\n--- Individual Prediction Walk-Forward Log ---\n'
    csvContent += 'Student,PredictedSem,HistorySemCount,Confidence,PredictedSGPA,ActualSGPA,Error,AbsError\n'
    confidenceStats.Overall.details.forEach(d => {
      csvContent += `${d.studentId},${d.predictedSemester},${d.historySemestersCount},${d.confidenceLevel},${d.predictedSGPA},${d.actualSGPA},${d.error},${d.absError}\n`
    })
  }

  fs.writeFileSync(CSV_FILE, csvContent, 'utf-8')

  // Build Markdown content
  let mdContent = '# ZenScore AI — GPA Prediction Engine Backtest Report\n\n'
  mdContent += `**Generated**: ${new Date().toISOString()}\n`
  mdContent += `**Total Registered Users in Database**: ${allRecords.length}\n`
  mdContent += `**Students with >= 3 Semesters History**: ${eligibleStudents.length}\n\n`

  if (eligibleStudents.length < 5) {
    mdContent += `> [!WARNING]\n`
    mdContent += `> **Status**: NOT MEASURED (Insufficient Sample Size)\n`
    mdContent += `> **Reason**: There are currently only n = ${eligibleStudents.length} real student(s) in the production database with >= 3 completed semesters of history. A reliable statistical backtest requires a larger longitudinal cohort (n >= 20).\n\n`
  }

  mdContent += '### Prediction Error by Confidence Level\n\n'
  mdContent += '| Confidence Level | History Semesters Threshold | n (Predictions) | MAE (SGPA Points) | RMSE (SGPA Points) |\n'
  mdContent += '| :--- | :--- | :--- | :--- | :--- |\n'
  mdContent += `| **Low** | < 2 semesters | ${resultsTable.Low.n} | ${resultsTable.Low.mae} | ${resultsTable.Low.rmse} |\n`
  mdContent += `| **Medium** | 2–3 semesters | ${resultsTable.Medium.n} | ${resultsTable.Medium.mae} | ${resultsTable.Medium.rmse} |\n`
  mdContent += `| **High** | >= 4 semesters | ${resultsTable.High.n} | ${resultsTable.High.mae} | ${resultsTable.High.rmse} |\n`
  mdContent += `| **Overall** | Combined | ${resultsTable.Overall.n} | ${resultsTable.Overall.mae} | ${resultsTable.Overall.rmse} |\n\n`

  if (confidenceStats.Overall.details.length > 0) {
    mdContent += '### Detailed Walk-Forward Logs\n\n'
    mdContent += '| Student | Target Semester | Prior History Count | Confidence | Predicted SGPA | Actual SGPA | Error |\n'
    mdContent += '| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n'
    confidenceStats.Overall.details.forEach(d => {
      mdContent += `| ${d.studentId} | Semester ${d.predictedSemester} | ${d.historySemestersCount} sem | ${d.confidenceLevel} | ${d.predictedSGPA} | ${d.actualSGPA} | ${d.error > 0 ? '+' : ''}${d.error} |\n`
    })
    mdContent += '\n'
  }

  fs.writeFileSync(MD_FILE, mdContent, 'utf-8')

  console.log('Results saved to:')
  console.log(`- ${CSV_FILE}`)
  console.log(`- ${MD_FILE}`)
  console.log('\nSummary:')
  console.table(resultsTable)

  if (eligibleStudents.length < 5) {
    console.log(`\n⚠️ NOT MEASURED - n = ${eligibleStudents.length} student(s) with sufficient history (>= 3 semesters).`)
  }

  await mongoose.disconnect()
}

runBacktest().catch(err => {
  console.error('Backtest script error:', err)
  process.exit(1)
})
