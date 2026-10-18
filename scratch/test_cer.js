const fs = require('fs');
const path = require('path');

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
        dp[i - 1][j] + 1,       // deletion
        dp[i][j - 1] + 1,       // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dp[m][n];
}

function calculateWER(refText, hypText) {
  const refWords = (refText || '').trim().split(/\s+/).filter(Boolean);
  const hypWords = (hypText || '').trim().split(/\s+/).filter(Boolean);
  if (refWords.length === 0) return 0.0;
  const dist = levenshteinDistance(refWords, hypWords);
  return dist / refWords.length;
}

function calculateCER(refText, hypText) {
  const ref = (refText || '').replace(/\s+/g, ' ').trim();
  const hyp = (hypText || '').replace(/\s+/g, ' ').trim();
  if (ref.length === 0) return 0.0;
  const dist = levenshteinDistance(ref, hyp);
  return dist / ref.length;
}

const gtTexts = {
  "cmr_237R1A05AD_sem1": `CMR TECHNICAL CAMPUS
UGC AUTONOMOUS
Approved by AICTE & JNTUH; Accredited by NBA & NAAC with 'A' Grade.
Kandlakoya, Medchal Road, Hyderabad - 501 401, T. S.
GRADE CARD
Memo. No. : A 039506
Serial No. : 38702
Examination : B.TECH I SEMESTER , R22 REGULAR
Branch : COMPUTER SCIENCE AND ENGINEERING
Name : CHINTHAPALLI PRUDHVI
Hall Ticket No. : 237R1A05AD
Month & Year of Exam : January 2024
Aadhar No. :
S.No COURSE CODE NAME OF THE COURSE Grade Secured Grade Point Status Credits
1 22MA101BS MATRICES AND CALCULUS B 6 P 4
2 22CH102BS ENGINEERING CHEMISTRY A 8 P 4
3 22CS103ES PROGRAMMING FOR PROBLEM SOLVING B+ 7 P 3
4 22EC104ES BASIC ELECTRICAL AND ELECTRONICS ENGINEERING B 6 P 4
5 22ME105ES COMPUTER AIDED ENGINEERING GRAPHICS A+ 9 P 2
6 22CH106BS ENGINEERING CHEMISTRY LAB A 8 P 1
7 22CS107ES PROGRAMMING FOR PROBLEM SOLVING LAB A+ 9 P 1
8 22EC108ES BASIC ELECTRICAL AND ELECTRONICS ENGINEERING LAB B+ 7 P 1
9 22CH109MC ENVIRONMENTAL SCIENCE B+ 7 P 0
Subject Registered : 9 Appeared : 9 Passed : 9 Total : 20.0
Medium of Instruction and Examinations in English
Semester Grade Point Average (SGPA) : 7.15
Cumulative Grade Point Average (CGPA) : 7.15
Date of Issue : 23-05-2024
Verified by
CONTROLLER OF EXAMINATIONS`,

  "cmr_237R1A05AD_sem2": `CMR TECHNICAL CAMPUS
UGC AUTONOMOUS
Approved by AICTE & JNTUH; Accredited by NBA & NAAC with 'A' Grade.
Kandlakoya, Medchal Road, Hyderabad - 501 401, T. S.
GRADE CARD
Memo. No. : A 048449
Serial No. : 47375
Examination : B.TECH II SEMESTER , R22 REGULAR
Branch : COMPUTER SCIENCE AND ENGINEERING
Name : CHINTHAPALLI PRUDHVI
Hall Ticket No. : 237R1A05AD
Month & Year of Exam : July 2024
Aadhar No. :
S.No COURSE CODE NAME OF THE COURSE Grade Secured Grade Point Status Credits
1 22MA201BS ORDINARY DIFFERENTIAL EQUATIONS AND VECTOR CALCULUS B+ 7 P 4
2 22PH202BS APPLIED PHYSICS A 8 P 4
3 22CS203ES DATA STRUCTURES A 8 P 3
4 22EN204HS ENGLISH FOR SKILL ENHANCEMENT A+ 9 P 3
5 22CS205ES IT WORKSHOP O 10 P 1.5
6 22PH206BS APPLIED PHYSICS LABORATORY O 10 P 1.5
7 22CS207ES DATA STRUCTURES LABORATORY A 8 P 1
8 22EN208HS ENGLISH LANGUAGE AND COMMUNICATION SKILLS LABORATORY O 10 P 1
9 22CS209ES BASIC ELEMENTS OF ENGINEERING AND TECHNOLOGY O 10 P 1
Subject Registered : 9 Appeared : 9 Passed : 9 Total : 20.0
Medium of Instruction and Examinations in English
Semester Grade Point Average (SGPA) : 8.45
Cumulative Grade Point Average (CGPA) : 7.80
Date of Issue : 03-10-2024
Verified by
CONTROLLER OF EXAMINATIONS`,

  "cmr_237R1A05BR_sem1": `CMR TECHNICAL CAMPUS
UGC AUTONOMOUS
Approved by AICTE & JNTUH; Accredited by NBA & NAAC with 'A' Grade.
Kandlakoya, Medchal Road, Hyderabad - 501 401, T. S.
GRADE CARD
Memo. No. : A 039551
Serial No. : 38747
Examination : B.TECH I SEMESTER , R22 REGULAR
Branch : COMPUTER SCIENCE AND ENGINEERING
Name : RUPAM DAS
Hall Ticket No. : 237R1A05BR
Month & Year of Exam : January 2024
Aadhar No. :
S.No COURSE CODE NAME OF THE COURSE Grade Secured Grade Point Status Credits
1 22MA101BS MATRICES AND CALCULUS A 8 P 4
2 22CH102BS ENGINEERING CHEMISTRY B 6 P 4
3 22CS103ES PROGRAMMING FOR PROBLEM SOLVING B 6 P 3
4 22EC104ES BASIC ELECTRICAL AND ELECTRONICS ENGINEERING B 6 P 4
5 22ME105ES COMPUTER AIDED ENGINEERING GRAPHICS A+ 9 P 2
6 22CH106BS ENGINEERING CHEMISTRY LAB B+ 7 P 1
7 22CS107ES PROGRAMMING FOR PROBLEM SOLVING LAB A+ 9 P 1
8 22EC108ES BASIC ELECTRICAL AND ELECTRONICS ENGINEERING LAB A 8 P 1
9 22CH109MC ENVIRONMENTAL SCIENCE C 5 P 0
Subject Registered : 9 Appeared : 9 Passed : 9 Total : 20.0
Medium of Instruction and Examinations in English
Semester Grade Point Average (SGPA) : 7.00
Cumulative Grade Point Average (CGPA) : 7.00
Date of Issue : 23-05-2024
Verified by
CONTROLLER OF EXAMINATIONS`,

  "matrusri_160823737070_sem3": `6:58
matrusri.skolo.in/#/ad
Matrusri Engineering College
Examination > Exam Results
Exam Results
N PRANAV DEEP REDDY (REGULAR)
1608-23-737-070
MECS / 2025-2026 / Bachelor of Engineering / IT / III YEAR VI SEM / Section B
8008611874
Admission Date :
Quota : A-CONVENOR
Student Status : IN COLLEGE
Semwise Final Marks
I YEAR I SEM
I YEAR II SEM
II YEAR III SEM
II YEAR IV SEM
III YEAR V SEM
Sl.No Subject Code Subject Name Month Year Final Grade Credits Status
1 HS301CMU23 Finance and Accounting January-2025 B 3 Pass
2 ES303ECU23 Basic Electronics January-2025 D 3 Pass
3 ES304ECU23 Digital Electronics January-2025 E 3 Pass
4 ES301ITU23 Python Programming December-2025 C 3 Pass
5 ES352ECU23 Basic Electronics Lab January-2025 A 1 Pass
6 ES351ITU23 Python Programming Lab January-2025 A 1 Pass
7 HS301EGU23 Effective Technical Communication In English January-2025 A 2 Pass
8 PC302ITU23 Database Systems January-2025 D 3 Pass
9 PC303ITU23 Discrete Mathematics January-2025 D 3 Pass
10 PC352ITU23 Database Systems Lab January-2025 A 1 Pass
SGPA : 6.91 CGPA : 6.95 RESULT : Promoted
Copyright 2021. All Rights Reserved`
};

const runsDir = path.join(__dirname, '..', 'results', 'ingestion_runs');

let totalCER = 0;
let totalWER = 0;
let count = 0;

console.log('--------------------------------------------------------------------------------------------------------');
console.log(String('Sheet ID').padEnd(30) + ' | ' + String('Ref Chars').padEnd(10) + ' | ' + String('Hyp Chars').padEnd(10) + ' | ' + String('CER (%)').padEnd(12) + ' | ' + String('WER (%)').padEnd(12));
console.log('--------------------------------------------------------------------------------------------------------');

for (const [sheetId, refText] of Object.entries(gtTexts)) {
  const runFile = path.join(runsDir, `${sheetId}_rule_only.json`);
  if (!fs.existsSync(runFile)) {
    console.warn(`File not found: ${runFile}`);
    continue;
  }
  const runData = JSON.parse(fs.readFileSync(runFile, 'utf-8'));
  const hypText = runData.rawText;

  const cer = calculateCER(refText, hypText);
  const wer = calculateWER(refText, hypText);

  totalCER += cer;
  totalWER += wer;
  count++;

  const refNorm = refText.replace(/\s+/g, ' ').trim();
  const hypNorm = hypText.replace(/\s+/g, ' ').trim();

  console.log(
    sheetId.padEnd(30) + ' | ' +
    String(refNorm.length).padEnd(10) + ' | ' +
    String(hypNorm.length).padEnd(10) + ' | ' +
    (cer * 100).toFixed(2).padStart(8) + '%  | ' +
    (wer * 100).toFixed(2).padStart(8) + '% '
  );
}

console.log('--------------------------------------------------------------------------------------------------------');
console.log(
  'AVERAGE (n = ' + count + ')'.padEnd(30) + ' | ' +
  ''.padEnd(10) + ' | ' +
  ''.padEnd(10) + ' | ' +
  ((totalCER / count) * 100).toFixed(2).padStart(8) + '%  | ' +
  ((totalWER / count) * 100).toFixed(2).padStart(8) + '% '
);
console.log('--------------------------------------------------------------------------------------------------------');
