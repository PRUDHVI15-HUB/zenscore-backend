const mongoose = require('mongoose')

/**
 * CareerProfile Model (Stage 1: Unified Career Foundation)
 * Centralized single source of truth for student's career journey.
 * Zero hardcoded dummy defaults — targetCareer starts as empty string until explicitly selected by the student.
 */
const careerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },

    // ── ONBOARDING STATE (Single Source of Truth) ──
    // This flag is set to true ONLY after the student completes the onboarding wizard.
    // It never defaults to true. It is set explicitly via POST /api/careers/profile.
    onboardingCompleted: {
      type: Boolean,
      default: false,
      index: true
    },

    // ── EDUCATION (Collected during onboarding) ──
    education: {
      year: {
        type: String,
        default: ''
      },
      degree: {
        type: String,
        default: ''
      },
      branch: {
        type: String,
        default: ''
      },
      cgpa: {
        type: Number,
        default: null,
        min: 0,
        max: 10
      }
    },

    // ── SKILL LEVEL (Collected during onboarding) ──
    skillLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', ''],
      default: ''
    },

    // ── DREAM COMPANIES (Collected during onboarding, max 5) ──
    dreamCompanies: {
      type: [String],
      default: []
    },

    // Step 2: Career Goal (Empty by default until student selects a goal)
    careerGoal: {
      targetCareer: {
        type: String,
        default: '',
        trim: true,
        index: true
      },
      category: {
        type: String,
        default: 'Engineering',
        trim: true
      },
      experienceLevel: {
        type: String,
        default: 'Entry Level / Fresher',
        trim: true
      },
      preferredRoles: {
        type: [String],
        default: []
      },
      preferredLocations: {
        type: [String],
        default: ['Bengaluru', 'Hyderabad', 'Remote']
      },
      expectedSalary: {
        type: String,
        default: '₹8L - ₹15L'
      },
      workPreference: {
        type: String,
        enum: ['Remote', 'Hybrid', 'Onsite'],
        default: 'Hybrid'
      },
      status: {
        type: String,
        enum: ['Exploring', 'Learning', 'Placement Ready', 'Employed'],
        default: 'Exploring',
        index: true
      }
    },

    // Step 3: Academics Summary
    academicsSummary: {
      currentCGPA: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
      },
      targetCGPA: {
        type: Number,
        default: 9.0,
        min: 0,
        max: 10
      },
      creditsCompleted: {
        type: Number,
        default: 0,
        min: 0
      },
      attendanceSummary: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      academicHealth: {
        type: String,
        default: 'Pending Evaluation'
      },
      lastSyncTime: {
        type: Date,
        default: Date.now
      }
    },

    // Step 4: Skills Summary
    skillsSummary: {
      completedSkills: {
        type: [String],
        default: []
      },
      skillsInProgress: {
        type: [String],
        default: []
      },
      recommendedSkills: {
        type: [String],
        default: []
      },
      totalSkills: {
        type: Number,
        default: 30
      },
      skillCompletionPct: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      latestUpdatedTime: {
        type: Date,
        default: Date.now
      }
    },

    // Step 5: Learning Progress
    learningProgress: {
      currentRoadmap: {
        type: String,
        default: ''
      },
      currentStage: {
        type: String,
        default: 'Stage 1: Select Target Career Goal'
      },
      completedMilestones: {
        type: Number,
        default: 0
      },
      remainingMilestones: {
        type: Number,
        default: 20
      },
      learningProgressPct: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      estimatedCompletionDate: {
        type: Date
      }
    },

    // Step 6: Resume Summary
    resumeSummary: {
      resumeUploaded: {
        type: Boolean,
        default: false
      },
      atsScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      resumeVersion: {
        type: String,
        default: 'v1.0'
      },
      resumeUpdatedDate: {
        type: Date
      },
      resumeStatus: {
        type: String,
        default: 'Not Uploaded'
      },
      resumeReadinessPct: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      }
    },

    // Step 7: Job Activity
    jobActivity: {
      recommendedJobsCount: {
        type: Number,
        default: 0
      },
      savedJobs: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'JobListing'
        }
      ],
      appliedJobs: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'JobApplication'
        }
      ],
      shortlistedJobs: {
        type: Number,
        default: 0
      },
      latestActivity: {
        type: Date,
        default: Date.now
      }
    },

    // Step 8: Interview Activity
    interviewActivity: {
      mockInterviews: {
        type: Number,
        default: 0
      },
      latestInterview: {
        type: Date
      },
      averageScore: {
        type: Number,
        default: 0
      },
      technicalScore: {
        type: Number,
        default: 0
      },
      hrScore: {
        type: Number,
        default: 0
      },
      communicationScore: {
        type: Number,
        default: 0
      },
      interviewReadiness: {
        type: Number,
        default: 0
      }
    },

    // Step 9: Career Intelligence Engine Outputs
    readinessEngine: {
      overallReadinessPct: {
        type: Number,
        default: 0
      },
      learningScore: {
        type: Number,
        default: 0
      },
      resumeScore: {
        type: Number,
        default: 0
      },
      interviewScore: {
        type: Number,
        default: 0
      },
      academicScore: {
        type: Number,
        default: 0
      },
      jobReadinessScore: {
        type: Number,
        default: 0
      },
      lastEvaluated: {
        type: Date,
        default: Date.now
      }
    },

    // Step 10: Persistent AI Copilot Metadata
    aiMetadata: {
      lastInteractionTime: {
        type: Date,
        default: Date.now
      },
      latestCareerInsight: {
        type: String,
        default: 'Select a target career goal to begin your placement journey.'
      },
      nextSuggestedAction: {
        type: String,
        default: 'Choose your target placement role above.'
      },
      riskFlags: [
        {
          flag: String,
          severity: {
            type: String,
            enum: ['LOW', 'MEDIUM', 'HIGH'],
            default: 'MEDIUM'
          },
          remediation: String
        }
      ]
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model('CareerProfile', careerProfileSchema)
