const mongoose = require('mongoose')
const AcademicRecord = require('../../models/AcademicRecord')
const CareerProfile = require('../../models/CareerProfile')
const Skill = require('../../models/Skill')
const Lesson = require('../../models/Lesson')
const UserSkillProgress = require('../../models/UserSkillProgress')
const Course = require('../../models/Course')
const CourseProgress = require('../../models/CourseProgress')
const JobListing = require('../../models/JobListing')
const JobApplication = require('../../models/JobApplication')
const SavedJob = require('../../models/SavedJob')
const FollowedCompany = require('../../models/FollowedCompany')
const FocusLog = require('../../models/FocusLog')
const TutorConversation = require('../../models/TutorConversation')
const StudentProfile = require('../../models/StudentProfile')
const User = require('../../models/User')

/**
 * Escapes regex special characters to prevent ReDoS / injection
 */
const escapeRegex = (str) => {
  if (!str || typeof str !== 'string') return ''
  return str.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Academic & Tech Acronym Dictionary for intelligent query expansion
 */
const ACRONYMS = {
  dbms: 'database management system',
  os: 'operating system',
  dsa: 'data structure',
  cn: 'computer network',
  oops: 'object oriented programming',
  ai: 'artificial intelligence',
  ml: 'machine learning',
  dl: 'deep learning',
  nlp: 'natural language processing',
  cd: 'compiler design',
  coa: 'computer organization',
  toc: 'theory of computation',
  wt: 'web technology',
  se: 'software engineering',
  daa: 'design and analysis of algorithms'
}

/**
 * Checks if query matches target string directly or via acronym expansion
 */
const matchesQueryOrAcronym = (target, queryRegex, cleanQueryLower) => {
  if (!target || typeof target !== 'string') return false
  if (queryRegex.test(target)) return true

  const targetLower = target.toLowerCase()
  // Check if query is an acronym for target
  if (ACRONYMS[cleanQueryLower] && targetLower.includes(ACRONYMS[cleanQueryLower])) {
    return true
  }

  // Check if target words form the acronym
  const targetWords = targetLower.split(/[\s_-]+/).filter(Boolean)
  const targetAcronym = targetWords.map(w => w[0]).join('')
  if (targetAcronym.includes(cleanQueryLower)) {
    return true
  }

  return false
}

/**
 * Static canonical page registry for fallback navigation matching
 */
const CANONICAL_PAGES = [
  { id: 'page-dash', title: 'Dashboard', subtitle: 'Student Overview & Metrics', module: 'dashboard', route: '/dashboard', icon: '🏠', keywords: ['home', 'overview', 'dashboard', 'summary', 'hub', 'feed'] },
  { id: 'page-acad', title: 'Academics', subtitle: 'Academic Overview & Semesters', module: 'academics', route: '/academics', icon: '🎓', keywords: ['academics', 'grades', 'gpa', 'cgpa', 'sgpa', 'semesters', 'marks'] },
  { id: 'page-acad-sub', title: 'My Subjects', subtitle: 'Curriculum & Subject Performance', module: 'academics', route: '/academics/subjects', icon: '📚', keywords: ['subjects', 'courses', 'classes', 'syllabus', 'credits', 'faculty'] },
  { id: 'page-acad-trans', title: 'Academic Transcript', subtitle: 'Semester Records & Grade Memos', module: 'academics', route: '/academics/transcript', icon: '📄', keywords: ['transcript', 'memo', 'marksheet', 'grade card', 'results'] },
  { id: 'page-acad-perf', title: 'Academic Analytics', subtitle: 'CGPA Trends & Weak Area Insights', module: 'academics', route: '/academics/performance', icon: '📈', keywords: ['analytics', 'performance', 'weak subjects', 'trends', 'predicted cgpa', 'target cgpa'] },
  { id: 'page-acad-ai', title: 'Academic AI Copilot', subtitle: 'Study Plan & Grade Prediction Assistant', module: 'academics', route: '/academics/ai', icon: '🤖', keywords: ['copilot', 'ai assistant', 'study plan', 'grade prediction', 'academic advice'] },
  { id: 'page-career', title: 'Careers Hub', subtitle: 'Career Journey & Placement Hub', module: 'careers', route: '/careers', icon: '💼', keywords: ['careers', 'career', 'jobs', 'placement', 'target role', 'career goal'] },
  { id: 'page-career-learn', title: 'Career Learning Roadmap', subtitle: 'Skill Milestones & Learning Path', module: 'careers', route: '/careers/learning', icon: '🗺️', keywords: ['roadmap', 'milestones', 'learning path', 'career roadmap', 'curriculum'] },
  { id: 'page-career-res', title: 'Resume & ATS Optimizer', subtitle: 'ATS Score, Analysis & Improvements', module: 'careers', route: '/careers/resume', icon: '📝', keywords: ['resume', 'ats', 'cv', 'ats score', 'resume analysis', 'resume builder'] },
  { id: 'page-career-jobs', title: 'Career Role Matching', subtitle: 'Role Requirements & Matched Openings', module: 'careers', route: '/careers/jobs', icon: '🎯', keywords: ['career jobs', 'matched jobs', 'role matching', 'target jobs'] },
  { id: 'page-career-int', title: 'Mock Interview Simulator', subtitle: 'AI Coding & System Design Interviews', module: 'careers', route: '/careers/interview', icon: '🎙️', keywords: ['interview', 'mock interview', 'coding interview', 'system design', 'technical interview'] },
  { id: 'page-skills', title: 'Skills Lab', subtitle: 'Interactive Modules & Verifications', module: 'skills', route: '/skills', icon: '⚡', keywords: ['skills', 'skill lab', 'programming', 'languages', 'technologies', 'certifications'] },
  { id: 'page-courses', title: 'Courses Catalog', subtitle: 'Full Curriculum & Structured Courses', module: 'courses', route: '/courses', icon: '📖', keywords: ['courses', 'course catalog', 'enrolled courses', 'lessons', 'modules'] },
  { id: 'page-jobs', title: 'Job Openings', subtitle: 'Explore Live Opportunities', module: 'jobs', route: '/jobs/listings', icon: '🏢', keywords: ['jobs', 'job openings', 'hiring', 'internships', 'fresher jobs', 'vacancies'] },
  { id: 'page-jobs-saved', title: 'Saved Jobs', subtitle: 'Bookmarked Opportunities', module: 'jobs', route: '/jobs/saved', icon: '⭐', keywords: ['saved jobs', 'bookmarks', 'saved', 'favorites'] },
  { id: 'page-jobs-app', title: 'My Job Applications', subtitle: 'Application Tracking & Status', module: 'jobs', route: '/jobs/applications', icon: '📬', keywords: ['applications', 'applied jobs', 'application status', 'tracking'] },
  { id: 'page-jobs-alerts', title: 'Job Alerts', subtitle: 'Custom Role & Skill Notifications', module: 'jobs', route: '/jobs/alerts', icon: '🔔', keywords: ['job alerts', 'notifications', 'job notifications'] },
  { id: 'page-jobs-ana', title: 'Application Analytics', subtitle: 'Conversion Funnel & Insights', module: 'jobs', route: '/jobs/analytics', icon: '📊', keywords: ['application analytics', 'response rate', 'job stats'] },
  { id: 'page-jobs-foll', title: 'Followed Companies', subtitle: 'Track Company Updates & Drives', module: 'jobs', route: '/jobs/following', icon: '🏛️', keywords: ['following', 'followed companies', 'companies'] },
  { id: 'page-prod', title: 'Productivity & Focus Hub', subtitle: 'Study Timer, Logs & Health Score', module: 'productivity', route: '/productivity', icon: '⏱️', keywords: ['productivity', 'focus', 'timer', 'pomodoro', 'study time', 'health', 'focus sessions'] },
  { id: 'page-ai-tutor', title: 'AI Tutor', subtitle: 'Personalized 24/7 AI Learning Assistant', module: 'ai-tutor', route: '/ai-tutor', icon: '🤖', keywords: ['tutor', 'ai tutor', 'chat', 'ask', 'ai help', 'doubt solving'] },
  { id: 'page-profile', title: 'Student Profile', subtitle: 'Personal Info, Academic & Coding Profiles', module: 'profile', route: '/profile', icon: '👤', keywords: ['profile', 'settings', 'account', 'student info', 'portfolio'] }
]

/**
 * Detects domain intent keywords from query string
 */
const detectIntents = (q) => {
  const query = q.toLowerCase()
  const intents = new Set()

  if (/\b(cgpa|sgpa|gpa|marks|subject|subjects|semester|sem|transcript|memo|grade|passed|failed|exam|academics|curriculum|syllabus|dbms|os|dsa|oops|cn|math|physics|chemistry)\b/i.test(query)) {
    intents.add('academics')
  }
  if (/\b(career|goal|target role|roles|company|companies|dream|roadmap|milestone|ats|resume|cv|interview|mock|readiness|placement)\b/i.test(query)) {
    intents.add('careers')
  }
  if (/\b(skill|skills|learn|lesson|lessons|topic|verification|verify|practice|exercise|react|node|javascript|python|java|c\+\+|docker|kubernetes|aws|sql|mongo)\b/i.test(query)) {
    intents.add('skills')
  }
  if (/\b(course|courses|enrolled|module|modules|video|notes|quiz|assignment|project|certification|certificate)\b/i.test(query)) {
    intents.add('courses')
  }
  if (/\b(job|jobs|hiring|opening|openings|applied|application|applications|saved|bookmark|salary|lpa|fresher|intern|internship|remote|bangalore|hyderabad|pune|google|microsoft|amazon|razorpay)\b/i.test(query)) {
    intents.add('jobs')
  }
  if (/\b(study|studied|focus|timer|session|sessions|pomodoro|productivity|duration|hours|minutes|streak|health|coach)\b/i.test(query)) {
    intents.add('productivity')
  }
  if (/\b(tutor|ai|chat|conversation|ask|message|doubt|explain|assistant)\b/i.test(query)) {
    intents.add('ai-tutor')
  }
  if (/\b(profile|bio|account|email|phone|college|branch|roll|github|leetcode|linkedin)\b/i.test(query)) {
    intents.add('profile')
  }

  return intents
}

/**
 * Main contextual search executor
 */
const executeSearch = async ({ userId, query, context = 'dashboard', limit = 15 }) => {
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return { query: query || '', context, totalResults: 0, results: [] }
  }

  const cleanQuery = query.trim()
  const cleanQueryLower = cleanQuery.toLowerCase()
  const escaped = escapeRegex(cleanQuery)
  const regex = new RegExp(escaped, 'i')
  const intents = detectIntents(cleanQuery)

  // Determine active domains to search
  const normalizedContext = context ? context.toLowerCase().replace(/^\//, '') : 'dashboard'
  const primaryDomain = normalizedContext.split('/')[0] || 'dashboard'

  const results = []

  // 1. ACADEMIC DOMAIN SEARCH (Strictly Scoped by req.user._id)
  const searchAcademics = async () => {
    try {
      const record = await AcademicRecord.findOne({ user: userId }).lean()
      if (!record) return

      const cgpaValue = record.currentCGPA !== undefined && record.currentCGPA !== null
        ? record.currentCGPA
        : (record.cgpa !== undefined && record.cgpa !== null ? record.cgpa : null)

      // Search overall metrics if matched
      if (regex.test('CGPA') || regex.test('Overall Grade') || regex.test('Academic Performance') || regex.test('Target') || regex.test('Predicted') || regex.test('GPA') || cleanQueryLower.includes('cgpa') || cleanQueryLower.includes('gpa')) {
        if (cgpaValue !== null) {
          results.push({
            id: `acad-cgpa-${record._id}`,
            type: 'academic_metric',
            title: `Current CGPA: ${Number(cgpaValue).toFixed(2)}`,
            subtitle: `Target: ${record.targetCGPA || '9.0'} • Predicted: ${record.predictedCGPA || 'N/A'}`,
            module: 'academics',
            route: '/academics/performance',
            entityType: 'metric',
            metadata: { cgpa: cgpaValue, targetCGPA: record.targetCGPA, predictedCGPA: record.predictedCGPA },
            score: primaryDomain === 'academics' ? 100 : 75
          })
        }
      }

      // Search weak subjects
      if (Array.isArray(record.weakSubjects) && record.weakSubjects.length > 0) {
        if (regex.test('weak') || regex.test('improvement') || record.weakSubjects.some(s => matchesQueryOrAcronym(s, regex, cleanQueryLower))) {
          const matchedWeak = record.weakSubjects.filter(s => matchesQueryOrAcronym(s, regex, cleanQueryLower))
          const label = matchedWeak.length ? matchedWeak.join(', ') : record.weakSubjects.join(', ')
          results.push({
            id: `acad-weak-${record._id}`,
            type: 'academic_weak_subject',
            title: `Weak Subjects: ${label}`,
            subtitle: `${record.weakSubjects.length} subjects recommended for revision`,
            module: 'academics',
            route: '/academics/performance',
            entityType: 'insight',
            metadata: { weakSubjects: record.weakSubjects },
            score: primaryDomain === 'academics' ? 95 : 65
          })
        }
      }

      // Search semesters
      if (Array.isArray(record.semesters)) {
        for (const sem of record.semesters) {
          const semName = `Semester ${sem.semesterNumber}`
          const isSemMatch = regex.test(semName) || regex.test(`Sem ${sem.semesterNumber}`) || regex.test(`S${sem.semesterNumber}`)

          if (isSemMatch) {
            results.push({
              id: `acad-sem-${sem._id || sem.semesterNumber}`,
              type: 'academic_semester',
              title: semName,
              subtitle: `SGPA: ${sem.sgpa ? Number(sem.sgpa).toFixed(2) : 'N/A'} • ${sem.subjects?.length || 0} Subjects`,
              module: 'academics',
              route: '/academics/transcript',
              entityType: 'semester',
              metadata: { semesterNumber: sem.semesterNumber, sgpa: sem.sgpa },
              score: primaryDomain === 'academics' ? 90 : 60
            })
          }

          // Search subjects inside semester
          if (Array.isArray(sem.subjects)) {
            for (const sub of sem.subjects) {
              const nameMatch = matchesQueryOrAcronym(sub.name, regex, cleanQueryLower)
              const codeMatch = sub.code && matchesQueryOrAcronym(sub.code, regex, cleanQueryLower)
              const gradeMatch = sub.grade && regex.test(`Grade ${sub.grade}`)

              if (nameMatch || codeMatch || gradeMatch) {
                results.push({
                  id: `acad-sub-${sub._id || `${sem.semesterNumber}-${sub.name}`}`,
                  type: 'academic_subject',
                  title: sub.name,
                  subtitle: `${semName} • ${sub.code ? `${sub.code} • ` : ''}Grade: ${sub.grade || sub.finalGrade || 'A'} (${sub.status || 'PASSED'})`,
                  module: 'academics',
                  route: '/academics/subjects',
                  entityType: 'subject',
                  metadata: { semesterNumber: sem.semesterNumber, subjectName: sub.name, code: sub.code, grade: sub.grade || sub.finalGrade, credits: sub.credits },
                  score: primaryDomain === 'academics' ? 95 : 70
                })
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Search Academics Error:', e)
    }
  }

  // 2. CAREERS DOMAIN SEARCH (Strictly Scoped by req.user._id)
  const searchCareers = async () => {
    try {
      const profile = await CareerProfile.findOne({ user: userId }).lean()
      if (!profile) return

      const goal = profile.careerGoal || {}
      const targetCareer = goal.targetCareer || ''
      const isCareerMatch = targetCareer && matchesQueryOrAcronym(targetCareer, regex, cleanQueryLower)
      const isCategoryMatch = goal.category && regex.test(goal.category)
      const isGeneralCareerMatch = regex.test('career') || regex.test('placement') || regex.test('goal') || regex.test('readiness')

      if (isCareerMatch || isCategoryMatch || isGeneralCareerMatch) {
        if (targetCareer) {
          results.push({
            id: `career-goal-${profile._id}`,
            type: 'career_goal',
            title: `Career Goal: ${targetCareer}`,
            subtitle: `Status: ${goal.status || 'Learning'} • Readiness: ${profile.readinessEngine?.overallReadinessPct || 0}%`,
            module: 'careers',
            route: '/careers',
            entityType: 'goal',
            metadata: { targetCareer, status: goal.status, overallReadiness: profile.readinessEngine?.overallReadinessPct },
            score: primaryDomain === 'careers' ? 95 : 75
          })
        }
      }

      // Dream companies
      if (Array.isArray(profile.dreamCompanies)) {
        for (const company of profile.dreamCompanies) {
          if (regex.test(company) || regex.test('dream company') || regex.test('target company')) {
            results.push({
              id: `career-dream-${encodeURIComponent(company)}`,
              type: 'career_company',
              title: `Dream Company: ${company}`,
              subtitle: `Tracked in your Career Profile target list`,
              module: 'careers',
              route: `/companies/${encodeURIComponent(company)}`,
              entityType: 'company',
              metadata: { companyName: company },
              score: primaryDomain === 'careers' ? 90 : 65
            })
          }
        }
      }

      // Resume / ATS
      const resume = profile.resumeSummary || {}
      if (regex.test('resume') || regex.test('ats') || regex.test('cv') || regex.test('score')) {
        results.push({
          id: `career-resume-${profile._id}`,
          type: 'career_resume',
          title: `Resume ATS Score: ${resume.atsScore || 0}/100`,
          subtitle: `Status: ${resume.resumeStatus || 'Ready'} • Version: ${resume.resumeVersion || 'v1.0'}`,
          module: 'careers',
          route: '/careers/resume',
          entityType: 'resume',
          metadata: { atsScore: resume.atsScore, status: resume.resumeStatus },
          score: primaryDomain === 'careers' ? 95 : 70
        })
      }

      // Roadmap Progress
      const learning = profile.learningProgress || {}
      if (regex.test('roadmap') || regex.test('milestone') || (learning.currentRoadmap && regex.test(learning.currentRoadmap))) {
        results.push({
          id: `career-roadmap-${profile._id}`,
          type: 'career_roadmap',
          title: `Learning Roadmap: ${learning.currentRoadmap || targetCareer || 'Skill Track'}`,
          subtitle: `Stage: ${learning.currentStage || 'In Progress'} • ${learning.learningProgressPct || 0}% Complete`,
          module: 'careers',
          route: '/careers/learning',
          entityType: 'roadmap',
          metadata: { roadmap: learning.currentRoadmap, stage: learning.currentStage, progress: learning.learningProgressPct },
          score: primaryDomain === 'careers' ? 90 : 65
        })
      }

      // Interview Simulator
      const interview = profile.interviewActivity || {}
      if (regex.test('interview') || regex.test('mock') || regex.test('technical') || regex.test('system design')) {
        results.push({
          id: `career-interview-${profile._id}`,
          type: 'career_interview',
          title: `Mock Interview Preparation`,
          subtitle: `Interviews Taken: ${interview.mockInterviews || 0} • Avg Score: ${interview.averageScore || 0}%`,
          module: 'careers',
          route: '/careers/interview',
          entityType: 'interview',
          metadata: { mockInterviews: interview.mockInterviews, averageScore: interview.averageScore },
          score: primaryDomain === 'careers' ? 90 : 60
        })
      }
    } catch (e) {
      console.error('Search Careers Error:', e)
    }
  }

  // 3. SKILLS DOMAIN SEARCH (Public Catalog + User Progress Scoped)
  const searchSkills = async () => {
    try {
      const [skills, userProgressList] = await Promise.all([
        Skill.find({
          isPublished: true,
          $or: [
            { name: regex },
            { slug: regex },
            { tags: regex },
            { description: regex },
            { difficulty: regex }
          ]
        }).limit(8).lean(),
        UserSkillProgress.find({ user: userId }).lean()
      ])

      const progressMap = new Map()
      userProgressList.forEach(p => {
        const skillKey = p.skill ? String(p.skill) : p.skillName
        if (skillKey) progressMap.set(skillKey, p)
        if (p.skillName) progressMap.set(p.skillName.toLowerCase(), p)
      })

      for (const skill of skills) {
        const userProgress = progressMap.get(String(skill._id)) || progressMap.get(skill.name.toLowerCase())
        const progressPct = userProgress ? userProgress.completionPercentage : 0
        const subtitle = userProgress
          ? `Progress: ${progressPct}% • ${userProgress.completedLessons?.length || 0} Lessons Completed`
          : `${skill.difficulty || 'Intermediate'} • ${skill.estimatedHours || 10} hrs • ${skill.tags?.slice(0, 3).join(', ') || 'Practical Skill'}`

        results.push({
          id: `skill-${skill._id}`,
          type: 'skill_item',
          title: `Skill: ${skill.name}`,
          subtitle,
          module: 'skills',
          route: `/skills/${skill.slug || skill._id}`,
          entityType: 'skill',
          metadata: { skillId: skill._id, slug: skill.slug, name: skill.name, progress: progressPct, difficulty: skill.difficulty },
          score: primaryDomain === 'skills' ? 95 : (userProgress ? 85 : 70)
        })
      }

      // Also search Lessons matching the query
      const lessons = await Lesson.find({
        $or: [
          { title: regex },
          { description: regex },
          { whatYouWillLearn: regex },
          { coreConcepts: regex }
        ]
      }).limit(5).populate('skill').lean()

      for (const les of lessons) {
        const parentSkill = les.skill
        if (parentSkill) {
          results.push({
            id: `lesson-${les._id}`,
            type: 'skill_lesson',
            title: `Lesson ${les.lessonNumber || ''}: ${les.title}`,
            subtitle: `Skill: ${parentSkill.name} • ${les.estimatedMinutes || 30} mins`,
            module: 'skills',
            route: `/skills/${parentSkill.slug || parentSkill._id}?lesson=${les._id}`,
            entityType: 'lesson',
            metadata: { lessonId: les._id, skillSlug: parentSkill.slug, skillId: parentSkill._id },
            score: primaryDomain === 'skills' ? 90 : 65
          })
        }
      }
    } catch (e) {
      console.error('Search Skills Error:', e)
    }
  }

  // 4. COURSES DOMAIN SEARCH (Public Catalog + User Progress Scoped)
  const searchCourses = async () => {
    try {
      const [courses, userProgressList] = await Promise.all([
        Course.find({
          $or: [
            { title: regex },
            { slug: regex },
            { technology: regex },
            { technologies: regex },
            { category: regex },
            { instructor: regex },
            { careerRoles: regex },
            { tags: regex },
            { 'modules.title': regex }
          ]
        }).limit(8).lean(),
        CourseProgress.find({ user: userId }).lean()
      ])

      const progressMap = new Map()
      userProgressList.forEach(p => {
        if (p.course) progressMap.set(String(p.course), p)
      })

      for (const course of courses) {
        const userProgress = progressMap.get(String(course._id))
        const progressPct = userProgress ? userProgress.completionPercentage : 0
        const subtitle = userProgress
          ? `Enrolled: ${progressPct}% Complete • ${course.modules?.length || 0} Modules`
          : `${course.category || 'Engineering'} • By ${course.instructor || 'ZenScore Faculty'} • ${course.estimatedHours || '12 hrs'}`

        results.push({
          id: `course-${course._id}`,
          type: 'course_item',
          title: `Course: ${course.title}`,
          subtitle,
          module: 'courses',
          route: `/courses/${course.slug || course._id}`,
          entityType: 'course',
          metadata: { courseId: course._id, slug: course.slug, title: course.title, enrolled: !!userProgress, progress: progressPct },
          score: primaryDomain === 'courses' ? 95 : (userProgress ? 85 : 70)
        })

        // Also check if specific modules in this course matched
        if (Array.isArray(course.modules)) {
          for (const mod of course.modules) {
            if (mod.title && regex.test(mod.title)) {
              results.push({
                id: `course-mod-${course._id}-${mod.moduleNumber}`,
                type: 'course_module',
                title: `Module ${mod.moduleNumber}: ${mod.title}`,
                subtitle: `Course: ${course.title} • ${mod.estimatedTime || '1h 30m'}`,
                module: 'courses',
                route: `/courses/${course.slug || course._id}`,
                entityType: 'module',
                metadata: { courseId: course._id, courseSlug: course.slug, moduleNumber: mod.moduleNumber },
                score: primaryDomain === 'courses' ? 90 : 65
              })
            }
          }
        }
      }
    } catch (e) {
      console.error('Search Courses Error:', e)
    }
  }

  // 5. JOBS DOMAIN SEARCH (Public Listings + User Applications & Saved Scoped)
  const searchJobs = async () => {
    try {
      // User's applied jobs (strictly scoped by req.user._id)
      const applications = await JobApplication.find({ user: userId })
        .populate('job')
        .limit(6)
        .lean()

      for (const app of applications) {
        if (!app.job) continue
        const job = app.job
        if (regex.test(job.title) || regex.test(job.company) || regex.test(app.status) || regex.test('applied') || regex.test('applications')) {
          results.push({
            id: `job-app-${app._id}`,
            type: 'job_application',
            title: `Application: ${job.title} at ${job.company}`,
            subtitle: `Status: ${app.status} • Applied on ${new Date(app.appliedAt).toLocaleDateString()}`,
            module: 'jobs',
            route: '/jobs/applications',
            entityType: 'application',
            metadata: { applicationId: app._id, jobId: job._id, company: job.company, status: app.status },
            score: primaryDomain === 'jobs' ? 95 : 80
          })
        }
      }

      // User's saved jobs (strictly scoped by req.user._id)
      const savedJobs = await SavedJob.find({ user: userId })
        .populate('job')
        .limit(6)
        .lean()

      for (const saved of savedJobs) {
        if (!saved.job) continue
        const job = saved.job
        if (regex.test(job.title) || regex.test(job.company) || regex.test('saved') || regex.test('bookmark')) {
          results.push({
            id: `job-saved-${saved._id}`,
            type: 'job_saved',
            title: `Saved Job: ${job.title} at ${job.company}`,
            subtitle: `${job.location || 'Remote'} • ${job.salary || 'Competitive'}`,
            module: 'jobs',
            route: '/jobs/saved',
            entityType: 'saved_job',
            metadata: { savedId: saved._id, jobId: job._id, company: job.company },
            score: primaryDomain === 'jobs' ? 90 : 75
          })
        }
      }

      // Public Job Listings
      const publicJobs = await JobListing.find({
        isActive: true,
        $or: [
          { title: regex },
          { company: regex },
          { requiredSkills: regex },
          { location: regex },
          { category: regex }
        ]
      }).limit(8).lean()

      for (const job of publicJobs) {
        results.push({
          id: `job-listing-${job._id}`,
          type: 'job_listing',
          title: `${job.title} • ${job.company}`,
          subtitle: `${job.location || 'Remote'} • ${job.workMode || 'Full-Time'} • ${job.salary || 'Salary Disclosed'}`,
          module: 'jobs',
          route: `/jobs/listings?search=${encodeURIComponent(job.title)}`,
          entityType: 'job',
          metadata: { jobId: job._id, title: job.title, company: job.company, location: job.location, salary: job.salary },
          score: primaryDomain === 'jobs' ? 88 : 65
        })
      }

      // Followed companies (strictly scoped by req.user._id)
      const followed = await FollowedCompany.find({ user: userId }).lean()
      for (const f of followed) {
        if (regex.test(f.companyName) || regex.test('following') || regex.test('company')) {
          results.push({
            id: `company-foll-${encodeURIComponent(f.companyName)}`,
            type: 'company_profile',
            title: `Company: ${f.companyName}`,
            subtitle: `Followed Company • View open jobs & campus drives`,
            module: 'jobs',
            route: `/companies/${encodeURIComponent(f.companyName)}`,
            entityType: 'company',
            metadata: { companyName: f.companyName },
            score: primaryDomain === 'jobs' ? 85 : 60
          })
        }
      }
    } catch (e) {
      console.error('Search Jobs Error:', e)
    }
  }

  // 6. PRODUCTIVITY DOMAIN SEARCH (Strictly Scoped by req.user._id)
  const searchProductivity = async () => {
    try {
      const logs = await FocusLog.find({
        user: userId,
        $or: [
          { subject: regex },
          { notes: regex },
          { category: regex }
        ]
      }).sort({ date: -1 }).limit(6).lean()

      for (const log of logs) {
        results.push({
          id: `focus-log-${log._id}`,
          type: 'focus_session',
          title: `Focus Session: ${log.subject}`,
          subtitle: `${log.durationMinutes} mins • Category: ${log.category || 'Study'} • ${new Date(log.date).toLocaleDateString()}`,
          module: 'productivity',
          route: '/productivity',
          entityType: 'focus_log',
          metadata: { logId: log._id, duration: log.durationMinutes, subject: log.subject, date: log.date },
          score: primaryDomain === 'productivity' ? 95 : 65
        })
      }

      // General productivity keywords
      if (regex.test('timer') || regex.test('pomodoro') || regex.test('productivity') || regex.test('focus') || regex.test('study time') || regex.test('health score') || regex.test('coach')) {
        results.push({
          id: `prod-hub-${userId}`,
          type: 'productivity_hub',
          title: `Productivity & Focus Dashboard`,
          subtitle: `Launch smart focus timer, check weekly streak & AI coach recommendations`,
          module: 'productivity',
          route: '/productivity',
          entityType: 'hub',
          metadata: {},
          score: primaryDomain === 'productivity' ? 90 : 60
        })
      }
    } catch (e) {
      console.error('Search Productivity Error:', e)
    }
  }

  // 7. AI TUTOR DOMAIN SEARCH (Strictly Scoped by req.user._id)
  const searchAITutor = async () => {
    try {
      const conversations = await TutorConversation.find({
        user: userId,
        $or: [
          { title: regex },
          { 'messages.content': regex }
        ]
      }).sort({ updatedAt: -1 }).limit(5).lean()

      for (const conv of conversations) {
        results.push({
          id: `tutor-chat-${conv._id}`,
          type: 'tutor_conversation',
          title: `Tutor Chat: ${conv.title || 'AI Discussion'}`,
          subtitle: `${conv.messages?.length || 0} messages • Last active ${new Date(conv.updatedAt || Date.now()).toLocaleDateString()}`,
          module: 'ai-tutor',
          route: '/ai-tutor',
          entityType: 'conversation',
          metadata: { conversationId: conv._id, title: conv.title },
          score: primaryDomain === 'ai-tutor' ? 95 : 65
        })
      }

      if (regex.test('tutor') || regex.test('ai') || regex.test('ask tutor') || regex.test('doubt')) {
        results.push({
          id: `tutor-main-${userId}`,
          type: 'tutor_main',
          title: `Ask AI Tutor`,
          subtitle: `Get instant 24/7 conceptual explanations, code debugging & problem solving`,
          module: 'ai-tutor',
          route: '/ai-tutor',
          entityType: 'action',
          metadata: {},
          score: primaryDomain === 'ai-tutor' ? 90 : 60
        })
      }
    } catch (e) {
      console.error('Search AI Tutor Error:', e)
    }
  }

  // 8. STUDENT PROFILE & USER DOMAIN SEARCH (Strictly Scoped by req.user._id)
  const searchProfile = async () => {
    try {
      const [profile, user] = await Promise.all([
        StudentProfile.findOne({ user: userId }).lean(),
        User.findById(userId).lean()
      ])

      const name = user?.displayName || user?.name || ''
      const email = user?.email || ''
      const college = profile?.education?.collegeName || profile?.college || ''
      const branch = profile?.education?.branch || profile?.branch || ''

      const isMatch = (name && regex.test(name)) || (email && regex.test(email)) || (college && regex.test(college)) || (branch && regex.test(branch)) || regex.test('profile') || regex.test('portfolio')

      if (isMatch) {
        results.push({
          id: `profile-${userId}`,
          type: 'student_profile',
          title: name ? `Student Profile: ${name}` : 'Student Profile & Portfolio',
          subtitle: `${branch ? `${branch} • ` : ''}${college || email}`,
          module: 'profile',
          route: '/profile',
          entityType: 'profile',
          metadata: { name, email, college, branch },
          score: primaryDomain === 'profile' ? 95 : 60
        })
      }
    } catch (e) {
      console.error('Search Profile Error:', e)
    }
  }

  // 9. CANONICAL PAGE MATCHING
  const searchCanonicalPages = () => {
    for (const page of CANONICAL_PAGES) {
      const isTitleMatch = regex.test(page.title)
      const isSubMatch = regex.test(page.subtitle)
      const isKeywordMatch = page.keywords.some(k => regex.test(k))

      if (isTitleMatch || isSubMatch || isKeywordMatch) {
        results.push({
          id: page.id,
          type: 'navigation_page',
          title: page.title,
          subtitle: page.subtitle,
          module: page.module,
          route: page.route,
          entityType: 'page',
          metadata: { icon: page.icon },
          score: page.module === primaryDomain ? 80 : 50
        })
      }
    }
  }

  // DISPATCH SEARCH DOMAINS BASED ON CONTEXT + INTENT
  const searchPromises = []

  // Always check pages
  searchCanonicalPages()

  if (primaryDomain === 'academics' || intents.has('academics') || primaryDomain === 'dashboard') {
    searchPromises.push(searchAcademics())
  }
  if (primaryDomain === 'careers' || intents.has('careers') || primaryDomain === 'dashboard') {
    searchPromises.push(searchCareers())
  }
  if (primaryDomain === 'skills' || intents.has('skills') || primaryDomain === 'dashboard') {
    searchPromises.push(searchSkills())
  }
  if (primaryDomain === 'courses' || intents.has('courses') || primaryDomain === 'dashboard') {
    searchPromises.push(searchCourses())
  }
  if (primaryDomain === 'jobs' || intents.has('jobs') || primaryDomain === 'dashboard') {
    searchPromises.push(searchJobs())
  }
  if (primaryDomain === 'productivity' || intents.has('productivity') || primaryDomain === 'dashboard') {
    searchPromises.push(searchProductivity())
  }
  if (primaryDomain === 'ai-tutor' || intents.has('ai-tutor') || primaryDomain === 'dashboard') {
    searchPromises.push(searchAITutor())
  }
  if (primaryDomain === 'profile' || intents.has('profile') || primaryDomain === 'dashboard') {
    searchPromises.push(searchProfile())
  }

  // Await all parallel domain searches
  await Promise.all(searchPromises)

  // Sort by relevance score (highest first), then deduplicate by id
  const seenIds = new Set()
  const uniqueResults = []

  results.sort((a, b) => (b.score || 0) - (a.score || 0))

  for (const item of results) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id)
      const { score, ...cleanItem } = item
      uniqueResults.push(cleanItem)
    }
  }

  const finalResults = uniqueResults.slice(0, limit)

  return {
    query: cleanQuery,
    context: primaryDomain,
    totalResults: uniqueResults.length,
    results: finalResults
  }
}

module.exports = {
  executeSearch,
  detectIntents,
  escapeRegex,
  CANONICAL_PAGES
}
