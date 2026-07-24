const fs = require('fs');
const path = require('path');
const { parseRules } = require('../services/parser/ruleParser');
const { mapGrades } = require('../services/parser/gradeMappingService');

const rawText = fs.readFileSync('c:/Users/USER/Desktop/zenscore-backend/zenscore-backend/scratch/raw_extracted_text.txt', 'utf8');

console.log('--- RAW OCR LINES ---');
rawText.split('\n').forEach((line, idx) => console.log(`${idx + 1}: ${line}`));
console.log('---------------------\n');

let parsed = parseRules(rawText);
let mapped = mapGrades(parsed);

console.log('--- PARSER OUTPUT ---');
console.log('Detected Semester:', mapped.semesterNumber);
console.log('Detected Layout:', mapped.metadata.layoutDetected);
console.log('Layout Confidence:', mapped.metadata.layoutConfidence);
console.log('Subjects Count:', mapped.subjects.length);
console.log('Subjects:');
mapped.subjects.forEach(sub => {
  console.log(`- ID: ${sub.id}`);
  console.log(`  Name: "${sub.name}"`);
  console.log(`  RawCredits: "${sub.rawCredits}" => Credits: ${sub.credits}`);
  console.log(`  RawGrade: "${sub.rawGrade}" => FinalGrade: ${sub.finalGrade} (Source: ${sub.gradeSource})`);
  console.log(`  Original Line: "${sub.originalLine}"`);
});
console.log('Warnings:', mapped.warnings);
console.log('Parsing Issues:', mapped.metadata.parsingIssues);
