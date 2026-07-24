const fs = require('fs');

const rawText = fs.readFileSync('c:/Users/USER/Desktop/zenscore-backend/zenscore-backend/scratch/raw_extracted_text.txt', 'utf8');

// Helper to check if a word is a course code
const isCourseCode = (word) => {
  const clean = word.replace(/^[|\[\]\s]+|[|\[\]\s]+$/g, '');
  if (clean.length < 5 || clean.length > 12) return false;
  if (!/\d/.test(clean)) return false;
  if (!/[a-zA-Z]/.test(clean)) return false;
  if (/[^a-zA-Z0-9\-_]/.test(clean)) return false;
  
  const lower = clean.toLowerCase();
  if (lower.includes('sem') || lower.includes('year') || lower.includes('exam') || lower.includes('grade') || lower.includes('gpa') || lower.includes('roll') || lower.includes('date')) return false;
  return true;
};

const isGradeOrCreditToken = (token, idx, total) => {
  if (idx < total - 4) return false;
  if (/\d/.test(token)) return true;
  const upper = token.toUpperCase();
  if (['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F', 'S'].includes(upper)) return true;
  if (['als', 'wo', 'so', 'soo', 'red', 'red|', '000', '100', '300'].includes(token.toLowerCase())) return true;
  return false;
};

const parseCredits = (creditStr, courseName) => {
  if (!creditStr) return null;
  const clean = creditStr.toLowerCase().replace(/[^a-z0-9.]/g, '');
  
  const numMatch = clean.match(/^(\d+(?:\.\d+)?)$/);
  if (numMatch) {
    const val = parseFloat(numMatch[1]);
    if (val === 300 || val === 30) return 3;
    if (val === 100 || val === 10) return 1;
    if (val === 200 || val === 20) return 2;
    if (val === 0) return 0;
    if (val >= 1 && val <= 6) return Math.round(val);
  }

  if (clean === 'wo' || clean === 'so' || clean === 'soo') return 3;
  if (clean === 'red' || clean === '100' || clean === '10' || clean === '1.00') return 1;
  if (clean === '2' || clean === '200' || clean === '2.00') return 2;
  if (clean === '000' || clean === '0.00' || clean === '0') return 0;

  const lowerName = courseName.toLowerCase();
  if (lowerName.includes('lab') || lowerName.includes('practical') || lowerName.includes('seminar') || lowerName.includes('viva')) {
    return 1;
  }
  if (lowerName.includes('project')) {
    return 2;
  }
  return 3;
};

const parseGradeAndPoints = (tokens) => {
  let rawGrade = '';
  let finalGrade = null;

  let gradePointToken = null;
  for (const token of tokens) {
    const num = parseInt(token);
    if (!isNaN(num) && (num === 0 || (num >= 4 && num <= 10))) {
      gradePointToken = num;
      break;
    }
  }

  let gradeLetterToken = null;
  for (const token of tokens) {
    const upper = token.toUpperCase();
    if (['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F', 'S'].includes(upper)) {
      gradeLetterToken = upper;
      break;
    } else if (upper === 'ALS') {
      gradeLetterToken = 'A';
      break;
    }
  }

  if (gradePointToken !== null) {
    finalGrade = gradePointToken;
    const pointToLetter = { 10: 'O', 9: 'A+', 8: 'A', 7: 'B+', 6: 'B', 5: 'C', 4: 'P', 0: 'F' };
    rawGrade = gradeLetterToken || pointToLetter[gradePointToken] || '';
  } else if (gradeLetterToken !== null) {
    rawGrade = gradeLetterToken;
    const letterToPoint = { 'O': 10, 'S': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'P': 4, 'F': 0 };
    finalGrade = letterToPoint[gradeLetterToken] || null;
  } else {
    rawGrade = tokens[0] || '';
  }

  return { rawGrade, finalGrade };
};

// Main parsing loop
const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
const subjects = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Find a word in the line that matches course code
  const words = line.split(/\s+/);
  let foundCode = null;
  for (const w of words) {
    if (isCourseCode(w)) {
      foundCode = w.replace(/^[|\[\]\s]+|[|\[\]\s]+$/g, '');
      break;
    }
  }
  
  if (foundCode) {
    // We found a subject line!
    const codeIdx = line.indexOf(foundCode);
    if (codeIdx > 15) {
      continue;
    }
    const afterCode = line.substring(codeIdx + foundCode.length);
    
    // Clean and tokenize (preserve dots for decimals)
    const cleanAfter = afterCode.replace(/[|\[\]\/:\-]/g, ' ').replace(/\s+/g, ' ').trim();
    const tokens = cleanAfter.split(' ').filter(t => t.length > 0);
    
    // Find boundary index between name and grade/credits
    let boundaryIdx = tokens.length;
    for (let j = 0; j < tokens.length; j++) {
      if (isGradeOrCreditToken(tokens[j], j, tokens.length)) {
        boundaryIdx = j;
        break;
      }
    }
    
    let nameWords = tokens.slice(0, boundaryIdx);
    const remainingTokens = tokens.slice(boundaryIdx);
    
    let courseName = nameWords.join(' ').trim();
    // Strip trailing dots/commas from name
    courseName = courseName.replace(/[:\-\,\.\/]+$/, '').trim();
    
    // Noise subject check: ignore if the line or courseName is clearly header/metadata
    const isNoiseSubject = (name) => {
      const lower = name.toLowerCase();
      return /branch|campus|autonomous|grade card|serial|roll|hall|ticket|exam|university|college|page|date|gpa|marksheet|transcript|medium|verified|controller/i.test(lower);
    };

    if (isNoiseSubject(courseName) || isNoiseSubject(foundCode)) {
      continue;
    }
    
    // Look up for previous name fragments if name is short or we want to capture wrapped text
    let lookupIdx = i - 1;
    let prependText = '';
    while (lookupIdx >= 0) {
      const prevLine = lines[lookupIdx];
      const prevTrim = prevLine.trim();
      
      if (prevTrim.length <= 3) {
        lookupIdx--;
        continue;
      }
      
      const prevWords = prevTrim.split(/\s+/);
      const hasCode = prevWords.some(w => isCourseCode(w));
      const isNoise = /semester|sem|term|roll|hall|ticket|exam|university|college|page|date|gpa|marksheet|transcript|medium|course|code|cope|subject|name|secured|point|marks|sl\.no|s\.no|sno|serial/i.test(prevTrim);
      
      if (hasCode || isNoise) {
        break;
      }
      
      prependText = prevTrim + ' ' + prependText;
      break;
    }
    
    if (prependText) {
      courseName = (prependText + ' ' + courseName).trim().replace(/[:\-\,\.\/]+$/, '').trim();
    }
    
    // Clean standalone numbers
    courseName = courseName.replace(/\b\d+\b/g, '').replace(/\s+/g, ' ').trim();
    
    const { rawGrade, finalGrade } = parseGradeAndPoints(remainingTokens);
    
    // Extract credit string (usually the last or second to last token)
    let rawCredits = null;
    if (remainingTokens.length > 0) {
      // Find the token that looks like credits
      for (let k = remainingTokens.length - 1; k >= 0; k--) {
        const token = remainingTokens[k];
        if (token.toLowerCase() !== rawGrade.toLowerCase() && (/\d/.test(token) || ['wo', 'so', 'soo', 'red', '100', '300', '000'].includes(token.toLowerCase()))) {
          rawCredits = token;
          break;
        }
      }
      if (!rawCredits && remainingTokens.length > 1) {
        rawCredits = remainingTokens[remainingTokens.length - 1];
      }
    }
    
    const credits = parseCredits(rawCredits, courseName);
    
    subjects.push({
      code: foundCode,
      name: courseName,
      rawGrade,
      finalGrade,
      rawCredits,
      credits,
      originalLine: line
    });
  }
}

console.log('--- NEW PARSER RESULTS ---');
console.log(JSON.stringify(subjects, null, 2));
