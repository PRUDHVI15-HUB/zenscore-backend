/**
 * intentClassifier.js — ZenScore AI Intent & Domain Router
 * High-performance heuristic and semantic classifier for student queries.
 * Determines the relevant student data slices required without wasteful LLM round-trips.
 */

const INTENTS = {
  DAILY_STUDY_PLAN: 'DAILY_STUDY_PLAN',
  ACADEMIC_SUPPORT: 'ACADEMIC_SUPPORT',
  SKILL_LEARNING: 'SKILL_LEARNING',
  CAREER_GUIDANCE: 'CAREER_GUIDANCE',
  PLACEMENT_ANALYSIS: 'PLACEMENT_ANALYSIS',
  PRODUCTIVITY_COACHING: 'PRODUCTIVITY_COACHING',
  JOB_GUIDANCE: 'JOB_GUIDANCE',
  CODE_OR_TECHNICAL_CONCEPT: 'CODE_OR_TECHNICAL_CONCEPT',
  GREETING_OR_CASUAL: 'GREETING_OR_CASUAL',
  GENERAL_PERSONAL_ASSISTANT: 'GENERAL_PERSONAL_ASSISTANT'
}

/**
 * Classifies the student's input into one of the canonical domain intents.
 * @param {string} message - The student's text query
 * @returns {string} One of INTENTS
 */
function classifyIntent(message) {
  if (!message || typeof message !== 'string') return INTENTS.GENERAL_PERSONAL_ASSISTANT

  const q = message.toLowerCase().trim()

  // 1. Greetings & Casual Chat
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'how are you', 'sup', 'yo']
  if (greetings.includes(q) || /^(hi|hello|hey|yo)\b/i.test(q) && q.length < 20) {
    return INTENTS.GREETING_OR_CASUAL
  }

  // 2. Daily Study Plan / "What should I do today"
  if (
    q.includes('what should i study') ||
    q.includes('what to study') ||
    q.includes('what should i do today') ||
    q.includes('what should i focus on') ||
    q.includes('plan for today') ||
    q.includes('plan for tonight') ||
    q.includes('study plan today') ||
    q.includes('where to start today') ||
    q.includes('my priorities today') ||
    q.includes('what next today')
  ) {
    return INTENTS.DAILY_STUDY_PLAN
  }

  // 3. Placement Readiness & Score Analysis
  if (
    q.includes('placement readiness') ||
    q.includes('readiness score') ||
    q.includes('why is my readiness') ||
    q.includes('improve placement') ||
    q.includes('placement score') ||
    q.includes('ats score') ||
    q.includes('resume score') ||
    q.includes('mock interview score') ||
    q.includes('interview readiness') ||
    q.includes('why is my score low')
  ) {
    return INTENTS.PLACEMENT_ANALYSIS
  }

  // 4. Academic Support
  if (
    q.includes('cgpa') ||
    q.includes('sgpa') ||
    q.includes('gpa') ||
    q.includes('backlog') ||
    q.includes('academic') ||
    q.includes('semester') ||
    q.includes('attendance') ||
    q.includes('exam') ||
    q.includes('marks') ||
    q.includes('internal') ||
    q.includes('subject grade') ||
    q.includes('weak subject')
  ) {
    return INTENTS.ACADEMIC_SUPPORT
  }

  // 5. Career Guidance & Target Roles
  if (
    q.includes('career') ||
    q.includes('target role') ||
    q.includes('target career') ||
    q.includes('roadmap') ||
    q.includes('how to become') ||
    q.includes('career path') ||
    q.includes('dream company') ||
    q.includes('dream companies') ||
    q.includes('salary package') ||
    q.includes('lpa') ||
    q.includes('industry demand')
  ) {
    return INTENTS.CAREER_GUIDANCE
  }

  // 6. Job Applications & Openings
  if (
    q.includes('job') ||
    q.includes('internship') ||
    q.includes('opening') ||
    q.includes('application') ||
    q.includes('applied jobs') ||
    q.includes('hiring') ||
    q.includes('referral')
  ) {
    return INTENTS.JOB_GUIDANCE
  }

  // 7. Productivity & Focus
  if (
    q.includes('focus') ||
    q.includes('streak') ||
    q.includes('study hours') ||
    q.includes('pomodoro') ||
    q.includes('distraction') ||
    q.includes('productivity') ||
    q.includes('time spent') ||
    q.includes('study pattern')
  ) {
    return INTENTS.PRODUCTIVITY_COACHING
  }

  // 8. Skill Learning / Specific Course Lessons
  if (
    q.includes('lesson') ||
    q.includes('course') ||
    q.includes('skill') ||
    q.includes('quiz') ||
    q.includes('assessment') ||
    q.includes('exercise') ||
    q.includes('module') ||
    q.includes('progress') ||
    q.includes('continue learning') ||
    q.includes('next lesson')
  ) {
    return INTENTS.SKILL_LEARNING
  }

  // 9. Technical Code / Concepts (e.g. "Explain binary search", "How does Docker work")
  const techKeywords = ['explain', 'code', 'function', 'algorithm', 'bug', 'error', 'docker', 'react', 'python', 'java', 'sql', 'dbms', 'os', 'network', 'dsa', 'api', 'git', 'kubernetes', 'typescript', 'pointer', 'recursion']
  if (techKeywords.some(kw => q.includes(kw))) {
    return INTENTS.CODE_OR_TECHNICAL_CONCEPT
  }

  return INTENTS.GENERAL_PERSONAL_ASSISTANT
}

module.exports = {
  INTENTS,
  classifyIntent
}
