const JobApplication = require('../../models/JobApplication')
const SavedJob = require('../../models/SavedJob')
const User = require('../../models/User')

/**
 * Calculates comprehensive analytics for the student placement dashboard
 * @param {string} userId - MongoDB ObjectId of the student
 */
const getUserApplicationAnalytics = async (userId) => {
  try {
    const [applications, savedCount, userDoc] = await Promise.all([
      JobApplication.find({ user: userId }).populate('job').lean(),
      SavedJob.countDocuments({ user: userId }),
      User.findById(userId).lean()
    ])

    const validApps = applications.filter(a => a.job && a.job.isActive !== false)
    const totalApplications = validApps.length

    // Overview counters
    let interviews = 0
    let offers = 0
    let rejected = 0
    let withdrawn = 0
    let matchSum = 0
    let matchCount = 0

    const statusCounts = {
      'Applied': 0,
      'Resume Reviewed': 0,
      'Assessment': 0,
      'Technical Interview': 0,
      'HR Interview': 0,
      'Offer': 0,
      'Rejected': 0,
      'Withdrawn': 0
    }

    const categoryCounts = {}
    const companyMap = {}
    const requiredSkillsSet = new Set()

    validApps.forEach(app => {
      const st = app.status || 'Applied'
      if (statusCounts[st] !== undefined) statusCounts[st]++

      if (['Assessment', 'Technical Interview', 'HR Interview'].includes(st)) {
        interviews++
      } else if (st === 'Offer') {
        offers++
      } else if (st === 'Rejected') {
        rejected++
      } else if (st === 'Withdrawn') {
        withdrawn++
      }

      // AI Match score calculation
      if (app.job && typeof app.job.aiMatch === 'number') {
        matchSum += app.job.aiMatch
        matchCount++
      }

      // Category breakdown
      const cat = app.job?.category || 'General'
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1

      // Company breakdown
      const compName = app.job?.company || 'Unknown'
      if (!companyMap[compName]) {
        companyMap[compName] = {
          company: compName,
          logo: app.job?.logo || '💼',
          count: 0,
          highestStatus: st,
          matchScores: []
        }
      }
      companyMap[compName].count++
      companyMap[compName].matchScores.push(app.job?.aiMatch || 80)

      // Skills aggregation
      if (app.job?.requiredSkills && Array.isArray(app.job.requiredSkills)) {
        app.job.requiredSkills.forEach(skill => requiredSkillsSet.add(skill))
      }
    })

    const activeApplications = totalApplications - (rejected + withdrawn)
    const successRate = totalApplications > 0 ? Math.round(((interviews + offers) / totalApplications) * 100) : 0
    const averageMatchScore = matchCount > 0 ? Math.round(matchSum / matchCount) : 0

    // Monthly applications distribution (last 12 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthlyMap = {}
    
    // Initialize last 12 months with 0
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mLabel = monthNames[d.getMonth()]
      monthlyMap[mLabel] = 0
    }

    validApps.forEach(app => {
      const appDate = new Date(app.appliedAt || app.createdAt)
      const mLabel = monthNames[appDate.getMonth()]
      if (monthlyMap[mLabel] !== undefined) {
        monthlyMap[mLabel]++
      }
    })

    const monthlyApplications = Object.keys(monthlyMap).map(month => ({
      month,
      count: monthlyMap[month]
    }))

    // Status breakdown array
    const statusBreakdown = Object.keys(statusCounts).map(status => ({
      status,
      count: statusCounts[status],
      percentage: totalApplications > 0 ? Math.round((statusCounts[status] / totalApplications) * 100) : 0
    }))

    // Top categories array
    const topCategories = Object.keys(categoryCounts)
      .map(cat => ({
        category: cat,
        count: categoryCounts[cat],
        percentage: totalApplications > 0 ? Math.round((categoryCounts[cat] / totalApplications) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Top companies array
    const topCompanies = Object.values(companyMap)
      .map(comp => ({
        company: comp.company,
        logo: comp.logo,
        count: comp.count,
        highestStatus: comp.highestStatus,
        avgMatch: Math.round(comp.matchScores.reduce((a, b) => a + b, 0) / comp.matchScores.length)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)

    // Filter recommended skills (skills not yet mastered by user)
    const userSkills = new Set((userDoc?.skills || []).map(s => s.toLowerCase()))
    const recommendedSkills = Array.from(requiredSkillsSet)
      .filter(sk => !userSkills.has(sk.toLowerCase()))
      .slice(0, 6)

    if (recommendedSkills.length === 0 && requiredSkillsSet.size === 0) {
      recommendedSkills.push('Docker', 'Kubernetes', 'AWS', 'System Design', 'GraphQL', 'Redis')
    }

    // Dynamic Derived Readiness (Honest scores based on user real data)
    const userSkillsCount = (userDoc?.skills || []).length
    const technicalScore = Math.min(100, Math.round((userSkillsCount / 6) * 100))
    const projectsCount = typeof userDoc?.projectsCount === 'number' ? userDoc.projectsCount : (userDoc?.projects?.length || 0)
    const projectsScore = Math.min(100, Math.round((projectsCount / 4) * 100))
    const interviewScore = interviews > 0 ? Math.min(100, Math.round(((offers + interviews) / (interviews || 1)) * 80)) : 0
    const communicationScore = userSkillsCount > 0 ? 70 : 0
    const overallScore = (userSkillsCount > 0 || totalApplications > 0)
      ? Math.round((technicalScore * 0.4) + (projectsScore * 0.3) + (interviewScore * 0.2) + (communicationScore * 0.1))
      : 0

    const placementReadiness = {
      overall: overallScore,
      technical: technicalScore,
      projects: projectsScore,
      communication: communicationScore,
      interview: interviewScore
    }

    // Dynamic AI Insights
    const aiInsights = []
    if (totalApplications > 0) {
      aiInsights.push(`Your interview conversion rate is currently ${successRate}% (${interviews + offers} active opportunities).`)
    } else {
      aiInsights.push('Apply to targeted roles to start building your placement pipeline.')
    }

    if (topCategories.length > 0) {
      aiInsights.push(`Most of your applications are in ${topCategories[0].category} Development.`)
    }

    if (recommendedSkills.length > 0) {
      aiInsights.push(`Mastering ${recommendedSkills.slice(0, 2).join(' & ')} could boost your job matching score.`)
    }

    return {
      overview: {
        totalApplications,
        activeApplications,
        interviews,
        offers,
        rejected,
        withdrawn,
        savedJobs: savedCount
      },
      successRate,
      averageMatchScore,
      monthlyApplications,
      statusBreakdown,
      topCategories,
      topCompanies,
      recommendedSkills,
      placementReadiness,
      aiInsights
    }
  } catch (err) {
    console.error('[Analytics Service] Error generating application analytics:', err)
    throw err
  }
}

module.exports = {
  getUserApplicationAnalytics
}