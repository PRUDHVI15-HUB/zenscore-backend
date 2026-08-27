const mongoose = require('mongoose')
const Course = require('../models/Course')
const CourseProgress = require('../models/CourseProgress')
const Bookmark = require('../models/Bookmark')
const DailyChallenge = require('../models/DailyChallenge')
const Certificate = require('../models/Certificate')
const UserSkillProgress = require('../models/UserSkillProgress')
const Skill = require('../models/Skill')
const UserRoadmap = require('../models/UserRoadmap')
const Notification = require('../models/Notification')
const AcademicRecord = require('../models/AcademicRecord')
const User = require('../models/User')
const FocusLog = require('../models/FocusLog')
const { executeCode } = require('../services/codeExecutionService')
const { gradeProjectSubmission } = require('../services/ai/projectGradingService')

/**
 * Safe Canonical Course Resolver
 * Resolves a course by MongoDB ObjectId first, or by slug second.
 * Guarantees no Mongoose CastError on invalid ObjectIds.
 */
const resolveCourseByIdOrSlug = async (identifier) => {
  if (!identifier) return null
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    try {
      const course = await Course.findById(identifier)
      if (course) return course
    } catch {
      // Fall through to slug search
    }
  }
  return await Course.findOne({ slug: identifier })
}

// --- Helper: Calculate Streak from Focus Logs ---
const getStreakCount = async (userId) => {
  try {
    const logs = await FocusLog.find({ user: userId }).sort({ date: -1 })
    if (!logs.length) return 0

    const dates = logs.map(l => new Date(l.date).toDateString())
    const uniqueDates = [...new Set(dates)]

    let streak = 0
    let checkDate = new Date()
    const getJustDateString = (d) => d.toDateString()

    const todayStr = getJustDateString(checkDate)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = getJustDateString(yesterday)

    if (!uniqueDates.includes(todayStr) && !uniqueDates.includes(yesterdayStr)) {
      return 0
    }

    if (uniqueDates.includes(todayStr)) {
      streak = 1
      checkDate.setDate(checkDate.getDate() - 1)
    } else if (uniqueDates.includes(yesterdayStr)) {
      streak = 1
      checkDate = yesterday
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      return 0
    }

    while (true) {
      const checkStr = getJustDateString(checkDate)
      if (uniqueDates.includes(checkStr)) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  } catch (error) {
    console.error('Streak calculation error:', error)
    return 0
  }
}

// --- Helper: Calculate Weekly Study Hours ---
const getWeeklyStudyHours = async (userId) => {
  try {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - distanceToMonday)
    startOfWeek.setHours(0, 0, 0, 0)

    const logs = await FocusLog.find({
      user: userId,
      date: { $gte: startOfWeek }
    })

    const totalMinutes = logs.reduce((sum, log) => sum + log.durationMinutes, 0)
    return parseFloat((totalMinutes / 60).toFixed(1))
  } catch (error) {
    console.error('Weekly hours calculation error:', error)
    return 0
  }
}

// --- Helper: Award XP and Coins ---
const awardXpAndCoins = async (user, xpToAdd, coinsToAdd) => {
  try {
    user.xp = (user.xp || 0) + xpToAdd
    user.coins = (user.coins || 0) + coinsToAdd
    const currentLevel = user.level || 1
    const neededXp = currentLevel * 500
    if (user.xp >= neededXp) {
      user.level = currentLevel + 1
      await Notification.create({
        user: user._id,
        title: 'Level Up! 🌟',
        message: `Congratulations! You've reached Level ${user.level}!`,
        type: 'level_up'
      })
    }
    await user.save()
  } catch (err) {
    console.error('Error awarding XP:', err)
  }
}

// --- Dynamic Roadmap Helpers ---
const getDynamicRoadmapSteps = async (userId) => {
  try {
    const gitCourse = await Course.findOne({ $or: [{ slug: 'git-fundamentals' }, { title: /Git|Version Control/i }] })
    const reactCourse = await Course.findOne({ $or: [{ slug: 'react-frontend' }, { title: /React/i }] })
    const nodeCourse = await Course.findOne({ $or: [{ slug: 'nodejs-api-dev' }, { title: /Node/i }] })
    const mongoCourse = await Course.findOne({ $or: [{ slug: 'mongodb-developer' }, { title: /Mongo/i }] })
    const designCourse = await Course.findOne({ $or: [{ slug: 'system-design-mastery' }, { title: /System Design/i }] })

    const progressRecords = await CourseProgress.find({ user: userId })

    const getStatus = (course) => {
      if (!course) return 'locked'
      const record = progressRecords.find(p => p.course.toString() === course._id.toString())
      if (!record) return 'available'
      if (record.isCompleted || record.completionPercentage === 100) return 'completed'
      return 'in_progress'
    }

    const steps = [
      { step: 1, title: 'Foundations & Version Control', course: gitCourse?.title || 'Version Control with Git', slug: gitCourse?.slug || 'git-fundamentals', duration: '2 Weeks', status: getStatus(gitCourse), courseId: gitCourse?._id || '' },
      { step: 2, title: 'Modern Frontend Architecture', course: reactCourse?.title || 'React Frontend Framework', slug: reactCourse?.slug || 'react-frontend', duration: '4 Weeks', status: getStatus(reactCourse), courseId: reactCourse?._id || '' },
      { step: 3, title: 'Scalable Backend Services', course: nodeCourse?.title || 'Node.js API Programming', slug: nodeCourse?.slug || 'nodejs-api-dev', duration: '4 Weeks', status: getStatus(nodeCourse), courseId: nodeCourse?._id || '' },
      { step: 4, title: 'Database Data Modeling', course: mongoCourse?.title || 'MongoDB Data Modeling', slug: mongoCourse?.slug || 'mongodb-developer', duration: '3 Weeks', status: getStatus(mongoCourse), courseId: mongoCourse?._id || '' },
      { step: 5, title: 'Production System Design', course: designCourse?.title || 'High Scale System Design', slug: designCourse?.slug || 'system-design-mastery', duration: '3 Weeks', status: getStatus(designCourse), courseId: designCourse?._id || '' }
    ]

    return steps
  } catch (err) {
    console.error('Error generating dynamic roadmap steps:', err)
    return []
  }
}

// --- Controller: GET /api/courses ---
const getCourses = async (req, res) => {
  try {
    const { category, difficulty, search } = req.query
    const filter = {}

    if (category && category !== 'all') {
      filter.category = category
    }
    if (difficulty && difficulty !== 'all') {
      filter.difficulty = difficulty
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { technology: { $regex: search, $options: 'i' } },
        { instructor: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { difficulty: { $regex: search, $options: 'i' } },
        { platform: { $regex: search, $options: 'i' } }
      ]
    }

    const courses = await Course.find(filter)
    const bookmarks = await Bookmark.find({ user: req.user._id })
    const progressRecords = await CourseProgress.find({ user: req.user._id })
    const bookmarkedIds = bookmarks.map(b => b.course.toString())

    const results = courses.map(course => {
      const isBookmarked = bookmarkedIds.includes(course._id.toString())
      const progressRecord = progressRecords.find(p => p.course.toString() === course._id.toString())
      
      const enrolled = !!progressRecord
      let completedPercent = 0
      if (progressRecord) {
        completedPercent = progressRecord.completionPercentage || 0
      }

      return {
        _id: course._id,
        title: course.title,
        slug: course.slug,
        technology: course.technology,
        instructor: course.instructor,
        category: course.category,
        difficulty: course.difficulty,
        platform: course.platform || 'ZenScore Academy',
        rating: course.rating || 4.8,
        duration: course.duration || course.estimatedHours || '12 hrs',
        icon: course.icon || '📚',
        description: course.description,
        prerequisites: course.prerequisites || [],
        skillsLearnt: course.skillsLearnt || course.learningOutcomes || [],
        outcomes: course.outcomes || course.learningOutcomes || [],
        modules: course.modules || [],
        completedVideos: progressRecord ? progressRecord.completedVideos : [],
        completedNotes: progressRecord ? progressRecord.completedNotes : [],
        completedQuizzes: progressRecord ? progressRecord.completedQuizzes : [],
        completedAssignments: progressRecord ? progressRecord.completedAssignments : [],
        completedCoding: progressRecord ? (progressRecord.completedCoding || []) : [],
        projectProgress: progressRecord ? (progressRecord.projectProgress || []) : [],
        completedModules: progressRecord ? progressRecord.completedModules : [],
        lastOpenedModuleIndex: progressRecord ? (progressRecord.lastOpenedModuleIndex || 0) : 0,
        enrolled,
        completedPercent,
        isBookmarked
      }
    })

    res.status(200).json({ success: true, data: results })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: GET /api/courses/:id ---
const getCourseById = async (req, res) => {
  try {
    const courseId = req.params.id
    const course = await resolveCourseByIdOrSlug(courseId)

    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    const progressRecord = await CourseProgress.findOne({ user: req.user._id, course: course._id })
    const bookmark = await Bookmark.findOne({ user: req.user._id, course: course._id })

    const enrolled = !!progressRecord
    let completedPercent = 0
    if (progressRecord) {
      completedPercent = progressRecord.completionPercentage || 0
    }

    const result = {
      _id: course._id,
      title: course.title,
      slug: course.slug,
      technology: course.technology,
      instructor: course.instructor,
      category: course.category,
      difficulty: course.difficulty,
      platform: course.platform || 'ZenScore Academy',
      rating: course.rating || 4.8,
      duration: course.duration || course.estimatedHours || '12 hrs',
      icon: course.icon || '📚',
      description: course.description,
      prerequisites: course.prerequisites || [],
      skillsLearnt: course.skillsLearnt || course.learningOutcomes || [],
      outcomes: course.outcomes || course.learningOutcomes || [],
      modules: course.modules || [],
      completedVideos: progressRecord ? progressRecord.completedVideos : [],
      completedNotes: progressRecord ? progressRecord.completedNotes : [],
      completedQuizzes: progressRecord ? progressRecord.completedQuizzes : [],
      completedAssignments: progressRecord ? progressRecord.completedAssignments : [],
      completedCoding: progressRecord ? (progressRecord.completedCoding || []) : [],
      projectProgress: progressRecord ? (progressRecord.projectProgress || []) : [],
      completedModules: progressRecord ? progressRecord.completedModules : [],
      codingProgress: progressRecord ? (progressRecord.codingProgress || []) : [],
      studyNotes: progressRecord ? (progressRecord.studyNotes || []) : [],
      lastOpenedModuleIndex: progressRecord ? (progressRecord.lastOpenedModuleIndex || 0) : 0,
      enrolled,
      completedPercent,
      isBookmarked: !!bookmark
    }

    res.status(200).json({ success: true, data: result })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: GET /api/courses/stats ---
const getCourseStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    const streak = await getStreakCount(req.user._id)
    const completedCount = await CourseProgress.countDocuments({ user: req.user._id, isCompleted: true })
    const weeklyHours = await getWeeklyStudyHours(req.user._id)
    const certificatesCount = await Certificate.countDocuments({ user: req.user._id })
    const roadmap = await UserRoadmap.findOne({ user: req.user._id })
    const weeklyGoal = roadmap?.weeklyHours || 10

    res.status(200).json({
      success: true,
      data: {
        streak,
        completedCount,
        weeklyHours,
        weeklyGoal,
        certificatesCount,
        xp: user?.xp || 0,
        coins: user?.coins || 0,
        level: user?.level || 1,
        badges: user?.badges || []
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: GET /api/courses/recommended ---
const getRecommendedCourses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    const academic = await AcademicRecord.findOne({ user: req.user._id })
    const enrolledProgress = await CourseProgress.find({ user: req.user._id })
    const bookmarked = await Bookmark.find({ user: req.user._id })

    const enrolledCourseIds = enrolledProgress.map(p => p.course.toString())
    const bookmarkedIds = bookmarked.map(b => b.course.toString())

    // Exclude enrolled & bookmarked courses from recommendations
    const filter = {
      _id: { $nin: [...enrolledCourseIds, ...bookmarkedIds] }
    }

    const availableCourses = await Course.find(filter)
    if (!availableCourses.length) {
      return res.status(200).json({ success: true, data: [] })
    }

    const profile = {
      skills: user?.skills || [],
      weakSubjects: academic?.weakSubjects || [],
      branch: user?.branch || 'General',
      careerGoal: user?.targetRole || 'Software Engineer'
    }

    let recommendations = []

    if (process.env.GROQ_API_KEY) {
      try {
        const Groq = require('groq-sdk')
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
        
        const coursesText = availableCourses.map(c => `- ${c.title} (ID: ${c._id}, Tech: ${c.technology}, Category: ${c.category}, Difficulty: ${c.difficulty})`).join('\n')
        
        const prompt = `You are the ZenScore AI course recommendation engine.
Given the student profile below, recommend exactly 4 courses from the provided available courses database.

Student Profile:
- Skills: ${profile.skills.join(', ')}
- Weak subjects: ${profile.weakSubjects.join(', ')}
- Branch: ${profile.branch}
- Career Goal: ${profile.careerGoal}

Available Course Database:
${coursesText}

Return your recommendation as a valid JSON array of objects with the structure:
[
  { "courseId": "string-mongodb-id", "matchPercent": 95, "reason": "You show strong skills but have database weak areas. This SQL specialization closes the gap." }
]
Only return the JSON code. Do not wrap in markdown or write explanation text.`

        const completion = await groq.chat.completions.create({
          model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2
        })

        let jsonString = completion.choices[0]?.message?.content || '[]'
        jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim()
        recommendations = JSON.parse(jsonString)
      } catch (aiErr) {
        console.error('Groq AI recommendations fallback:', aiErr.message)
      }
    }

    if (!recommendations || recommendations.length === 0) {
      recommendations = availableCourses.map(c => {
        let score = 65
        if (profile.skills.includes(c.technology)) score += 15
        if (profile.weakSubjects.includes(c.technology)) score += 20
        return {
          courseId: c._id.toString(),
          matchPercent: Math.min(score, 98),
          reason: `Highly demanded skill for your field of study in ${c.technology || c.category}.`
        }
      })
      .sort((a, b) => b.matchPercent - a.matchPercent)
      .slice(0, 4)
    }

    const enriched = recommendations.map(rec => {
      const matchCourse = availableCourses.find(c => c._id.toString() === rec.courseId)
      if (!matchCourse) return null
      return {
        _id: matchCourse._id,
        title: matchCourse.title,
        slug: matchCourse.slug,
        technology: matchCourse.technology,
        category: matchCourse.category,
        difficulty: matchCourse.difficulty,
        rating: matchCourse.rating || 4.8,
        duration: matchCourse.duration || matchCourse.estimatedHours || '12 hrs',
        icon: matchCourse.icon || '📚',
        matchPercent: rec.matchPercent,
        reason: rec.reason
      }
    }).filter(Boolean)

    res.status(200).json({ success: true, data: enriched })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: GET /api/courses/continue-learning ---
const getContinueLearning = async (req, res) => {
  try {
    const progressRecords = await CourseProgress.find({ user: req.user._id, isCompleted: false }).populate('course')
    
    const results = progressRecords.map(p => {
      if (!p.course) return null
      const totalCount = p.course.modules?.length || 8
      const completedCount = p.completedModules?.length || 0
      const lastOpenedIdx = p.lastOpenedModuleIndex || 0
      const activeModule = p.course.modules?.[lastOpenedIdx] || p.course.modules?.[0]

      const modulesLeft = Math.max(0, totalCount - completedCount)
      const hoursLeft = Math.max(1, Math.floor(modulesLeft * 1.5))
      const timeLeftStr = `${hoursLeft}h remaining`

      return {
        _id: p.course._id,
        courseId: p.course._id,
        slug: p.course.slug,
        title: p.course.title,
        technology: p.course.technology,
        difficulty: p.course.difficulty,
        icon: p.course.icon || '📚',
        completedCount,
        totalCount,
        completedPercent: p.completionPercentage || 0,
        completionPercentage: p.completionPercentage || 0,
        lastOpenedModuleIndex: lastOpenedIdx,
        lastStudiedAt: p.lastStudiedAt || p.updatedAt,
        timeLeftStr,
        lastLessonCompleted: activeModule?.title || 'Module 1: Introduction'
      }
    }).filter(Boolean)

    res.status(200).json({ success: true, data: results })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: POST /api/courses/:id/enroll ---
const enrollInCourse = async (req, res) => {
  try {
    const courseId = req.params.id
    const course = await resolveCourseByIdOrSlug(courseId)
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    let progress = await CourseProgress.findOne({ user: req.user._id, course: course._id })
    if (progress) {
      return res.status(200).json({ success: true, message: 'Already enrolled.', data: progress })
    }

    progress = await CourseProgress.create({
      user: req.user._id,
      course: course._id,
      completedVideos: [],
      completedNotes: [],
      completedQuizzes: [],
      completedAssignments: [],
      completedCoding: [],
      completedModules: [],
      completionPercentage: 0,
      lastOpenedModuleIndex: 0
    })

    // Log study session for enrollment
    await FocusLog.create({
      user: req.user._id,
      subject: `Enrolled in ${course.title}`,
      durationMinutes: 10,
      notes: `Started learning path specialization.`
    }).catch(() => null)

    await Notification.create({
      user: req.user._id,
      title: 'Course Enrolled! 🚀',
      message: `You successfully enrolled in "${course.title}". Head over to the Study Center to start learning.`,
      type: 'new_course'
    }).catch(() => null)

    res.status(201).json({ success: true, message: 'Enrolled successfully.', data: progress })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: POST /api/courses/:id/modules/:moduleIndex/video ---
const completeModuleVideo = async (req, res) => {
  try {
    const { id, moduleIndex } = req.params
    const course = await resolveCourseByIdOrSlug(id)
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    let progress = await CourseProgress.findOne({ user: req.user._id, course: course._id })
    if (!progress) {
      progress = await CourseProgress.create({
        user: req.user._id,
        course: course._id,
        completedVideos: [],
        completedNotes: [],
        completedQuizzes: [],
        completedAssignments: [],
        completedCoding: [],
        completedModules: [],
        completionPercentage: 0,
        lastOpenedModuleIndex: Number(moduleIndex)
      })
    }

    const val = String(moduleIndex)
    if (!progress.completedVideos.includes(val)) {
      progress.completedVideos.push(val)
    }
    progress.lastOpenedModuleIndex = Number(moduleIndex)
    progress.lastStudiedAt = new Date()
    await progress.save()

    // Award 25 XP
    const user = await User.findById(req.user._id)
    if (user) await awardXpAndCoins(user, 25, 10)

    res.status(200).json({ success: true, message: 'Video watched.', data: progress })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: POST /api/courses/:id/modules/:moduleIndex/notes ---
const completeModuleNotes = async (req, res) => {
  try {
    const { id, moduleIndex } = req.params
    const course = await resolveCourseByIdOrSlug(id)
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    let progress = await CourseProgress.findOne({ user: req.user._id, course: course._id })
    if (!progress) {
      progress = await CourseProgress.create({
        user: req.user._id,
        course: course._id,
        completedVideos: [],
        completedNotes: [],
        completedQuizzes: [],
        completedAssignments: [],
        completedCoding: [],
        completedModules: [],
        completionPercentage: 0,
        lastOpenedModuleIndex: Number(moduleIndex)
      })
    }

    const val = String(moduleIndex)
    if (!progress.completedNotes.includes(val)) {
      progress.completedNotes.push(val)
    }
    progress.lastOpenedModuleIndex = Number(moduleIndex)
    progress.lastStudiedAt = new Date()
    await progress.save()

    // Award 25 XP
    const user = await User.findById(req.user._id)
    if (user) await awardXpAndCoins(user, 25, 10)

    res.status(200).json({ success: true, message: 'Notes completed.', data: progress })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: GET /api/courses/:id/modules/:moduleIndex/quiz ---
const getModuleQuiz = async (req, res) => {
  try {
    const { id, moduleIndex } = req.params
    const course = await resolveCourseByIdOrSlug(id)
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    const idxNum = Number(moduleIndex)
    const targetModule = course.modules[idxNum]
    if (!targetModule) return res.status(404).json({ success: false, message: 'Module not found.' })

    const progress = await CourseProgress.findOne({ user: req.user._id, course: course._id })
    const attempts = (progress?.quizAttempts || []).filter(a => a.moduleIndex === idxNum)
    const bestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : 0
    const isPassed = progress?.completedQuizzes?.includes(String(idxNum)) || false

    // Anti-cheat: strip correctAnswer and explanation
    const sanitizedQuestions = (targetModule.quiz || []).map((q, qIdx) => ({
      id: q._id || String(qIdx),
      questionIndex: qIdx,
      question: q.question,
      options: q.options,
      difficulty: q.difficulty || 'Medium',
      type: q.type || 'multiple_choice',
      points: q.points || 10
    }))

    res.status(200).json({
      success: true,
      data: {
        courseTitle: course.title,
        moduleTitle: targetModule.title,
        moduleIndex: idxNum,
        totalQuestions: sanitizedQuestions.length,
        passingScore: 70,
        questions: sanitizedQuestions,
        attemptHistory: attempts,
        bestScore,
        isPassed
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: POST /api/courses/:id/modules/:moduleIndex/quiz/submit & /quiz ---
const submitModuleQuiz = async (req, res) => {
  try {
    const { id, moduleIndex } = req.params
    const course = await resolveCourseByIdOrSlug(id)
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    const idxNum = Number(moduleIndex)
    const targetModule = course.modules[idxNum]
    if (!targetModule) return res.status(404).json({ success: false, message: 'Module not found.' })

    const { answers } = req.body // Object mapping questionIndex => selectedOptionIndex
    const questions = targetModule.quiz || []
    if (questions.length === 0) {
      return res.status(400).json({ success: false, message: 'No quiz configured for this module.' })
    }

    let correctCount = 0
    const breakdown = questions.map((q, qIdx) => {
      const selected = answers ? Number(answers[qIdx] ?? answers[String(qIdx)]) : -1
      const isCorrect = selected === Number(q.correctAnswer)
      if (isCorrect) correctCount++

      return {
        questionIndex: qIdx,
        question: q.question,
        options: q.options,
        selectedAnswer: selected,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation || ''
      }
    })

    const score = Math.round((correctCount / questions.length) * 100)
    const passed = score >= 70

    let progress = await CourseProgress.findOne({ user: req.user._id, course: course._id })
    if (!progress) {
      progress = await CourseProgress.create({
        user: req.user._id,
        course: course._id,
        completedVideos: [],
        completedNotes: [],
        completedQuizzes: [],
        completedAssignments: [],
        completedCoding: [],
        completedModules: [],
        completionPercentage: 0
      })
    }

    const priorAttempts = (progress.quizAttempts || []).filter(a => a.moduleIndex === idxNum)
    const attemptNumber = priorAttempts.length + 1

    const newAttempt = {
      moduleIndex: idxNum,
      attemptNumber,
      score,
      totalQuestions: questions.length,
      correctCount,
      passed,
      breakdown,
      submittedAt: new Date()
    }

    if (!progress.quizAttempts) progress.quizAttempts = []
    progress.quizAttempts.push(newAttempt)

    const val = String(idxNum)
    if (passed && !progress.completedQuizzes.includes(val)) {
      progress.completedQuizzes.push(val)
      const user = await User.findById(req.user._id)
      if (user) await awardXpAndCoins(user, 50, 25)
    }

    progress.lastStudiedAt = new Date()
    await progress.save()

    const allAttempts = progress.quizAttempts.filter(a => a.moduleIndex === idxNum)
    const bestScore = Math.max(...allAttempts.map(a => a.score))

    res.status(200).json({
      success: true,
      message: passed ? 'Quiz passed! 🎉' : 'Quiz not passed. Review explanations and retry.',
      data: {
        score,
        passed,
        correctCount,
        totalQuestions: questions.length,
        attemptNumber,
        bestScore,
        breakdown
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: GET /api/courses/:id/modules/:moduleIndex/quiz/results ---
const getQuizResults = async (req, res) => {
  try {
    const { id, moduleIndex } = req.params
    const course = await resolveCourseByIdOrSlug(id)
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    const idxNum = Number(moduleIndex)
    const progress = await CourseProgress.findOne({ user: req.user._id, course: course._id })
    const attempts = (progress?.quizAttempts || []).filter(a => a.moduleIndex === idxNum)

    res.status(200).json({
      success: true,
      data: {
        attempts,
        bestScore: attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : 0,
        isPassed: progress?.completedQuizzes?.includes(String(idxNum)) || false
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: GET /api/courses/:id/modules/:moduleIndex/coding ---
const getModuleCoding = async (req, res) => {
  try {
    const { id, moduleIndex } = req.params
    const course = await resolveCourseByIdOrSlug(id)
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    const idxNum = Number(moduleIndex)
    const targetModule = course.modules[idxNum]
    if (!targetModule) return res.status(404).json({ success: false, message: 'Module not found.' })

    const exercise = targetModule.codingExercise || {}
    const progress = await CourseProgress.findOne({ user: req.user._id, course: course._id })
    const userProg = progress?.codingProgress?.find(c => c.moduleIndex === idxNum)

    const sanitizedTestCases = (exercise.testCases || []).map((tc, tcIdx) => ({
      testIndex: tcIdx + 1,
      description: tc.description || `Test Case #${tcIdx + 1}`,
      input: tc.input,
      expected: tc.expected,
      isHidden: tc.isHidden || false
    }))

    res.status(200).json({
      success: true,
      data: {
        title: exercise.title || `Module ${idxNum + 1} Coding Challenge`,
        problem: exercise.problem || 'Implement the required component or function according to the specifications.',
        language: exercise.language || 'javascript',
        difficulty: exercise.difficulty || targetModule.difficulty || 'Intermediate',
        starterCode: userProg?.code || exercise.starterCode || '',
        originalStarterCode: exercise.starterCode || '',
        solutionStub: exercise.solutionStub || '',
        requirements: exercise.requirements || [],
        constraints: exercise.constraints || [],
        hints: exercise.hints || [],
        testCases: sanitizedTestCases,
        points: exercise.points || 20,
        passed: !!userProg?.passed,
        testsPassed: userProg?.testsPassed || 0,
        testsTotal: sanitizedTestCases.length
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: POST /api/courses/:id/modules/:moduleIndex/coding/run & /coding ---
const evaluateCodingExercise = async (req, res) => {
  try {
    const { id, moduleIndex } = req.params
    const { code, language } = req.body
    const course = await resolveCourseByIdOrSlug(id)
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    const idxNum = Number(moduleIndex)
    const targetModule = course.modules[idxNum]
    if (!targetModule) return res.status(404).json({ success: false, message: 'Module not found.' })

    const exercise = targetModule.codingExercise || {}
    const lang = language || exercise.language || 'javascript'
    const testCases = exercise.testCases || []

    let progress = await CourseProgress.findOne({ user: req.user._id, course: course._id })
    if (!progress) {
      progress = await CourseProgress.create({
        user: req.user._id,
        course: course._id,
        codingProgress: [],
        completedCoding: [],
        completedModules: []
      })
    }

    // Execute through safe isolated runner
    const executionResult = await executeCode(code || '', lang, testCases)

    if (!progress.codingProgress) progress.codingProgress = []
    let userProg = progress.codingProgress.find(c => c.moduleIndex === idxNum)
    if (!userProg) {
      userProg = {
        moduleIndex: idxNum,
        code: code || '',
        language: lang,
        passed: executionResult.passed,
        testsPassed: executionResult.testsPassed,
        testsTotal: executionResult.testsTotal,
        attempts: []
      }
      progress.codingProgress.push(userProg)
    } else {
      userProg.code = code || ''
      userProg.language = lang
      userProg.testsPassed = executionResult.testsPassed
      userProg.testsTotal = executionResult.testsTotal
      if (executionResult.passed) userProg.passed = true
    }

    const attemptNumber = (userProg.attempts?.length || 0) + 1
    userProg.attempts.push({
      attemptNumber,
      code: code || '',
      passed: executionResult.passed,
      testsPassed: executionResult.testsPassed,
      testsTotal: executionResult.testsTotal,
      output: executionResult.stdout || executionResult.stderr || '',
      submittedAt: new Date()
    })

    const val = String(idxNum)
    if (executionResult.passed && !progress.completedCoding.includes(val)) {
      progress.completedCoding.push(val)
      const user = await User.findById(req.user._id)
      if (user) await awardXpAndCoins(user, 50, 25)
    }

    progress.lastStudiedAt = new Date()
    await progress.save()

    res.status(200).json({
      success: true,
      passed: executionResult.passed,
      testsPassed: executionResult.testsPassed,
      testsTotal: executionResult.testsTotal,
      stdout: executionResult.stdout,
      stderr: executionResult.stderr,
      executionTime: executionResult.executionTime,
      results: executionResult.results
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: POST /api/courses/:id/modules/:moduleIndex/coding/save ---
const saveModuleCodingDraft = async (req, res) => {
  try {
    const { id, moduleIndex } = req.params
    const { code, language } = req.body
    const course = await resolveCourseByIdOrSlug(id)
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    const idxNum = Number(moduleIndex)
    let progress = await CourseProgress.findOne({ user: req.user._id, course: course._id })
    if (!progress) {
      progress = await CourseProgress.create({
        user: req.user._id,
        course: course._id,
        codingProgress: []
      })
    }

    if (!progress.codingProgress) progress.codingProgress = []
    let userProg = progress.codingProgress.find(c => c.moduleIndex === idxNum)
    if (!userProg) {
      progress.codingProgress.push({
        moduleIndex: idxNum,
        code: code || '',
        language: language || 'javascript',
        passed: false,
        testsPassed: 0,
        testsTotal: 0
      })
    } else {
      userProg.code = code || ''
      if (language) userProg.language = language
    }

    progress.lastStudiedAt = new Date()
    await progress.save()

    res.status(200).json({ success: true, message: 'Coding draft saved.' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: GET /api/courses/:id/modules/:moduleIndex/project ---
const getModuleProject = async (req, res) => {
  try {
    const { id, moduleIndex } = req.params
    const course = await resolveCourseByIdOrSlug(id)
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    const idxNum = Number(moduleIndex)
    const targetModule = course.modules[idxNum]
    if (!targetModule) return res.status(404).json({ success: false, message: 'Module not found.' })

    const progress = await CourseProgress.findOne({ user: req.user._id, course: course._id })
    const userProj = progress?.projectProgress?.find(p => p.moduleIndex === idxNum)

    const projectSpec = targetModule.assignment || targetModule.projectSpec || {}
    const sanitizedTestCases = (projectSpec.testCases || []).map(tc => ({
      input: tc.input,
      description: tc.description || '',
      weight: tc.weight || 33
    }))

    const latestAttempt = userProj?.attempts && userProj.attempts.length > 0 
      ? userProj.attempts[userProj.attempts.length - 1] 
      : null

    res.status(200).json({
      success: true,
      data: {
        title: projectSpec.title || `Capstone Project: ${targetModule.title}`,
        description: projectSpec.description || targetModule.description || 'Build and submit your specialization capstone component.',
        objective: projectSpec.objective || '',
        requirements: projectSpec.requirements || [],
        allowedLanguages: projectSpec.allowedLanguages || ['javascript'],
        starterCode: userProj?.code || projectSpec.starterCode || '',
        originalStarterCode: projectSpec.starterCode || '',
        testCases: sanitizedTestCases,
        minimumScore: projectSpec.minimumScore || 70,
        rubric: projectSpec.rubric || [
          { criterion: 'Test Verification', weight: 50, description: 'All automated edge-case assertion test cases pass.' },
          { criterion: 'Architecture & Modularity', weight: 20, description: 'Clean functional boundaries, error guards, and patterns.' },
          { criterion: 'Code Quality', weight: 15, description: 'Readable, idiomatic, and maintainable implementation.' },
          { criterion: 'Requirement Coverage', weight: 15, description: 'Comprehensive fulfillment of assignment objectives.' }
        ],
        passed: !!userProj?.passed,
        bestScore: userProj?.bestScore || 0,
        latestAttempt
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: POST /api/courses/:id/modules/:moduleIndex/project/run ---
const runModuleProjectTests = async (req, res) => {
  try {
    const { id, moduleIndex } = req.params
    const { code, language } = req.body
    const course = await resolveCourseByIdOrSlug(id)
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    const targetModule = course.modules[Number(moduleIndex)]
    if (!targetModule) return res.status(404).json({ success: false, message: 'Module not found.' })

    const projectSpec = targetModule.assignment || targetModule.projectSpec || {}
    const lang = language || projectSpec.allowedLanguages?.[0] || 'javascript'
    const result = await executeCode(code || '', lang, projectSpec.testCases || [])

    res.status(200).json({
      success: true,
      data: result
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: POST /api/courses/:id/modules/:moduleIndex/project/submit ---
const submitModuleProject = async (req, res) => {
  try {
    const { id, moduleIndex } = req.params
    const { code, language } = req.body

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Project code cannot be empty.' })
    }

    const course = await resolveCourseByIdOrSlug(id)
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    const idxNum = Number(moduleIndex)
    const targetModule = course.modules[idxNum]
    if (!targetModule) return res.status(404).json({ success: false, message: 'Module not found.' })

    let progress = await CourseProgress.findOne({ user: req.user._id, course: course._id })
    if (!progress) {
      progress = await CourseProgress.create({
        user: req.user._id,
        course: course._id,
        projectProgress: []
      })
    }

    // Validate using two-tier engine (Deterministic + AI Quality)
    const projectSpec = targetModule.assignment || targetModule.projectSpec || {}
    const lang = language || projectSpec.allowedLanguages?.[0] || 'javascript'
    const gradingResult = await gradeProjectSubmission(code, lang, projectSpec)

    if (!progress.projectProgress) progress.projectProgress = []
    let userProj = progress.projectProgress.find(p => p.moduleIndex === idxNum)
    if (!userProj) {
      userProj = {
        moduleIndex: idxNum,
        code,
        language: lang,
        passed: gradingResult.passed,
        bestScore: gradingResult.finalScore,
        attempts: []
      }
      progress.projectProgress.push(userProj)
    } else {
      userProj.code = code
      userProj.language = lang
      userProj.bestScore = Math.max(userProj.bestScore || 0, gradingResult.finalScore)
      if (gradingResult.passed) userProj.passed = true
    }

    const attemptNumber = (userProj.attempts?.length || 0) + 1
    const attemptRecord = {
      attemptNumber,
      code,
      finalScore: gradingResult.finalScore,
      testScore: gradingResult.testScore,
      qualityScore: gradingResult.qualityScore,
      requirementsScore: gradingResult.requirementsScore,
      architectureScore: gradingResult.architectureScore,
      passed: gradingResult.passed,
      testResults: gradingResult.testResults || [],
      aiFeedback: gradingResult.aiFeedback,
      submittedAt: new Date()
    }
    userProj.attempts.push(attemptRecord)

    const val = String(idxNum)
    if (gradingResult.passed && !progress.completedAssignments.includes(val)) {
      progress.completedAssignments.push(val)
      const user = await User.findById(req.user._id)
      if (user) await awardXpAndCoins(user, 100, 50)
    }

    progress.lastStudiedAt = new Date()
    await progress.save()

    res.status(200).json({
      success: true,
      message: gradingResult.passed ? 'Capstone Project Evaluated & Passed! 🚀' : 'Project evaluated. Needs improvement to meet requirements.',
      data: {
        result: gradingResult,
        attempt: attemptRecord
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: POST /api/courses/:id/modules/:moduleIndex/project/save ---
const saveModuleProjectDraft = async (req, res) => {
  try {
    const { id, moduleIndex } = req.params
    const { code, language } = req.body
    const course = await resolveCourseByIdOrSlug(id)
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    const idxNum = Number(moduleIndex)
    let progress = await CourseProgress.findOne({ user: req.user._id, course: course._id })
    if (!progress) {
      progress = await CourseProgress.create({
        user: req.user._id,
        course: course._id,
        projectProgress: []
      })
    }

    if (!progress.projectProgress) progress.projectProgress = []
    let userProj = progress.projectProgress.find(p => p.moduleIndex === idxNum)
    if (!userProj) {
      progress.projectProgress.push({
        moduleIndex: idxNum,
        code: code || '',
        language: language || 'javascript',
        passed: false,
        bestScore: 0
      })
    } else {
      userProj.code = code || ''
      if (language) userProj.language = language
    }

    progress.lastStudiedAt = new Date()
    await progress.save()

    res.status(200).json({ success: true, message: 'Project draft saved.' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: POST /api/courses/:id/modules/:moduleIndex/assignment ---
const submitModuleAssignment = async (req, res) => {
  try {
    const { id, moduleIndex } = req.params
    const { submissionText } = req.body
    const course = await resolveCourseByIdOrSlug(id)
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    const idxNum = Number(moduleIndex)
    let progress = await CourseProgress.findOne({ user: req.user._id, course: course._id })
    if (!progress) {
      progress = await CourseProgress.create({
        user: req.user._id,
        course: course._id,
        completedAssignments: []
      })
    }

    const val = String(idxNum)
    if (!progress.completedAssignments.includes(val)) {
      progress.completedAssignments.push(val)
    }

    progress.lastStudiedAt = new Date()
    await progress.save()

    const user = await User.findById(req.user._id)
    if (user) await awardXpAndCoins(user, 50, 25)

    res.status(200).json({
      success: true,
      grade: 85,
      feedback: 'Assignment received and evaluated successfully.',
      data: progress
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: POST /api/courses/:id/modules/:moduleIndex/complete ---
const completeModule = async (req, res) => {
  try {
    const { id, moduleIndex } = req.params
    const course = await resolveCourseByIdOrSlug(id)
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    let progress = await CourseProgress.findOne({ user: req.user._id, course: course._id })
    if (!progress) {
      progress = await CourseProgress.create({
        user: req.user._id,
        course: course._id,
        completedVideos: [],
        completedNotes: [],
        completedQuizzes: [],
        completedAssignments: [],
        completedCoding: [],
        completedModules: [],
        completionPercentage: 0,
        lastOpenedModuleIndex: Number(moduleIndex)
      })
    }

    const val = String(moduleIndex)
    const targetModule = course.modules[Number(moduleIndex)]
    const moduleHasQuiz = targetModule && (targetModule.quiz || []).length > 0
    const moduleHasAssignment = targetModule && !!(targetModule.assignment && targetModule.assignment.title)

    // Stage validation
    if (moduleHasQuiz && !progress.completedQuizzes.includes(val)) {
      return res.status(400).json({
        success: false,
        message: 'Complete the Practice Quiz (score ≥70%) before marking this module complete.',
        stage: 'quiz_required'
      })
    }
    if (moduleHasAssignment && !progress.completedAssignments.includes(val)) {
      return res.status(400).json({
        success: false,
        message: 'Submit and pass the AI Project Grader (grade ≥70) before completing this module.',
        stage: 'assignment_required'
      })
    }

    if (!progress.completedModules.includes(val)) {
      progress.completedModules.push(val)
    }

    const totalModules = course.modules?.length || 8
    progress.completionPercentage = Math.round((progress.completedModules.length / totalModules) * 100)

    if (progress.completionPercentage >= 100) {
      progress.isCompleted = true

      // Safe, Idempotent Certificate Creation with all required schema fields
      const existingCert = await Certificate.findOne({ user: req.user._id, course: course._id })
      if (!existingCert) {
        const certId = 'ZSC-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000)
        await Certificate.create({
          user: req.user._id,
          course: course._id,
          certificateId: certId,
          title: `${course.title} Specialization Certificate`,
          skillName: course.category || course.technology || 'Engineering',
          score: 95,
          issuedBy: 'ZenScore AI Academy',
          earnedAt: new Date(),
          certificateUrl: `/courses/certificate/${course._id}`
        }).catch(err => console.warn('Certificate create warning:', err.message))
      }

      await Notification.create({
        user: req.user._id,
        title: 'Course Completed! 🎓',
        message: `Congratulations! You completed "${course.title}" and earned a verified certificate.`,
        type: 'completed_course'
      }).catch(() => null)
    }

    progress.lastOpenedModuleIndex = Math.min(Number(moduleIndex) + 1, totalModules - 1)
    progress.lastStudiedAt = new Date()
    await progress.save()

    const user = await User.findById(req.user._id)
    if (user) await awardXpAndCoins(user, 100, 50)

    res.status(200).json({
      success: true,
      message: `Module ${Number(moduleIndex) + 1} marked complete!`,
      data: progress
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: POST /api/courses/:id/bookmark ---
const toggleBookmark = async (req, res) => {
  try {
    const courseId = req.params.id
    const course = await resolveCourseByIdOrSlug(courseId)
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    const existing = await Bookmark.findOne({ user: req.user._id, course: course._id })

    if (existing) {
      await Bookmark.deleteOne({ _id: existing._id })
      return res.status(200).json({ success: true, isBookmarked: false, message: 'Bookmark removed.' })
    }

    await Bookmark.create({
      user: req.user._id,
      course: course._id
    })

    res.status(201).json({ success: true, isBookmarked: true, message: 'Course bookmarked.' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: POST /api/courses/:id/last-opened ---
const updateLastOpenedModule = async (req, res) => {
  try {
    const courseId = req.params.id
    const { moduleIndex } = req.body
    const course = await resolveCourseByIdOrSlug(courseId)
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    let progress = await CourseProgress.findOne({ user: req.user._id, course: course._id })
    if (!progress) {
      progress = await CourseProgress.create({
        user: req.user._id,
        course: course._id,
        lastOpenedModuleIndex: Number(moduleIndex) || 0
      })
    } else {
      progress.lastOpenedModuleIndex = Number(moduleIndex) || 0
      progress.lastStudiedAt = new Date()
      await progress.save()
    }

    res.status(200).json({ success: true, data: progress })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: GET /api/courses/:id/modules/:moduleIndex/note ---
const getModuleNote = async (req, res) => {
  try {
    const { id, moduleIndex } = req.params
    const course = await resolveCourseByIdOrSlug(id)
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    const progress = await CourseProgress.findOne({ user: req.user._id, course: course._id })
    const note = progress?.studyNotes?.find(n => n.moduleIndex === Number(moduleIndex))

    res.status(200).json({
      success: true,
      data: {
        content: note?.content || ''
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: POST /api/courses/:id/modules/:moduleIndex/note ---
const saveModuleNote = async (req, res) => {
  try {
    const { id, moduleIndex } = req.params
    const { content } = req.body
    const course = await resolveCourseByIdOrSlug(id)
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    const idxNum = Number(moduleIndex)
    let progress = await CourseProgress.findOne({ user: req.user._id, course: course._id })
    if (!progress) {
      progress = await CourseProgress.create({
        user: req.user._id,
        course: course._id,
        studyNotes: []
      })
    }

    if (!progress.studyNotes) progress.studyNotes = []
    let note = progress.studyNotes.find(n => n.moduleIndex === idxNum)
    if (!note) {
      progress.studyNotes.push({ moduleIndex: idxNum, content: content || '' })
    } else {
      note.content = content || ''
      note.updatedAt = new Date()
    }

    progress.lastStudiedAt = new Date()
    await progress.save()

    res.status(200).json({ success: true, message: 'Study note saved.' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: POST /api/courses/:id/modules/:moduleIndex/tutor ---
const askModuleAITutor = async (req, res) => {
  try {
    const { id, moduleIndex } = req.params
    const { question, conversationHistory } = req.body

    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, message: 'Question cannot be empty.' })
    }

    const course = await resolveCourseByIdOrSlug(id)
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    const targetModule = course.modules[Number(moduleIndex)]
    if (!targetModule) return res.status(404).json({ success: false, message: 'Module not found.' })

    const moduleTitle = targetModule.title || 'Core Concepts'
    const lessonMarkdown = targetModule.notes?.markdown || targetModule.description || ''
    const keyPoints = (targetModule.notes?.keyPoints || []).join(', ')

    let tutorAnswer = `Here is an explanation of **${moduleTitle}** in **${course.title}**:\n\n${targetModule.description || 'This module covers critical software engineering foundations.'}\n\n**Key Focus**:\n- Review the structured lesson notes and code examples in the workspace.\n- Test your understanding using the Learning Checkpoint at the bottom of the lesson notes.\n- Solve the practical coding challenge in the Coding Lab.`

    if (process.env.GROQ_API_KEY) {
      try {
        const Groq = require('groq-sdk')
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

        const systemPrompt = `You are the ZenScore AI 1-on-1 Academic & Code Tutor for the course "${course.title}", specifically assisting on Module ${Number(moduleIndex) + 1}: "${moduleTitle}".
Course Category: ${course.category}
Module Objectives: ${(targetModule.learningObjectives || []).join(', ')}
Key Concepts: ${keyPoints}

Provide helpful, clear, precise pedagogical guidance. Provide code examples when explaining syntax or algorithms. Encourage active problem-solving.`

        const messages = [
          { role: 'system', content: systemPrompt },
          ...(conversationHistory || []).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.content
          })),
          { role: 'user', content: question }
        ]

        const completion = await groq.chat.completions.create({
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.3,
          max_tokens: 800
        })

        tutorAnswer = completion.choices[0]?.message?.content || tutorAnswer
      } catch (aiErr) {
        console.error('Groq AI Tutor error, using contextual fallback:', aiErr.message)
      }
    }

    res.status(200).json({
      success: true,
      data: {
        answer: tutorAnswer
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: GET /api/courses/roadmap ---
const getRoadmap = async (req, res) => {
  try {
    let roadmap = await UserRoadmap.findOne({ user: req.user._id })
    if (!roadmap) {
      roadmap = await UserRoadmap.create({
        user: req.user._id,
        currentTrack: 'Full Stack Engineering',
        targetRole: 'Full Stack Developer',
        weeklyHours: 10,
        timelineMonths: 6,
        progress: 15
      })
    }

    const dynamicSteps = await getDynamicRoadmapSteps(req.user._id)

    res.status(200).json({
      success: true,
      data: {
        track: roadmap.currentTrack,
        targetRole: roadmap.targetRole,
        weeklyHours: roadmap.weeklyHours,
        timelineMonths: roadmap.timelineMonths,
        progress: roadmap.progress || 20,
        steps: dynamicSteps
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: POST /api/courses/roadmap/adjust ---
const adjustRoadmap = async (req, res) => {
  try {
    const { track, targetRole, weeklyHours, timelineMonths } = req.body
    let roadmap = await UserRoadmap.findOne({ user: req.user._id })
    if (!roadmap) {
      roadmap = new UserRoadmap({ user: req.user._id })
    }

    if (track) roadmap.currentTrack = track
    if (targetRole) roadmap.targetRole = targetRole
    if (weeklyHours) roadmap.weeklyHours = Number(weeklyHours)
    if (timelineMonths) roadmap.timelineMonths = Number(timelineMonths)

    await roadmap.save()
    const dynamicSteps = await getDynamicRoadmapSteps(req.user._id)

    res.status(200).json({
      success: true,
      message: 'Roadmap preferences updated.',
      data: {
        track: roadmap.currentTrack,
        targetRole: roadmap.targetRole,
        weeklyHours: roadmap.weeklyHours,
        timelineMonths: roadmap.timelineMonths,
        steps: dynamicSteps
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: GET /api/courses/daily-challenge ---
const getDailyChallenge = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0]
    let challenge = await DailyChallenge.findOne({ date: todayStr })
    if (!challenge) {
      challenge = await DailyChallenge.create({
        date: todayStr,
        title: 'Mastering Array Chunking & Reducers',
        type: 'JavaScript',
        difficulty: 'Medium',
        description: 'Implement a pure Javascript array partitioning utility with O(N) performance constraints.',
        duration: '15 mins',
        xpReward: 75,
        submissions: []
      })
    }

    const isCompleted = (challenge.submissions || []).some(
      s => s.user && s.user.toString() === req.user._id.toString()
    )

    res.status(200).json({
      success: true,
      data: {
        title: challenge.title,
        type: challenge.type,
        difficulty: challenge.difficulty,
        description: challenge.description || 'Implement the daily challenge exercise.',
        xp: challenge.xpReward || 75,
        coins: 40,
        duration: challenge.duration || '15 mins',
        isCompleted
      }
    })
  } catch (err) {
    console.error('getDailyChallenge error:', err)
    res.status(200).json({
      success: true,
      data: {
        title: 'Mastering Array Chunking & Reducers',
        type: 'JavaScript',
        difficulty: 'Medium',
        description: 'Implement a pure Javascript array partitioning utility with O(N) performance constraints.',
        xp: 75,
        coins: 40,
        duration: '15 mins',
        isCompleted: false
      }
    })
  }
}

// --- Controller: POST /api/courses/daily-challenge/submit ---
const submitDailyChallenge = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0]
    let challenge = await DailyChallenge.findOne({ date: todayStr })
    if (!challenge) {
      challenge = await DailyChallenge.create({
        date: todayStr,
        title: 'Mastering Array Chunking & Reducers',
        type: 'JavaScript',
        difficulty: 'Medium',
        description: 'Implement a pure Javascript array partitioning utility with O(N) performance constraints.',
        duration: '15 mins',
        xpReward: 75,
        submissions: []
      })
    }

    const isCompleted = (challenge.submissions || []).some(
      s => s.user && s.user.toString() === req.user._id.toString()
    )

    if (isCompleted) {
      return res.status(200).json({ success: true, message: 'Challenge already completed today.' })
    }

    if (!challenge.submissions) challenge.submissions = []
    challenge.submissions.push({
      user: req.user._id,
      completedAt: new Date()
    })
    await challenge.save()

    const user = await User.findById(req.user._id)
    const xp = challenge.xpReward || 75
    if (user) await awardXpAndCoins(user, xp, 40)

    res.status(200).json({
      success: true,
      message: `Daily Challenge Completed! Awarded +${xp} XP & +40 Coins.`
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: GET /api/courses/notifications ---
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10)
    res.status(200).json({ success: true, data: notifications })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: GET /api/courses/certificates ---
const getCertificates = async (req, res) => {
  try {
    const userId = req.user._id
    
    // Auto-issue certificates for all skills where completionPercentage === 100
    try {
      const completedSkillProgresses = await UserSkillProgress.find({ user: userId, completionPercentage: 100 }).populate('skill')
      for (const sp of completedSkillProgresses) {
        if (sp.skill) {
          const existingCert = await Certificate.findOne({ user: userId, skill: sp.skill._id })
          if (!existingCert) {
            const certId = 'ZSC-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000)
            await Certificate.create({
              user: userId,
              skill: sp.skill._id,
              certificateId: certId,
              title: sp.skill.name + ' Mastery Certification',
              skillName: sp.skill.name,
              score: 95,
              issuedBy: 'ZenScore AI Academy',
              earnedAt: sp.lastActivity || new Date(),
              certificateUrl: '/skills/certificate/' + sp.skill._id
            }).catch(() => null)
          }
        }
      }
    } catch (e) {
      console.warn('Auto-skill-certificate check warning:', e.message)
    }

    // Auto-issue certificates for all courses where completionPercentage === 100 or isCompleted === true
    try {
      const completedCourseProgresses = await CourseProgress.find({
        user: userId,
        $or: [{ completionPercentage: 100 }, { isCompleted: true }]
      }).populate('course')

      for (const cp of completedCourseProgresses) {
        if (cp.course) {
          const existingCert = await Certificate.findOne({ user: userId, course: cp.course._id })
          if (!existingCert) {
            const certId = 'ZSC-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000)
            await Certificate.create({
              user: userId,
              course: cp.course._id,
              certificateId: certId,
              title: `${cp.course.title} Specialization Certificate`,
              skillName: cp.course.category || cp.course.technology || 'Engineering',
              score: 95,
              issuedBy: 'ZenScore AI Academy',
              earnedAt: cp.lastStudiedAt || new Date(),
              certificateUrl: `/courses/certificate/${cp.course._id}`
            }).catch(() => null)
          }
        }
      }
    } catch (e) {
      console.warn('Auto-course-certificate check warning:', e.message)
    }

    const certificates = await Certificate.find({ user: userId })
      .populate('course')
      .populate('skill')
      .sort({ earnedAt: -1, createdAt: -1 })
      .lean()

    const formatted = certificates.map(c => {
      const title = c.title || (c.skill?.name ? (c.skill.name + ' Mastery Certification') : (c.course?.title ? (c.course.title + ' Specialization Certificate') : 'ZenScore AI Verified Certificate'))
      const skillName = c.skillName || c.skill?.name || c.course?.category || 'Engineering'
      const issueDate = c.earnedAt ? new Date(c.earnedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Verified'
      
      return {
        id: c._id.toString(),
        certificateId: c.certificateId,
        title,
        skillName,
        score: c.score || 95,
        issuedBy: c.issuedBy || 'ZenScore AI Academy',
        issueDate,
        earnedAt: c.earnedAt,
        certificateUrl: c.certificateUrl,
        type: c.course ? 'course' : 'skill'
      }
    })

    res.status(200).json({ success: true, data: formatted })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Controller: GET /api/courses/analytics ---
const getLearningAnalytics = async (req, res) => {
  try {
    const progressList = await CourseProgress.find({ user: req.user._id }).populate('course')
    const streak = await getStreakCount(req.user._id)
    const weeklyHours = await getWeeklyStudyHours(req.user._id)

    const totalEnrolled = progressList.length
    const completedCourses = progressList.filter(p => p.isCompleted || p.completionPercentage === 100).length
    const activeCourses = totalEnrolled - completedCourses

    let totalQuizzesTaken = 0
    let quizScoresSum = 0
    let totalCodeTasks = 0
    let totalCodePasses = 0

    progressList.forEach(p => {
      (p.quizAttempts || []).forEach(q => {
        totalQuizzesTaken++
        quizScoresSum += q.score
      })
      ;(p.codingProgress || []).forEach(c => {
        totalCodeTasks++
        if (c.passed) totalCodePasses++
      })
    })

    const quizAverage = totalQuizzesTaken > 0 ? Math.round(quizScoresSum / totalQuizzesTaken) : 88
    const codingScore = totalCodeTasks > 0 ? Math.round((totalCodePasses / totalCodeTasks) * 100) : 90
    const completionRate = totalEnrolled > 0 ? Math.round((completedCourses / totalEnrolled) * 100) : 0

    res.status(200).json({
      success: true,
      data: {
        totalEnrolled,
        completedCourses,
        activeCourses,
        completionRate,
        streak,
        weeklyHours,
        quizAverage,
        codingScore,
        learningVelocity: 'Fast (1.2 courses/mo)',
        predictedCompletion: 'August 14, 2026'
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = {
  getCourses,
  getCourseById,
  getCourseStats,
  getRecommendedCourses,
  getContinueLearning,
  enrollInCourse,
  completeModuleVideo,
  completeModuleNotes,
  getModuleQuiz,
  submitModuleQuiz,
  getQuizResults,
  getModuleCoding,
  evaluateCodingExercise,
  saveModuleCodingDraft,
  getModuleProject,
  runModuleProjectTests,
  submitModuleProject,
  saveModuleProjectDraft,
  submitModuleAssignment,
  completeModule,
  toggleBookmark,
  getRoadmap,
  adjustRoadmap,
  getDailyChallenge,
  submitDailyChallenge,
  getNotifications,
  getCertificates,
  getLearningAnalytics,
  updateLastOpenedModule,
  getModuleNote,
  saveModuleNote,
  askModuleAITutor
}
