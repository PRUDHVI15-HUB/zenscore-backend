/**
 * verify_ground_truth.js
 *
 * Audits ground-truth JSON files in eval/transcripts/ground_truth/.
 *
 * HARD RULE:
 * "it lists each unverified sheet, and I confirm by setting verified=true myself.
 *  The script must never set verified=true on its own."
 *
 * This script strictly inspects, audits, and reports on verification readiness.
 * It NEVER modifies 'verified: false' to 'true'. Verification must be manually performed
 * and certified by a human evaluator.
 */

const fs = require('fs')
const path = require('path')

const GT_DIR = path.join(__dirname, '..', 'eval', 'transcripts', 'ground_truth')
const IMAGES_DIR = path.join(__dirname, '..', 'eval', 'transcripts', 'images')

function auditGroundTruthFiles() {
  if (!fs.existsSync(GT_DIR)) {
    console.log(`Ground truth directory does not exist: ${GT_DIR}`)
    return
  }

  const files = fs.readdirSync(GT_DIR).filter(f => f.endsWith('.json'))

  console.log('===============================================================')
  console.log('ZenScore Transcript Ground-Truth Verification Audit')
  console.log('===============================================================')
  console.log(`Auditing ${files.length} ground truth files in: ${GT_DIR}\n`)

  const verifiedSheets = []
  const unverifiedSheets = []
  const invalidSheets = []

  for (const filename of files) {
    const filePath = path.join(GT_DIR, filename)
    let data
    try {
      data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    } catch (err) {
      invalidSheets.push({ filename, error: `Malformed JSON: ${err.message}` })
      continue
    }

    const issues = []
    if (!data.sheet_id) issues.push('Missing sheet_id')
    if (!data.university) issues.push('Empty university')
    if (!data.profile) issues.push('Empty profile')
    if (!data.image_quality) issues.push('Empty image_quality')
    if (!Array.isArray(data.subjects) || data.subjects.length === 0) {
      issues.push('Missing/empty subjects array')
    } else {
      data.subjects.forEach((sub, sIdx) => {
        if (!sub.name && !sub.code) issues.push(`Subject #${sIdx + 1} missing both code and name`)
        if (sub.credits == null) issues.push(`Subject #${sIdx + 1} (${sub.name || sub.code}) missing credits`)
        if (sub.grade_or_grade_point == null) issues.push(`Subject #${sIdx + 1} (${sub.name || sub.code}) missing grade_or_grade_point`)
      })
    }

    const isExplicitlyVerified = data.verified === true

    if (issues.length > 0 && isExplicitlyVerified) {
      invalidSheets.push({
        filename,
        sheet_id: data.sheet_id || filename,
        issues
      })
    } else if (isExplicitlyVerified) {
      verifiedSheets.push({
        filename,
        sheet_id: data.sheet_id,
        university: data.university,
        profile: data.profile,
        image_quality: data.image_quality,
        subjectsCount: data.subjects.length,
        verified_by: data.verified_by || 'Human Evaluator'
      })
    } else {
      unverifiedSheets.push({
        filename,
        sheet_id: data.sheet_id || filename,
        university: data.university || '(unassigned)',
        profile: data.profile || '(unassigned)',
        image_quality: data.image_quality || 'clean',
        subjectsCount: (data.subjects || []).length,
        issues
      })
    }
  }

  // Print Summary Table
  console.log('STATUS BREAKDOWN:')
  console.log(`  - Verified & Validated Sheets: ${verifiedSheets.length}`)
  console.log(`  - Pending Human Verification: ${unverifiedSheets.length}`)
  console.log(`  - Files with Validation Errors: ${invalidSheets.length}\n`)

  if (verifiedSheets.length > 0) {
    console.log('VERIFIED SHEETS (Eligible for Ingestion Benchmark):')
    console.table(verifiedSheets.map(s => ({
      'Sheet ID': s.sheet_id,
      'University': s.university,
      'Profile': s.profile,
      'Quality': s.image_quality,
      'Subjects': s.subjectsCount,
      'Verified By': s.verified_by
    })))
  }

  if (unverifiedSheets.length > 0) {
    console.log('\nUNVERIFIED SHEETS (EXCLUDED from evaluation until human verification):')
    unverifiedSheets.forEach((s, idx) => {
      console.log(`  ${idx + 1}. [UNVERIFIED] ${s.sheet_id} (${s.filename})`)
      console.log(`     Subjects logged: ${s.subjectsCount} | University: ${s.university} | Profile: ${s.profile}`)
      if (s.issues.length > 0) {
        console.log(`     Action required: ${s.issues.join('; ')}`)
      }
    })
    console.log('\nReminder: To verify any sheet above:')
    console.log('  1. Review the original image in eval/transcripts/images/')
    console.log('  2. Verify all subject codes, names, credits, grades in eval/transcripts/ground_truth/<sheet_id>.json')
    console.log('  3. In the JSON, set "verified": true and "verified_by": "<Your Name>"')
    console.log('  Note: This script will NEVER automatically change "verified" to true.\n')
  }

  if (invalidSheets.length > 0) {
    console.log('\nINVALID GROUND TRUTH FILES:')
    invalidSheets.forEach(inv => {
      console.log(`  - ${inv.filename}: ${inv.error || inv.issues.join(', ')}`)
    })
  }
}

if (require.main === module) {
  auditGroundTruthFiles()
}

module.exports = { auditGroundTruthFiles }
