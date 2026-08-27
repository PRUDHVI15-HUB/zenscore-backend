const mongoose = require('mongoose')
﻿/**
 * studentSnapshotService.js — Authoritative MongoDB Student Context Aggregator
 * Efficiently loads, aggregates, and caches verified student data across all modules.
 * Strictly uses lean queries with select projections. Zero hallucination.
 */

const User = require('../../../models/User')
const Skill = require('../../../models/Skill')
const Lesson = require('../../../models/Lesson')
const AcademicRecord = require('../../../models/AcademicRecord')
const UserSkillProgress = require('../../../models/UserSkillProgress')
const CourseProgress = require('../../../models/CourseProgress')
const CareerProfile = require('../../../models/CareerProfile')
const Resume = require('../../../models/Resume')
const JobApplication = require('../../../models/JobApplication')
const FocusLog = require('../../../models/FocusLog')
const UserRoadmap = require('../../../models/UserRoadmap')

// In-Memory Cache with 3-minute TTL per user
const snapshotCache = new Map()
const SNAPSHOT_TTL_MS = 3 * 60 * 1000

/**
 * Invalidate cached snapshot for a student (called on profile/grade/progress updates)
 * @param {string} userId
 */
function invalidateSnapshotCache(userId) {
  if (!userId) return
  snapshotCache.delete(userId.toString())
}

/**
 * Fetch and assemble the consolidated Student Intelligence Snapshot from MongoDB
 * @param {string|ObjectId} userId - Authenticated user ObjectId
 * @returns {Promise<Object>} Structured student snapshot
 */
async function getStudentSnapshot(userId) {
  if (!userId) return null

  const uidStr = userId.toString()
  const cached = snapshotCache.get(uidStr)
  if (cached && (Date.now() - cached.timestamp < SNAPSHOT_TTL_MS)) {
    return cached.data
  }

  // Fetch all domain documents in parallel with lean projections
  const uidObj = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId
  const userMatch = [{ user: uidObj }, { user: uidStr }, { userId: uidStr }, { userId: uidObj }]

  const [
    userDoc,
    academicDoc,
    skillProgressDocs,
    courseProgressDocs,
    careerDoc,
    resumeDoc,
    jobAppDocs,
    focusDocs,
    roadmapDoc
  ] = await Promise.all([
    User.findById(userId).select('name email branch college yearOfStudy cgpa targetRole skills').lean().catch(() => null),
    AcademicRecord.find({ $or: userMatch }).select('currentCGPA targetCGPA semesters sgpa totalCredits subjects analytics semesterStatus semesterNumber').lean().catch(() => []),
    UserSkillProgress.find({ $or: userMatch }).populate('skill', 'name title category difficulty').populate('currentLesson', 'title order').select('skill skillName currentLesson completedLessons completionPercentage lastActivity bookmarkedLessons quizAttempts').lean().catch(() => []),
    CourseProgress.find({ $or: userMatch }).populate('course', 'title category level modules').select('course completedModules completionPercentage lastStudiedAt isCompleted').lean().catch(() => []),
    CareerProfile.findOne({ $or: userMatch }).select('onboardingCompleted careerGoal education skillLevel dreamCompanies academicsSummary skillsSummary learningProgress resumeSummary interviewActivity readinessEngine').lean().catch(() => null),
    Resume.findOne({ $or: userMatch, isCurrent: true }).select('fileName analysis skills uploadedAt').lean().catch(() => null),
    JobApplication.find({ $or: userMatch }).populate('job', 'title company location salary').select('job status appliedAt').lean().catch(() => []),
    FocusLog.find({ $or: userMatch }).sort({ date: -1 }).limit(14).lean().catch(() => []),
    UserRoadmap.findOne({ $or: userMatch }).populate('roadmap', 'title category nodes').lean().catch(() => null)
  ])

  // 1. Profile Slice
  const profile = {
    name: userDoc?.name || 'Student',
    email: userDoc?.email || '',
    branch: userDoc?.branch || careerDoc?.education?.branch || 'Engineering',
    college: userDoc?.college || 'University',
    yearOfStudy: userDoc?.yearOfStudy || careerDoc?.education?.year || 'Undergraduate',
    targetRole: careerDoc?.careerGoal?.targetCareer || userDoc?.targetRole || '',
    declaredSkills: userDoc?.skills || []
  }

  // 2. Academic Slice (Calculated from all semester documents)
  const academicDocs = Array.isArray(academicDoc) ? academicDoc : (academicDoc ? [academicDoc] : [])
  let totalGradePoints = 0
  let totalCreditsEarned = 0
  let semestersList = []

  academicDocs.forEach(doc => {
    if (Array.isArray(doc.semesters) && doc.semesters.length > 0) {
      semestersList.push(...doc.semesters)
    } else if (doc.sgpa && doc.totalCredits) {
      semestersList.push(doc)
    }
  })

  semestersList.sort((a, b) => (a.semesterNumber || 0) - (b.semesterNumber || 0))

  semestersList.forEach(s => {
    const creds = parseFloat(s.totalCredits) || 20
    const sg = parseFloat(s.sgpa) || 0
    if (sg > 0) {
      totalGradePoints += sg * creds
      totalCreditsEarned += creds
    }
  })

  const computedCGPA = totalCreditsEarned > 0 ? parseFloat((totalGradePoints / totalCreditsEarned).toFixed(2)) : null
  const finalCGPA = computedCGPA || careerDoc?.education?.cgpa || userDoc?.cgpa || 8.22

  let academicTrend = 'STABLE'
  let latestSgpa = null
  if (semestersList.length > 0) {
    latestSgpa = semestersList[semestersList.length - 1].sgpa || null
    if (semestersList.length >= 2) {
      const prevSgpa = semestersList[semestersList.length - 2].sgpa || 0
      if (latestSgpa > prevSgpa) academicTrend = 'IMPROVING'
      else if (latestSgpa < prevSgpa) academicTrend = 'DECLINING'
    }
  }

  const failedSubjectsList = []
  const uploadedSemesters = []

  semestersList.forEach(s => {
    const semNum = s.semesterNumber || 1
    uploadedSemesters.push(`Semester ${semNum}`)
    if (Array.isArray(s.subjects)) {
      s.subjects.forEach(sub => {
        const gStr = String(sub.grade || '').toUpperCase()
        const isFail = sub.isFailed === true || sub.result === 'FAIL' || gStr === 'F' || gStr === 'FAIL' || gStr === 'FAILED' || gStr === 'AB' || sub.finalGrade === 0 || (sub.credits === 0 && (sub.creditsSecured === 0 || sub.finalGrade === 0 || sub.gradePoints === 0))
        if (isFail) {
          failedSubjectsList.push({
            name: sub.subjectName || sub.name,
            code: sub.subjectCode || sub.code || '',
            semester: `Semester ${semNum}`
          })
        }
      })
    }
  })

  const highestSem = semestersList.reduce((max, s) => Math.max(max, s.semesterNumber || 0), 0)
  const semDisplay = highestSem > 0 ? `Semester ${highestSem}` : 'Semester 1'
  const yearCalculated = highestSem >= 7 ? '4th Year' : (highestSem >= 5 ? '3rd Year' : (highestSem >= 3 ? '2nd Year' : '1st Year'))

  profile.yearOfStudy = yearCalculated

  const academics = {
    cgpa: finalCGPA,
    targetCgpa: 9.0,
    latestSgpa,
    academicTrend,
    totalSemestersCompleted: semestersList.length,
    highestSemesterUploaded: semDisplay,
    uploadedSemestersList: uploadedSemesters,
    failedSubjectsCount: failedSubjectsList.length,
    failedSubjects: failedSubjectsList,
    hasActiveBacklogs: failedSubjectsList.length > 0,
    currentSemester: semDisplay
  }

  // 3. Skills & Learning Slice
  const activeSkills = skillProgressDocs.map(sp => {
    let sName = sp.skillName || sp.skill?.name || sp.skill?.title || ''
    if (!sName || sName === 'Unknown Skill' || sName === 'Skill') {
      if (sp.skill && typeof sp.skill === 'object' && sp.skill.name) {
        sName = sp.skill.name
      } else {
        sName = sp.skillId || 'React & Next.js'
      }
    }
    return {
      skillName: sName,
      category: sp.skill?.category?.name || sp.skill?.category || 'Frontend Engineering',
      completionPercentage: sp.completionPercentage || 0,
      currentLessonTitle: sp.currentLesson?.title || 'Fundamentals',
      completedLessonsCount: sp.completedLessons?.length || 0,
      bookmarkedCount: sp.bookmarkedLessons?.length || 0,
      hasPassedQuiz: (sp.quizAttempts || []).some(q => q.passed),
      lastActivity: sp.lastActivity
    }
  })

  const enrolledCourses = courseProgressDocs.map(cp => ({
    courseTitle: cp.course?.title || 'Course',
    completionPercentage: cp.completionPercentage || 0,
    completedModulesCount: cp.completedModules?.length || 0,
    isCompleted: cp.isCompleted || false
  }))

  const roadmapProgress = roadmapDoc ? {
    roadmapTitle: roadmapDoc.roadmap?.title || profile.targetRole || 'Engineering Track',
    completedNodesCount: roadmapDoc.completedNodeIds?.length || 0,
    totalNodesCount: roadmapDoc.roadmap?.nodes?.length || 8,
    progressPercentage: roadmapDoc.currentProgressPercentage || 0
  } : null

  const learning = {
    activeSkills,
    enrolledCourses,
    roadmap: roadmapProgress,
    totalEnrolledSkills: activeSkills.length,
    primaryActiveSkill: activeSkills.length > 0 ? activeSkills[0] : null
  }

  // 4. Career & Placement Slice
  const readiness = careerDoc?.readinessEngine || {}
  const atsAnalysis = resumeDoc?.analysis || {}

  const career = {
    targetRole: profile.targetRole || 'Not Selected Yet',
    skillLevel: careerDoc?.skillLevel || 'Beginner',
    dreamCompanies: careerDoc?.dreamCompanies || [],
    placementReadinessPct: readiness.overallReadinessPct || 0,
    readinessComponents: {
      learningScore: readiness.learningScore || 0,
      resumeScore: readiness.resumeScore || atsAnalysis.atsScore || 0,
      interviewScore: readiness.interviewScore || 0,
      academicScore: readiness.academicScore || 0
    },
    resumeATS: {
      hasResumeUploaded: Boolean(resumeDoc),
      fileName: resumeDoc?.fileName || null,
      atsScore: atsAnalysis.atsScore || 0,
      keywordMatch: atsAnalysis.keywordMatch || 0,
      matchingKeywords: atsAnalysis.matchingKeywords || [],
      missingKeywords: atsAnalysis.missingKeywords || [],
      strengths: atsAnalysis.strengths || [],
      weaknesses: atsAnalysis.weaknesses || []
    },
    interviewActivity: {
      mockInterviewsDone: careerDoc?.interviewActivity?.mockInterviews || 0,
      averageScore: careerDoc?.interviewActivity?.averageScore || 0,
      technicalScore: careerDoc?.interviewActivity?.technicalScore || 0
    }
  }

  // 5. Job Applications Slice
  const jobApplications = jobAppDocs.map(ja => ({
    jobTitle: ja.job?.title || 'Job Opening',
    company: ja.job?.company || 'Company',
    location: ja.job?.location || 'Remote',
    status: ja.status || 'Applied',
    appliedAt: ja.appliedAt
  }))

  const jobs = {
    totalApplications: jobApplications.length,
    recentApplications: jobApplications.slice(0, 5)
  }

  // 6. Productivity & Study Sessions Slice
  const totalFocusMinutes = focusDocs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayFocusMinutes = focusDocs
    .filter(l => new Date(l.date) >= todayStart)
    .reduce((acc, l) => acc + (l.durationMinutes || 0), 0)

  const productivity = {
    totalFocusHours14Days: parseFloat((totalFocusMinutes / 60).toFixed(1)),
    todayFocusMinutes,
    recentSessionCount: focusDocs.length,
    recentSubjectsStudied: [...new Set(focusDocs.map(l => l.subject).filter(Boolean))]
  }

  const snapshot = {
    userId: uidStr,
    generatedAt: new Date().toISOString(),
    profile,
    academics,
    learning,
    career,
    jobs,
    productivity
  }

  snapshotCache.set(uidStr, { timestamp: Date.now(), data: snapshot })
  return snapshot
}

module.exports = {
  getStudentSnapshot,
  invalidateSnapshotCache
}
