/**
 * make_ground_truth_draft.js
 *
 * For each image/PDF in eval/transcripts/images/ without an existing ground-truth JSON,
 * creates a draft JSON template with verified=false and pipeline-independent fields empty
 * (does NOT copy the pipeline's own output, maintaining strict empirical integrity).
 *
 * Then prints a checklist of sheets awaiting human verification.
 */

const fs = require('fs')
const path = require('path')

const IMAGES_DIR = path.join(__dirname, '..', 'eval', 'transcripts', 'images')
const GT_DIR = path.join(__dirname, '..', 'eval', 'transcripts', 'ground_truth')

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function makeGroundTruthDrafts() {
  ensureDir(IMAGES_DIR)
  ensureDir(GT_DIR)

  const imageFiles = fs.readdirSync(IMAGES_DIR).filter(file => {
    if (file === '.gitkeep' || file.startsWith('.')) return false
    const ext = path.extname(file).toLowerCase()
    return ['.png', '.jpg', '.jpeg', '.pdf', '.tiff', '.bmp', '.webp'].includes(ext)
  })

  console.log('===============================================================')
  console.log('ZenScore Transcript Ground Truth Draft Generator')
  console.log('===============================================================')
  console.log(`Found ${imageFiles.length} mark sheet files in: ${IMAGES_DIR}`)

  let createdCount = 0
  for (const file of imageFiles) {
    const ext = path.extname(file)
    const sheetId = path.basename(file, ext)
    const gtFilePath = path.join(GT_DIR, `${sheetId}.json`)

    if (!fs.existsSync(gtFilePath)) {
      const draft = {
        sheet_id: sheetId,
        filename: file,
        university: '',
        profile: '',
        image_quality: 'clean', // 'clean' | 'average' | 'poor'
        verified: false,
        verified_by: null,
        subjects: [],
        raw_text: null
      }

      fs.writeFileSync(gtFilePath, JSON.stringify(draft, null, 2), 'utf-8')
      console.log(`  [+] Created draft ground truth: eval/transcripts/ground_truth/${sheetId}.json`)
      createdCount++
    }
  }

  // Load and inspect all ground truth files to print verification checklist
  const allGtFiles = fs.readdirSync(GT_DIR).filter(f => f.endsWith('.json'))
  const unverified = []
  const verified = []

  for (const gtFile of allGtFiles) {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(GT_DIR, gtFile), 'utf-8'))
      if (content.verified === true) {
        verified.push({ file: gtFile, id: content.sheet_id || gtFile, verifier: content.verified_by || 'Human' })
      } else {
        unverified.push({ file: gtFile, id: content.sheet_id || gtFile, subjectsCount: (content.subjects || []).length })
      }
    } catch (e) {
      unverified.push({ file: gtFile, id: gtFile, error: 'Malformed JSON' })
    }
  }

  console.log('\n---------------------------------------------------------------')
  console.log(`SUMMARY: ${createdCount} new drafts created | ${verified.length} verified | ${unverified.length} pending verification`)
  console.log('---------------------------------------------------------------')

  if (unverified.length > 0) {
    console.log('\nCHECKLIST: Sheets Still Requiring Human Verification:')
    unverified.forEach((item, idx) => {
      console.log(`  ${idx + 1}. [ ] ${item.id} (${item.file}) — Subjects entered: ${item.subjectsCount ?? 0}`)
    })
    console.log('\nTo verify a sheet:')
    console.log('  1. Open eval/transcripts/ground_truth/<sheet_id>.json')
    console.log('  2. Fill in university, profile, image_quality, and subjects[{code, name, credits, attendance, grade_or_grade_point}]')
    console.log('  3. Run: node scripts/verify_ground_truth.js')
  } else if (imageFiles.length === 0) {
    console.log('\nNo mark sheet images found in eval/transcripts/images/.')
    console.log('Please place mark sheet image files (PNG/JPG/PDF) in eval/transcripts/images/.')
  } else {
    console.log('\nAll existing ground-truth sheets have been verified! Ready for pipeline evaluation.')
  }
}

if (require.main === module) {
  makeGroundTruthDrafts()
}

module.exports = { makeGroundTruthDrafts }
