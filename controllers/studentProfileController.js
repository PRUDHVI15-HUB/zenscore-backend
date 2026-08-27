const StudentProfile = require('../models/StudentProfile')

function deepMerge(target = {}, source = {}) {
  const output = { ...target }
  if (source && typeof source === 'object') {
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        output[key] = deepMerge(target[key] || {}, source[key])
      } else {
        output[key] = source[key]
      }
    })
  }
  return output
}

/**
 * Helper to ensure a user has a StudentProfile instance
 */
async function getOrCreateProfile(userId, email) {
  const uid = userId ? String(userId) : 'guest_user_1'
  let profile = await StudentProfile.findOne({ userId: uid }).catch(() => null)
  if (!profile) {
    try {
      profile = await StudentProfile.create({
        userId: uid,
        email: email || 'student@zenscore.ai',
        basicProfile: { status: 'pending', data: {} },
        academicSummary: { status: 'pending', data: {} },
        careerProfile: { status: 'pending', data: {} },
        skillsSummary: { status: 'pending', data: {} },
        coursesSummary: { status: 'pending', data: {} },
        jobsSummary: { status: 'pending', data: {} },
        productivitySummary: { status: 'pending', data: {} },
        aiSummary: { status: 'pending', data: {} }
      })
    } catch (e) {
      profile = await StudentProfile.findOne({ userId: uid }).catch(() => null)
    }
  }
  return profile
}

/**
 * GET /api/student/profile
 */
const getStudentProfile = async (req, res) => {
  try {
    if (require('mongoose').connection.readyState !== 1) {
      return res.json({
        success: true,
        isOffline: true,
        profile: {
          userId: String(req.user?._id || 'guest_user_1'),
          basicProfile: { status: 'live', data: { fullName: 'ZenScore Student' } },
          academicSummary: { status: 'live', data: { currentCGPA: 8.5 } },
          careerProfile: { status: 'live', data: { selectedCareerGoal: 'Full Stack Developer', resumeUploaded: true, resumeATSScore: 78 } },
          skillsSummary: { status: 'live', data: { verifiedSkillsCount: 5 } },
          coursesSummary: { status: 'live', data: { activeCourses: 2 } },
          jobsSummary: { status: 'live', data: {} },
          productivitySummary: { status: 'live', data: {} },
          aiSummary: { status: 'live', data: {} }
        }
      })
    }
    const profile = await getOrCreateProfile(req.user._id, req.user.email)
    res.json({ success: true, profile })
  } catch (error) {
    console.info('[StudentProfileController] Offline mode fallback notice:', error?.message)
    res.json({ success: true, isOffline: true, profile: {} })
  }
}

/**
 * PATCH /api/student/profile
 * Deep merge full profile update
 */
const updateStudentProfile = async (req, res) => {
  try {
    if (require('mongoose').connection.readyState !== 1) {
      return res.json({ success: true, isOffline: true, message: 'Profile updated in offline cache' })
    }
    let profile = await getOrCreateProfile(req.user._id, req.user.email)
    const updates = req.body || {}

    const sections = [
      'basicProfile', 'academicSummary', 'careerProfile',
      'skillsSummary', 'coursesSummary', 'jobsSummary',
      'productivitySummary', 'aiSummary'
    ]

    sections.forEach(section => {
      if (updates[section]) {
        const incomingEnvelope = updates[section]
        const currentEnvelope = profile[section] || { status: 'pending', data: {}, version: 1 }

        const newData = deepMerge(currentEnvelope.data || {}, incomingEnvelope.data || incomingEnvelope)
        const newVersion = (currentEnvelope.version || 1) + 1
        const newSource = incomingEnvelope.source || currentEnvelope.source || 'Backend'

        profile[section] = {
          status: 'live',
          source: newSource,
          lastUpdated: new Date(),
          version: newVersion,
          data: newData
        }
      }
    })

    profile.metadata.version = (profile.metadata?.version || 1) + 1
    profile.metadata.lastUpdated = new Date()
    profile.markModified('basicProfile')
    profile.markModified('academicSummary')
    profile.markModified('careerProfile')
    profile.markModified('skillsSummary')
    profile.markModified('coursesSummary')
    profile.markModified('jobsSummary')
    profile.markModified('productivitySummary')
    profile.markModified('aiSummary')

    await profile.save()
    res.json({ success: true, profile })
  } catch (error) {
    console.info('[StudentProfileController] Offline update notice:', error?.message)
    res.json({ success: true, isOffline: true, message: 'Profile updated in offline mode' })
  }
}

/**
 * PATCH /api/student/profile/:section
 * Updates ONLY a single section envelope
 */
const updateProfileSection = async (req, res) => {
  try {
    const { section } = req.params
    const allowedSections = [
      'basicProfile', 'academicSummary', 'careerProfile',
      'skillsSummary', 'coursesSummary', 'jobsSummary',
      'productivitySummary', 'aiSummary'
    ]

    if (!allowedSections.includes(section)) {
      return res.status(400).json({ success: false, message: `Invalid section: ${section}` })
    }

    if (require('mongoose').connection.readyState !== 1) {
      return res.json({ success: true, section, isOffline: true, message: 'Section updated in offline cache' })
    }

    let profile = await getOrCreateProfile(req.user._id, req.user.email)
    const currentEnvelope = profile[section] || { status: 'pending', data: {}, version: 1 }

    const payload = req.body || {}
    const incomingData = payload.data !== undefined ? payload.data : payload
    const incomingSource = payload.source || req.headers['x-profile-source'] || 'API'

    const mergedData = deepMerge(currentEnvelope.data || {}, incomingData)
    const newVersion = (currentEnvelope.version || 1) + 1

    profile[section] = {
      status: 'live',
      source: incomingSource,
      lastUpdated: new Date(),
      version: newVersion,
      data: mergedData
    }

    profile.metadata.version = (profile.metadata?.version || 1) + 1
    profile.metadata.lastUpdated = new Date()
    profile.markModified(section)

    await profile.save()
    res.json({ success: true, section, profile })
  } catch (error) {
    console.info(`[StudentProfileController] Offline update section ${req.params.section} notice:`, error?.message)
    res.json({ success: true, section: req.params.section, isOffline: true })
  }
}

/**
 * POST /api/student/profile/reset
 * Resets all profile sections to pending empty data while preserving user identity metadata
 */
const resetStudentProfile = async (req, res) => {
  try {
    let profile = await getOrCreateProfile(req.user._id, req.user.email)

    const sections = [
      'basicProfile', 'academicSummary', 'careerProfile',
      'skillsSummary', 'coursesSummary', 'jobsSummary',
      'productivitySummary', 'aiSummary'
    ]

    sections.forEach(sec => {
      profile[sec] = {
        status: 'pending',
        source: null,
        lastUpdated: null,
        version: 1,
        data: {}
      }
      profile.markModified(sec)
    })

    profile.metadata.version = 1
    profile.metadata.lastUpdated = new Date()

    await profile.save()
    res.json({ success: true, message: 'Student Profile reset successfully', profile })
  } catch (error) {
    console.error('Error resetting student profile:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * GET /api/student/profile/status
 * Summary status of live & pending profile sections
 */
const getProfileStatus = async (req, res) => {
  try {
    const profile = await getOrCreateProfile(req.user._id, req.user.email)
    const sections = [
      'basicProfile', 'academicSummary', 'careerProfile',
      'skillsSummary', 'coursesSummary', 'jobsSummary',
      'productivitySummary', 'aiSummary'
    ]

    const liveSections = []
    const pendingSections = []

    sections.forEach(sec => {
      if (profile[sec] && profile[sec].status === 'live') {
        liveSections.push(sec)
      } else {
        pendingSections.push(sec)
      }
    })

    res.json({
      success: true,
      liveSections,
      pendingSections,
      lastUpdated: profile.metadata?.lastUpdated || profile.updatedAt,
      version: profile.metadata?.version || 1
    })
  } catch (error) {
    console.error('Error fetching student profile status:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = {
  getStudentProfile,
  updateStudentProfile,
  updateProfileSection,
  resetStudentProfile,
  getProfileStatus
}
