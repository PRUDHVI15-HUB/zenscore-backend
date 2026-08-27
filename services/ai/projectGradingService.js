const { executeCode } = require('../codeExecutionService');
const { generateResponse } = require('./aiProvider');

/**
 * Heuristic fallback evaluation when LLM is offline or unconfigured.
 */
function evaluateHeuristicQuality(code, language, projectSpec) {
  const cleanCode = (code || '').trim();
  let qualityScore = 75;
  let requirementsScore = 80;
  let architectureScore = 75;
  const strengths = [];
  const weaknesses = [];
  const suggestions = [];

  if (cleanCode.length > 50) {
    strengths.push('Complete function/script structure implemented');
  } else {
    weaknesses.push('Submission is very concise; verify all requirements are covered');
    qualityScore -= 20;
  }

  if (cleanCode.includes('try') || cleanCode.includes('catch') || cleanCode.includes('if (!') || cleanCode.includes('if not') || cleanCode.includes('set -e')) {
    strengths.push('Defensive validation and error handling present');
    qualityScore += 10;
  } else {
    weaknesses.push('Limited defensive input validation');
    qualityScore -= 10;
    suggestions.push('Add robust parameter and boundary checking');
  }

  if (cleanCode.includes('return') || cleanCode.includes('SELECT') || cleanCode.includes('FROM') || cleanCode.includes('spec:')) {
    strengths.push('Adheres to language-specific standard output interfaces');
  }

  suggestions.push('Ensure comprehensive test coverage across extreme boundary cases');

  return {
    qualityScore: Math.min(100, Math.max(0, qualityScore)),
    requirementsScore: Math.min(100, Math.max(0, requirementsScore)),
    architectureScore: Math.min(100, Math.max(0, architectureScore)),
    strengths,
    weaknesses,
    missingRequirements: [],
    suggestions,
    summary: 'Automated static analysis completed. Verify test execution results.'
  };
}

/**
 * Grade project submission using deterministic execution + LLM quality analysis.
 */
async function gradeProjectSubmission(code, language, projectSpec) {
  if (!code || !code.trim()) {
    return {
      passed: false,
      finalScore: 0,
      testScore: 0,
      qualityScore: 0,
      requirementsScore: 0,
      architectureScore: 0,
      testResults: [],
      aiFeedback: {
        strengths: [],
        weaknesses: ['Submission is completely empty.'],
        missingRequirements: projectSpec.requirements || [],
        suggestions: ['Implement the starter code solution and run test cases before submitting.'],
        summary: 'Empty code submission rejected.'
      }
    };
  }

  // Tier 1: Deterministic Test Case Validation
  const testCases = projectSpec.testCases || [];
  const execResult = await executeCode(code, language, testCases);

  const testsPassed = execResult.testsPassed || 0;
  const testsTotal = execResult.testsTotal || 0;
  const testScore = testsTotal > 0 ? Math.round((testsPassed / testsTotal) * 100) : (execResult.passed ? 100 : 0);

  const testResults = (execResult.testResults || []).map((t, idx) => ({
    testIndex: idx + 1,
    description: t.description || `Test Case ${idx + 1}`,
    passed: !!t.passed,
    expected: String(t.expected || ''),
    actual: String(t.actual || '')
  }));

  // Tier 2: AI Code Quality & Architecture Review
  let aiAnalysis = null;

  try {
    const prompt = `You are a Senior Principal Software Architect evaluating a student's capstone project.

Project Title: ${projectSpec.title || 'Course Project'}
Objective: ${projectSpec.objective || ''}
Requirements:
${(projectSpec.requirements || []).map((r, i) => `${i + 1}. ${r}`).join('\n')}
Evaluation Criteria:
${(projectSpec.evaluationCriteria || []).map(c => `- ${c}`).join('\n')}
Deterministic Test Outcome: ${testsPassed}/${testsTotal} passed (${testScore}%)

Student Submission (${language}):
\`\`\`${language}
${code.substring(0, 4000)}
\`\`\`

Evaluate the code quality, requirement coverage, and architecture.
Return ONLY valid JSON matching this schema:
{
  "qualityScore": 85,
  "requirementsScore": 90,
  "architectureScore": 85,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "missingRequirements": ["string"],
  "suggestions": ["string"],
  "summary": "string"
}`;

    const rawResponse = await generateResponse(prompt);
    let cleanJson = (rawResponse || '').trim().replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();
    aiAnalysis = JSON.parse(cleanJson);
  } catch (err) {
    // Fallback to static heuristic
    aiAnalysis = evaluateHeuristicQuality(code, language, projectSpec);
  }

  const qualityScore = Math.min(100, Math.max(0, Number(aiAnalysis?.qualityScore) || 75));
  const requirementsScore = Math.min(100, Math.max(0, Number(aiAnalysis?.requirementsScore) || (testScore >= 70 ? 85 : 50)));
  const architectureScore = Math.min(100, Math.max(0, Number(aiAnalysis?.architectureScore) || 75));

  // Transparent Weighted Score: Tests (50%), Requirements (20%), Quality (15%), Architecture (15%)
  const finalScore = Math.round(
    (testScore * 0.50) +
    (requirementsScore * 0.20) +
    (qualityScore * 0.15) +
    (architectureScore * 0.15)
  );

  const minScore = projectSpec.minimumScore || 70;
  // Student passes if finalScore >= minScore AND testScore >= 60 (cannot pass if tests fail completely)
  const passed = finalScore >= minScore && testScore >= 60;

  return {
    passed,
    finalScore,
    testScore,
    qualityScore,
    requirementsScore,
    architectureScore,
    testResults,
    aiFeedback: {
      strengths: Array.isArray(aiAnalysis?.strengths) ? aiAnalysis.strengths : ['Code submitted and evaluated'],
      weaknesses: Array.isArray(aiAnalysis?.weaknesses) ? aiAnalysis.weaknesses : [],
      missingRequirements: Array.isArray(aiAnalysis?.missingRequirements) ? aiAnalysis.missingRequirements : [],
      suggestions: Array.isArray(aiAnalysis?.suggestions) ? aiAnalysis.suggestions : ['Continue refining project components.'],
      summary: aiAnalysis?.summary || (passed ? 'Project successfully passed all evaluation criteria.' : 'Project requires further refinement.')
    }
  };
}

module.exports = { gradeProjectSubmission };
