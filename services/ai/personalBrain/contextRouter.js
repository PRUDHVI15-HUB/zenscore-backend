/**
 * contextRouter.js — Intent-Aware Context Selector
 * Selects only the strictly relevant data domain slices from the Student Snapshot.
 * Prevents bloated token consumption and ensures lightning-fast LLM responses.
 */

const { INTENTS } = require('./intentClassifier')

/**
 * Filter the snapshot to only include domains required for the classified intent.
 * @param {Object} snapshot - The full student snapshot
 * @param {string} intent - The classified query intent
 * @returns {Object} Targeted context payload
 */
function routeContext(snapshot, intent) {
  if (!snapshot) return {}

  const baseProfile = {
    name: snapshot.profile?.name || 'Student',
    branch: snapshot.profile?.branch || 'Engineering',
    yearOfStudy: snapshot.profile?.yearOfStudy || 'Undergraduate',
    targetRole: snapshot.profile?.targetRole || 'Not Selected'
  }

  switch (intent) {
    case INTENTS.GREETING_OR_CASUAL:
      return {
        profile: { name: baseProfile.name }
      }

    case INTENTS.DAILY_STUDY_PLAN:
      return {
        profile: baseProfile,
        academics: {
          cgpa: snapshot.academics?.cgpa,
          highRiskSubjects: snapshot.academics?.highRiskSubjects || [],
          medRiskSubjects: snapshot.academics?.medRiskSubjects || [],
          weakestSubject: snapshot.academics?.weakestSubject
        },
        learning: {
          primaryActiveSkill: snapshot.learning?.primaryActiveSkill,
          activeSkills: (snapshot.learning?.activeSkills || []).slice(0, 3),
          roadmap: snapshot.learning?.roadmap
        },
        career: {
          targetRole: snapshot.career?.targetRole,
          placementReadinessPct: snapshot.career?.placementReadinessPct
        },
        productivity: {
          totalFocusHours14Days: snapshot.productivity?.totalFocusHours14Days,
          todayFocusMinutes: snapshot.productivity?.todayFocusMinutes,
          recentSubjectsStudied: snapshot.productivity?.recentSubjectsStudied
        }
      }

    case INTENTS.ACADEMIC_SUPPORT:
      return {
        profile: baseProfile,
        academics: snapshot.academics
      }

    case INTENTS.SKILL_LEARNING:
      return {
        profile: baseProfile,
        learning: snapshot.learning,
        targetRole: snapshot.career?.targetRole
      }

    case INTENTS.CAREER_GUIDANCE:
      return {
        profile: baseProfile,
        academics: snapshot.academics,
        career: {
          targetRole: snapshot.career?.targetRole,
          skillLevel: snapshot.career?.skillLevel,
          dreamCompanies: snapshot.career?.dreamCompanies,
          placementReadinessPct: snapshot.career?.placementReadinessPct,
          readinessComponents: snapshot.career?.readinessComponents
        },
        learning: {
          activeSkills: snapshot.learning?.activeSkills,
          roadmap: snapshot.learning?.roadmap
        }
      }

    case INTENTS.PLACEMENT_ANALYSIS:
      return {
        profile: baseProfile,
        career: snapshot.career,
        academics: {
          cgpa: snapshot.academics?.cgpa,
          academicTrend: snapshot.academics?.academicTrend
        },
        learning: {
          totalEnrolledSkills: snapshot.learning?.totalEnrolledSkills,
          primaryActiveSkill: snapshot.learning?.primaryActiveSkill
        }
      }

    case INTENTS.PRODUCTIVITY_COACHING:
      return {
        profile: baseProfile,
        productivity: snapshot.productivity,
        learning: {
          primaryActiveSkill: snapshot.learning?.primaryActiveSkill
        }
      }

    case INTENTS.JOB_GUIDANCE:
      return {
        profile: baseProfile,
        jobs: snapshot.jobs,
        career: {
          targetRole: snapshot.career?.targetRole,
          resumeATS: {
            hasResumeUploaded: snapshot.career?.resumeATS?.hasResumeUploaded,
            atsScore: snapshot.career?.resumeATS?.atsScore,
            matchingKeywords: (snapshot.career?.resumeATS?.matchingKeywords || []).slice(0, 5),
            missingKeywords: (snapshot.career?.resumeATS?.missingKeywords || []).slice(0, 5)
          }
        }
      }

    case INTENTS.CODE_OR_TECHNICAL_CONCEPT:
      return {
        profile: {
          name: baseProfile.name,
          branch: baseProfile.branch,
          targetRole: baseProfile.targetRole
        },
        activeLearning: snapshot.learning?.primaryActiveSkill?.skillName || null
      }

    case INTENTS.GENERAL_PERSONAL_ASSISTANT:
    default:
      return {
        profile: baseProfile,
        academics: snapshot.academics,
        career: snapshot.career,
        learning: snapshot.learning,
        targetRole: snapshot.career?.targetRole,
        primarySkill: snapshot.learning?.primaryActiveSkill?.skillName || null,
        cgpa: snapshot.academics?.cgpa || null
      }
  }
}

module.exports = {
  routeContext
}
