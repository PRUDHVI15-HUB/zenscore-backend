require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');

// Pipeline stages
const { cleanText } = require('../services/parser/utils/cleanText');
const { generateFingerprint } = require('../services/parser/fingerprint');
const { analyzeDocumentQuality } = require('../services/parser/documentQualityAnalyzer');
const { isolateTable } = require('../services/parser/tableIsolator');
const { detectProfile } = require('../services/parser/profileDetector');
const { parseRules } = require('../services/parser/ruleParser');
const gradeMappingService = require('../services/parser/gradeMappingService');
const { scoreSubject, computeOverallConfidence, addResultFlags } = require('../services/parser/subjectConfidence');
const { calculateCredits } = require('../services/parser/creditCalculator');
const validationLayer = require('../services/parser/validationLayer');
const { decidePipelineRoute } = require('../services/parser/decisionEngine');

const GT_DIR = path.resolve(__dirname, '../eval/transcripts/ground_truth');
const IMAGES_DIR = path.resolve(__dirname, '../eval/transcripts/images');

function levenshteinDistance(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function normalizeName(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function normalizeCode(str) {
  if (!str) return '';
  return str.toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
}

async function runRuleParserOnly(rawText, buffer) {
  const hash = generateFingerprint(buffer);
  const mimeType = 'application/octet-stream';
  const cleanedText = cleanText(rawText);
  const quality = analyzeDocumentQuality(cleanedText, mimeType, null);
  const isolation = isolateTable(cleanedText);
  const { profile, profileId } = detectProfile(cleanedText, isolation.tableLines);
  let parsed = parseRules(isolation.tableLines, cleanedText, profile);
  parsed = gradeMappingService.mapGrades(parsed);

  const confidenceContexts = parsed.metadata?.confidenceContexts || [];
  parsed.subjects = (parsed.subjects || []).map((sub, idx) => {
    sub.confidence = scoreSubject(sub, confidenceContexts[idx] || {});
    return sub;
  });
  parsed.subjects = addResultFlags(parsed.subjects);
  parsed.confidence = computeOverallConfidence(parsed.subjects);
  parsed.summary = calculateCredits(parsed.subjects, cleanedText);
  const validated = validationLayer.validateContract(parsed);
  const routed = decidePipelineRoute(validated);

  return {
    rawText,
    cleanedText,
    profileId,
    output: routed,
    isolation
  };
}

function evaluateSheet(predictedSubjects, groundTruthSubjects, sheetId) {
  const predMatched = new Set();
  const gtMatched = new Set();
  const matchedPairs = [];
  const fieldErrors = [];

  // Match by code
  groundTruthSubjects.forEach((gtSub, gtIdx) => {
    const gtCodeNorm = normalizeCode(gtSub.code);
    if (!gtCodeNorm) return;

    for (let pIdx = 0; pIdx < predictedSubjects.length; pIdx++) {
      if (predMatched.has(pIdx)) continue;
      const predCodeNorm = normalizeCode(predictedSubjects[pIdx].code);
      if (predCodeNorm && predCodeNorm === gtCodeNorm) {
        predMatched.add(pIdx);
        gtMatched.add(gtIdx);
        matchedPairs.push({ gtSub, predSub: predictedSubjects[pIdx], matchType: 'code' });
        break;
      }
    }
  });

  // Match remaining by name
  groundTruthSubjects.forEach((gtSub, gtIdx) => {
    if (gtMatched.has(gtIdx)) return;
    const gtNameNorm = normalizeName(gtSub.name);
    if (!gtNameNorm) return;

    let bestPIdx = -1;
    let bestDist = 999;

    predictedSubjects.forEach((pSub, pIdx) => {
      if (predMatched.has(pIdx)) return;
      const pNameNorm = normalizeName(pSub.name);
      if (!pNameNorm) return;
      const dist = levenshteinDistance(gtNameNorm, pNameNorm);
      if (dist <= 2 && dist < bestDist) {
        bestDist = dist;
        bestPIdx = pIdx;
      }
    });

    if (bestPIdx !== -1) {
      predMatched.add(bestPIdx);
      gtMatched.add(gtIdx);
      matchedPairs.push({ gtSub, predSub: predictedSubjects[bestPIdx], matchType: 'name' });
    }
  });

  // Check unmatched
  groundTruthSubjects.forEach((gtSub, gtIdx) => {
    if (!gtMatched.has(gtIdx)) {
      fieldErrors.push({
        sheet_id: sheetId,
        field: 'subject_detection',
        predicted: 'MISSED_BY_PARSER',
        expected: `${gtSub.code || ''} ${gtSub.name || ''}`.trim()
      });
    }
  });

  predictedSubjects.forEach((pSub, pIdx) => {
    if (!predMatched.has(pIdx)) {
      fieldErrors.push({
        sheet_id: sheetId,
        field: 'subject_detection',
        predicted: `${pSub.code || ''} ${pSub.name || ''}`.trim(),
        expected: 'SPURIOUS_ROW'
      });
    }
  });

  let creditsCorrect = 0;
  let gradeCorrect = 0;
  let allFieldsCorrect = 0;

  matchedPairs.forEach(({ gtSub, predSub }) => {
    let subAllCorrect = true;

    // Name check
    const nameDist = levenshteinDistance(normalizeName(gtSub.name), normalizeName(predSub.name));
    if (nameDist > 2) {
      subAllCorrect = false;
      fieldErrors.push({
        sheet_id: sheetId,
        field: 'name',
        predicted: predSub.name,
        expected: gtSub.name
      });
    }

    // Credits check
    const gtCredits = Number(gtSub.credits);
    const predCredits = Number(predSub.credits);
    if (!isNaN(gtCredits) && !isNaN(predCredits) && gtCredits === predCredits) {
      creditsCorrect++;
    } else {
      subAllCorrect = false;
      fieldErrors.push({
        sheet_id: sheetId,
        field: 'credits',
        predicted: predSub.credits,
        expected: gtSub.credits
      });
    }

    // Grade check
    const gtGradeRaw = String(gtSub.grade_or_grade_point ?? '').trim().toUpperCase();
    const predGradeRaw = String(predSub.rawGrade ?? '').trim().toUpperCase();
    const gtGradePt = Number(gtSub.grade_or_grade_point);
    const predFinalGrade = Number(predSub.finalGrade);

    const gradeMatches =
      (gtGradeRaw && predGradeRaw && gtGradeRaw === predGradeRaw) ||
      (!isNaN(gtGradePt) && !isNaN(predFinalGrade) && gtGradePt === predFinalGrade);

    if (gradeMatches) {
      gradeCorrect++;
    } else {
      subAllCorrect = false;
      fieldErrors.push({
        sheet_id: sheetId,
        field: 'grade',
        predicted: `${predSub.rawGrade} (pts: ${predSub.finalGrade})`,
        expected: gtSub.grade_or_grade_point
      });
    }

    if (subAllCorrect) {
      allFieldsCorrect++;
    }
  });

  return {
    matchedCount: matchedPairs.length,
    gtTotal: groundTruthSubjects.length,
    predTotal: predictedSubjects.length,
    creditsCorrect,
    gradeCorrect,
    allFieldsCorrect,
    fieldErrors,
    matchedPairs
  };
}

async function main() {
  const targetSheets = [
    'cmr_237R1A05AD_sem1',
    'cmr_237R1A05AD_sem2',
    'cmr_237R1A05BR_sem1',
    'matrusri_160823737070_sem3'
  ];

  console.log('========================================================================================');
  console.log('  ABLATION EXPERIMENT: RUNNING RULE PARSER ON GROUND-TRUTH (PERFECT) TEXT (n = 4)');
  console.log('========================================================================================\n');

  let totalGTSubjects = 0;
  let totalMatched = 0;
  let totalCreditsCorrect = 0;
  let totalGradeCorrect = 0;
  let totalAllCorrect = 0;
  const allErrors = [];

  for (const sheetId of targetSheets) {
    const gtPath = path.join(GT_DIR, `${sheetId}.json`);
    const gt = JSON.parse(fs.readFileSync(gtPath, 'utf-8'));
    const imgPath = path.join(IMAGES_DIR, `${sheetId}.jpg`);
    const buffer = fs.readFileSync(imgPath);

    const refText = gt.raw_text;
    const runResult = await runRuleParserOnly(refText, buffer);
    const predSubjects = runResult.output.subjects || [];

    const evalRes = evaluateSheet(predSubjects, gt.subjects, sheetId);

    totalGTSubjects += evalRes.gtTotal;
    totalMatched += evalRes.matchedCount;
    totalCreditsCorrect += evalRes.creditsCorrect;
    totalGradeCorrect += evalRes.gradeCorrect;
    totalAllCorrect += evalRes.allFieldsCorrect;

    console.log(`Sheet: ${sheetId} (${gt.university} - ${gt.profile})`);
    console.log(`  - Detected Profile : ${runResult.profileId}`);
    console.log(`  - Subjects Found   : ${predSubjects.length} / ${evalRes.gtTotal} (Matched: ${evalRes.matchedCount})`);
    console.log(`  - Credits Accuracy : ${evalRes.creditsCorrect} / ${evalRes.gtTotal} (${((evalRes.creditsCorrect / evalRes.gtTotal) * 100).toFixed(1)}%)`);
    console.log(`  - Grade Accuracy   : ${evalRes.gradeCorrect} / ${evalRes.gtTotal} (${((evalRes.gradeCorrect / evalRes.gtTotal) * 100).toFixed(1)}%)`);
    console.log(`  - Exact Match (All): ${evalRes.allFieldsCorrect} / ${evalRes.gtTotal} (${((evalRes.allFieldsCorrect / evalRes.gtTotal) * 100).toFixed(1)}%)`);

    if (evalRes.fieldErrors.length > 0) {
      console.log(`  - Parser Errors on Perfect Text (${evalRes.fieldErrors.length}):`);
      evalRes.fieldErrors.forEach(err => {
        console.log(`      * [${err.field}] Expected: "${err.expected}" | Got: "${err.predicted}"`);
        allErrors.push(err);
      });
    } else {
      console.log('  - Parser Errors: NONE (100% perfect extraction)');
    }
    console.log('');
  }

  console.log('----------------------------------------------------------------------------------------');
  console.log('AGGREGATE SUMMARY ACROSS ALL 4 SHEETS (n = 37 subjects total)');
  console.log('----------------------------------------------------------------------------------------');
  console.log(`Subject Recall (Matched) : ${totalMatched} / ${totalGTSubjects} (${((totalMatched / totalGTSubjects) * 100).toFixed(2)}%)`);
  console.log(`Credits Accuracy         : ${totalCreditsCorrect} / ${totalGTSubjects} (${((totalCreditsCorrect / totalGTSubjects) * 100).toFixed(2)}%)`);
  console.log(`Grade Accuracy           : ${totalGradeCorrect} / ${totalGTSubjects} (${((totalGradeCorrect / totalGTSubjects) * 100).toFixed(2)}%)`);
  console.log(`All-Field Exact Match    : ${totalAllCorrect} / ${totalGTSubjects} (${((totalAllCorrect / totalGTSubjects) * 100).toFixed(2)}%)`);
  console.log('----------------------------------------------------------------------------------------');
}

main().catch(console.error);
