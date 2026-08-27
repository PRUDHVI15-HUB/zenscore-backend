const User = require('../../models/User')
const CourseProgress = require('../../models/CourseProgress')
const UserRoadmap = require('../../models/UserRoadmap')
const FocusLog = require('../../models/FocusLog')
const AcademicRecord = require('../../models/AcademicRecord')
const { generateResponse } = require('./aiProvider')

// In-memory cache for recommendations with 5-minute TTL
const aiCache = new Map()
const CACHE_TTL_MS = 5 * 60 * 1000

/**
 * Hybrid Intelligence Recommendation Engine:
 * 1. Computes deterministic mathematical readiness, timeline estimates, and skill gaps via MongoDB aggregations.
 * 2. Uses Groq LLM (llama-3.3-70b) strictly as an Explanation, Coaching, and Natural Language Guidance layer.
 * 3. Never fabricates fake CGPA, fake completed courses, or fake focus study hours.
 *
 * @param {string} userId - Mongoose User ObjectId
 * @returns {Promise<Object>} Hybrid recommendation payload
 */
const getPersonalizedRecommendations = async (userId) => {
  const cacheKey = userId.toString()
  const cached = aiCache.get(cacheKey)

  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    console.log(`[SkillsAIService] [${new Date().toISOString()}] Cache Hit for user: ${userId}`)
    return cached.data
  }

  const startTime = Date.now()
  console.log(`[SkillsAIService] [${new Date().toISOString()}] Initiating Hybrid Intelligence calculation for user: ${userId}`)

  // 1. Gather real MongoDB student documents
  const [user, progressList, roadmap, focusLogs, academicRecord] = await Promise.all([
    User.findById(userId).catch(() => null),
    CourseProgress.find({ user: userId }).populate('course').catch(() => []),
    UserRoadmap.findOne({ user: userId }).catch(() => null),
    FocusLog.find({ user: userId }).sort({ date: -1 }).limit(14).catch(() => []),
    AcademicRecord.findOne({ user: userId }).catch(() => null)
  ])

  const targetRole = user?.targetRole || 'Full Stack Engineer'
  const userSkills = Array.isArray(user?.skills) ? user.skills : []
  const cgpa = academicRecord?.cgpa || user?.cgpa || null

  // --- 2. DETERMINISTIC CALCULATIONS (Zero Synthetic Data Invention) ---

  // A. Completed Nodes vs Total Nodes in Roadmap
  const completedNodeCount = Array.isArray(roadmap?.completedNodes) ? roadmap.completedNodes.length : 0
  const totalNodeCount = Array.isArray(roadmap?.nodes) ? roadmap.nodes.length : 0
  const nodeCompletionRatio = totalNodeCount > 0 ? Math.min(completedNodeCount / totalNodeCount, 1) : 0

  // B. Module Completion Ratio across Enrolled Courses
  const completedModulesCount = progressList.reduce((sum, p) => sum + (p.completedModules?.length || 0), 0)
  const totalModulesCount = progressList.reduce((sum, p) => sum + (p.course?.modules?.length || 0), 0)
  const moduleCompletionRatio = totalModulesCount > 0 ? Math.min(completedModulesCount / totalModulesCount, 1) : 0

  // C. Skill Count & CGPA Normalization
  const cgpaRatio = cgpa ? Math.min(cgpa / 10, 1) : 0
  const skillCountRatio = Math.min(userSkills.length / 8, 1)

  // D. Weighted Skill Readiness Formula (35% Roadmap + 35% Modules + 20% Skills + 10% CGPA)
  let roleReadiness = 0
  if (totalNodeCount > 0 || totalModulesCount > 0 || userSkills.length > 0 || cgpa) {
    roleReadiness = Math.min(
      Math.round((nodeCompletionRatio * 0.35 + moduleCompletionRatio * 0.35 + skillCountRatio * 0.20 + cgpaRatio * 0.10) * 100),
      98
    )
  }

  // E. Focus Hours & Timeline Estimate Calculation
  const focusMinutes = focusLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0)
  const focusHours = parseFloat((focusMinutes / 60).toFixed(1))
  const weeklyPaceHours = focusHours > 0 ? focusHours : 0
  const remainingModules = totalModulesCount > completedModulesCount ? (totalModulesCount - completedModulesCount) : 0
  
  let estimatedTimeline = 'Set your study goal to calculate estimated roadmap completion'
  if (weeklyPaceHours > 0 && remainingModules > 0) {
    const estimatedWeeks = Math.max(Math.ceil((remainingModules * 2) / weeklyPaceHours), 1)
    estimatedTimeline = `${estimatedWeeks} week${estimatedWeeks === 1 ? '' : 's'} remaining based on study pace of ${weeklyPaceHours} hrs/wk`
  }

  // F. Deterministic Skill Gap Analysis
  const roleRequiredSkills = {
    'Full Stack Engineer': ['React.js', 'Node.js', 'Express', 'MongoDB', 'System Design', 'TypeScript', 'REST APIs', 'DevOps'],
    'Data Scientist': ['Python', 'Pandas', 'NumPy', 'Machine Learning', 'SQL', 'Statistics', 'Deep Learning', 'PyTorch'],
    'AI Engineer': ['Python', 'PyTorch', 'Transformers', 'NLP', 'Computer Vision', 'Linear Algebra', 'LLMs', 'MLOps'],
    'Backend Engineer': ['Node.js', 'Express', 'MongoDB', 'System Design', 'Redis', 'Docker', 'REST APIs', 'SQL'],
    'Frontend Engineer': ['JavaScript', 'TypeScript', 'React.js', 'Next.js', 'CSS Architecture', 'Tailwind', 'REST APIs']
  }
  const requiredList = roleRequiredSkills[targetRole] || roleRequiredSkills['Full Stack Engineer']
  const userSkillLower = userSkills.map(s => (s || '').toString().toLowerCase())
  const strongestSkills = userSkills.slice(0, 3)
  const skillsToImprove = requiredList.filter(reqSkill => !userSkillLower.includes(reqSkill.toLowerCase())).slice(0, 3)

  // G. Recommendation Confidence Score
  const confidenceScore = Math.min(80 + Math.round(moduleCompletionRatio * 12) + Math.round(nodeCompletionRatio * 6), 99)
  const recommendationSource = 'Deterministic Backend Calculation + Groq Explanation'

  console.log(`[SkillsAIService] [${new Date().toISOString()}] Deterministic Math Complete: userId=${userId}, readiness=${roleReadiness}%, confidence=${confidenceScore}%`)

  // --- 3. GROQ AI EXPLANATION & COACHING LAYER ---

  let aiCoachingInsights = [
    strongestSkills.length > 0 ? `Your declared skills include ${strongestSkills.join(', ')}.` : 'Get started by exploring foundational skills for your track.',
    focusHours > 0 ? `You have logged ${focusHours} hours of focus study.` : 'Log focus study sessions in Productivity to track your pace.',
    `Your calculated role readiness for ${targetRole} is currently ${roleReadiness}%.`
  ]
  let todayObjective = skillsToImprove.length > 0 ? `Start lesson on ${skillsToImprove[0]}` : 'Select a skill to explore today'
  let weeklyGoal = 'Complete 2 lessons and log focus study time'

  try {
    const prompt = `
You are ZenScore AI's Senior Learning Coach.
Provide clear, inspiring study guidance based strictly on these calculated deterministic metrics.
CRITICAL: Do NOT invent, fabricate, or assume fake student metrics or fake completed courses. If metrics are 0 or empty, give constructive starter guidance.

- Target Role: ${targetRole}
- Calculated Role Readiness: ${roleReadiness}%
- Estimated Roadmap Completion: ${estimatedTimeline}
- Current Skills: ${strongestSkills.length > 0 ? strongestSkills.join(', ') : 'None declared yet'}
- Missing Skills to Improve: ${skillsToImprove.join(', ')}
- Logged Focus Study Hours: ${focusHours} hrs

Return ONLY a valid JSON object matching this structure:
{
  "todayObjective": "One specific, actionable goal for today",
  "weeklyGoal": "One inspiring weekly goal",
  "insights": [
    "Coaching insight 1 explaining readiness score or starter steps",
    "Coaching insight 2 explaining study pace",
    "Coaching insight 3 giving next recommended steps"
  ]
}
Do NOT include markdown formatting or extra text outside JSON.
`

    const rawResponse = await generateResponse(prompt)
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.todayObjective) todayObjective = parsed.todayObjective
      if (parsed.weeklyGoal) weeklyGoal = parsed.weeklyGoal
      if (Array.isArray(parsed.insights) && parsed.insights.length > 0) {
        aiCoachingInsights = parsed.insights
      }
      console.log(`[SkillsAIService] [${new Date().toISOString()}] Groq AI Coaching Explanation generated successfully.`)
    }
  } catch (err) {
    console.warn(`[SkillsAIService] [${new Date().toISOString()}] Groq AI explanation notice:`, err.message)
  }

  // --- 4. ASSEMBLE HYBRID RESULT ---
  const hybridResult = {
    roleReadiness,
    confidenceScore,
    recommendationSource,
    recommendedNextCourse: progressList[0]?.course?.title || `${skillsToImprove[0] || 'Web Engineering'} Fundamentals`,
    recommendedNextLesson: `${skillsToImprove[0] || 'Core Architecture'} Lesson 1`,
    strongestSkills,
    skillsToImprove,
    todayObjective,
    weeklyGoal,
    estimatedTimeline,
    progressInsights: aiCoachingInsights,
    calculatedAt: new Date().toISOString(),
    executionTimeMs: Date.now() - startTime
  }

  aiCache.set(cacheKey, { timestamp: Date.now(), data: hybridResult })
  return hybridResult
}

module.exports = {
  getPersonalizedRecommendations
}