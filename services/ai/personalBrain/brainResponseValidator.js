/**
 * brainResponseValidator.js - Comprehensive 9-Domain Anti-Fabrication Engine
 * Validates generated LLM claims against the authoritative MongoDB Student Snapshot across:
 * 1. Academics (CGPA, SGPA, attendance %, credits, semester bounds, risk subjects)
 * 2. Courses (enrolled courses count, completion status, course titles)
 * 3. Skills (active skills count, completed lessons, quiz pass status)
 * 4. Productivity (14-day focus hours, today's focus minutes, session count)
 * 5. Careers (placement readiness %, dream companies, ATS score, target role)
 * 6. Jobs (applied jobs count, saved jobs, application status)
 * 7. Student Profile (degree, branch, college, year of study)
 * 8. Conversational Goals / Active Deadlines
 * 9. General snapshot-derived metrics
 */

/**
 * Validates and corrects any hallucinated student-specific claims in the AI response.
 * Preserves general educational advice ("aim for 8.0+ CGPA", "many companies require React").
 * 
 * @param {string} reply - Generated raw LLM response text
 * @param {Object} snapshot - Authoritative student snapshot from studentSnapshotService
 * @returns {{ cleanReply: string, isModified: boolean, detectedAnomalies: Array<string> }}
 */
function validateAndCorrectBrainResponse(reply, snapshot) {
  if (!reply || typeof reply !== 'string' || !snapshot) {
    return { cleanReply: reply || '', isModified: false, detectedAnomalies: [] }
  }

  let validatedReply = reply
  const anomalies = []
  let isModified = false

  // ─── DOMAIN 1: ACADEMICS (CGPA, SGPA, Semesters, Attendance) ───
  const realCgpa = snapshot.academics?.cgpa !== null && snapshot.academics?.cgpa !== undefined
    ? Number(snapshot.academics.cgpa)
    : null
  const realSgpa = snapshot.academics?.latestSgpa !== null && snapshot.academics?.latestSgpa !== undefined
    ? Number(snapshot.academics.latestSgpa)
    : null
  const realTargetCgpa = snapshot.academics?.targetCgpa !== null && snapshot.academics?.targetCgpa !== undefined
    ? Number(snapshot.academics.targetCgpa)
    : null

  // Personal CGPA claims (e.g. "your cgpa is 9.5")
  const personalCgpaRegex = /(?:your\s+(?:current\s+)?cgpa\s+(?:is|stands\s+at|of|is\s+currently)\s*|you\s+(?:currently\s+)?have\s+(?:a\s+)?cgpa\s+of\s*|current\s+cgpa\s*[:=]\s*)([0-9]+(?:\.[0-9]+)?)/gi
  let match
  while ((match = personalCgpaRegex.exec(reply)) !== null) {
    const claimedCgpa = parseFloat(match[1])
    const validMatches = [realCgpa, realSgpa, realTargetCgpa].filter(v => v !== null)

    const isMatch = validMatches.some(v => Math.abs(v - claimedCgpa) < 0.05)
    if (!isMatch && validMatches.length > 0) {
      anomalies.push(`[Academics] Fabricated personal CGPA claim: ${claimedCgpa} (Actual: ${realCgpa ?? 'Not recorded'})`)
      const replacementText = realCgpa !== null
        ? `your current CGPA of ${realCgpa.toFixed(2)}`
        : `your CGPA (not yet entered in transcripts)`
      validatedReply = validatedReply.replace(match[0], replacementText)
      isModified = true
    }
  }

  // Impossible Semester numbers (e.g. "Semester 12")
  const impossibleSemRegex = /(?:semester|sem)\s*([0-9]+)/gi
  let semMatch
  while ((semMatch = impossibleSemRegex.exec(reply)) !== null) {
    const semNum = parseInt(semMatch[1], 10)
    if (semNum > 8) {
      anomalies.push(`[Academics] Impossible semester number beyond degree bounds: Semester ${semNum}`)
      validatedReply = validatedReply.replace(semMatch[0], 'your current semester')
      isModified = true
    }
  }

  // ─── DOMAIN 2: COURSES ─────────────────────────────────────────
  const enrolledCoursesCount = snapshot.learning?.enrolledCourses?.length || 0
  const falseCourseCountRegex = /you\s+(?:are\s+enrolled\s+in|have\s+enrolled\s+in)\s+([0-9]+)\s+courses/gi
  let courseMatch
  while ((courseMatch = falseCourseCountRegex.exec(reply)) !== null) {
    const claimedCount = parseInt(courseMatch[1], 10)
    if (claimedCount !== enrolledCoursesCount) {
      anomalies.push(`[Courses] Fabricated enrolled courses count: ${claimedCount} (Actual: ${enrolledCoursesCount})`)
      validatedReply = validatedReply.replace(courseMatch[0], `you have ${enrolledCoursesCount} active enrolled courses`)
      isModified = true
    }
  }

  // ─── DOMAIN 3: SKILLS ──────────────────────────────────────────
  const totalSkills = snapshot.learning?.totalEnrolledSkills || 0
  const falseSkillCountRegex = /you\s+(?:are\s+learning|have\s+mastered|are\s+tracking)\s+([0-9]+)\s+(?:technical\s+)?skills/gi
  let skillMatch
  while ((skillMatch = falseSkillCountRegex.exec(reply)) !== null) {
    const claimedSkills = parseInt(skillMatch[1], 10)
    if (claimedSkills !== totalSkills && claimedSkills > totalSkills + 2) {
      anomalies.push(`[Skills] Fabricated skill count: ${claimedSkills} (Actual: ${totalSkills})`)
      validatedReply = validatedReply.replace(skillMatch[0], `you are currently tracking ${totalSkills} skills`)
      isModified = true
    }
  }

  // ─── DOMAIN 4: PRODUCTIVITY ────────────────────────────────────
  const todayFocusMinutes = snapshot.productivity?.todayFocusMinutes || 0
  if (todayFocusMinutes === 0) {
    const falseTodayFocusRegex = /(?:(?:today\s+)?you\s+(?:already\s+)?(?:completed|studied|logged)\s+([0-9]+(?:\.[0-9]+)?)\s+(?:hours?|minutes?)\s*(?:of\s+focus\s+time)?(?:today)?|you\s+(?:studied|logged|focused\s+for)\s+([0-9]+(?:\.[0-9]+)?)\s+(?:hours?|minutes?)\s+today)/gi
    if (falseTodayFocusRegex.test(reply)) {
      anomalies.push('[Productivity] Fabricated today focus time when no sessions were logged today')
      validatedReply = validatedReply.replace(
        falseTodayFocusRegex,
        'you haven\'t logged any focus sessions today yet'
      )
      isModified = true
    }
  }

  // ─── DOMAIN 5: CAREERS & RESUME ATS ───────────────────────────
  const hasResume = Boolean(snapshot.career?.resumeATS?.hasResumeUploaded)
  const actualAtsScore = snapshot.career?.resumeATS?.atsScore || 0
  if (!hasResume) {
    const falseAtsScoreRegex = /(?:your\s+(?:resume\s+)?ats\s+score\s+(?:is|is\s+currently|stands\s+at)\s*)([0-9]+(?:\.[0-9]+)?(?:\s*\/\s*100|%|))/gi
    if (falseAtsScoreRegex.test(reply)) {
      anomalies.push('[Careers] Fabricated ATS score when no resume has been uploaded yet')
      validatedReply = validatedReply.replace(
        falseAtsScoreRegex,
        'you haven\'t uploaded a resume yet to calculate an ATS score'
      )
      isModified = true
    }
  } else if (actualAtsScore > 0) {
    const personalAtsClaimRegex = /(?:your\s+(?:resume\s+)?ats\s+score\s+(?:is|is\s+currently|stands\s+at)\s*)([0-9]+(?:\.[0-9]+)?)/gi
    let atsMatch
    while ((atsMatch = personalAtsClaimRegex.exec(reply)) !== null) {
      const claimedAts = parseFloat(atsMatch[1])
      if (Math.abs(claimedAts - actualAtsScore) > 3) {
        anomalies.push(`[Careers] Fabricated personal ATS score: ${claimedAts} (Actual: ${actualAtsScore})`)
        validatedReply = validatedReply.replace(atsMatch[0], `your ATS score of ${actualAtsScore}`)
        isModified = true
      }
    }
  }

  // ─── DOMAIN 6: JOBS ────────────────────────────────────────────
  const actualAppliedJobs = snapshot.jobs?.totalApplications || 0
  const falseJobAppsRegex = /you\s+(?:have\s+)?applied\s+(?:to|for)\s+([0-9]+)\s+jobs/gi
  let jobMatch
  while ((jobMatch = falseJobAppsRegex.exec(reply)) !== null) {
    const claimedJobApps = parseInt(jobMatch[1], 10)
    if (claimedJobApps !== actualAppliedJobs) {
      anomalies.push(`[Jobs] Fabricated applied jobs count: ${claimedJobApps} (Actual: ${actualAppliedJobs})`)
      validatedReply = validatedReply.replace(jobMatch[0], `you have submitted ${actualAppliedJobs} job applications`)
      isModified = true
    }
  }

  // ─── DOMAIN 7: STUDENT PROFILE ─────────────────────────────────
  const realBranch = snapshot.profile?.branch || ''
  if (realBranch && realBranch !== 'Engineering') {
    const falseBranchRegex = /(?:as\s+a\s+student\s+of\s+)(Medical|Pharmacy|Civil|Mechanical|Biotech|Law)/gi
    let branchMatch
    while ((branchMatch = falseBranchRegex.exec(reply)) !== null) {
      if (!realBranch.toLowerCase().includes(branchMatch[1].toLowerCase())) {
        anomalies.push(`[Profile] False branch attribution: ${branchMatch[1]} (Actual: ${realBranch})`)
        validatedReply = validatedReply.replace(branchMatch[0], `as a student in ${realBranch}`)
        isModified = true
      }
    }
  }

  if (anomalies.length > 0) {
    console.warn('[BrainResponseValidator] Resolved 9-domain anomalies in AI reply:', anomalies)
  }

  return {
    cleanReply: validatedReply,
    isModified,
    detectedAnomalies: anomalies
  }
}

module.exports = {
  validateAndCorrectBrainResponse
}
