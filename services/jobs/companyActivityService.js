const FollowedCompany = require('../../models/FollowedCompany')
const JobListing = require('../../models/JobListing')
const Notification = require('../../models/Notification')
const { sendEmail } = require('../email/resendService')

/**
 * Dispatches notifications and emails to students following a company when a new job is posted
 * @param {Object} job - MongoDB JobListing document
 */
const notifyCompanyFollowers = async (job) => {
  if (!job || !job.company) return

  try {
    const followers = await FollowedCompany.find({
      companyName: { $regex: new RegExp(`^${job.company.trim()}$`, 'i') },
      notificationsEnabled: true
    }).populate('user')

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

    for (const follower of followers) {
      if (!follower.user) continue

      // 1. Create In-App Notification
      try {
        await Notification.create({
          user: follower.user._id,
          title: `🏢 ${job.company} posted a new position: ${job.title}`,
          message: `${job.company} is actively hiring for ${job.title} in ${job.location} (${job.workMode}). Check out the details!`,
          type: 'COMPANY_UPDATE',
          read: false
        })
      } catch (notifErr) {
        console.error('[CompanyActivity Service] Failed in-app notification:', notifErr.message)
      }

      // 2. Dispatch Resend Email if email exists
      if (follower.user.email) {
        try {
          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${job.company} Hiring Update - ZenScore AI</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F8FAFC; color: #0F172A;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 40px 12px;">
                    <table role="presentation" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #E2E8F0;">
                      
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #2563EB 100%); padding: 32px 36px; text-align: center;">
                          <span style="background: rgba(255,255,255,0.15); color: #FFFFFF; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase;">
                            🏢 Company Hiring Update
                          </span>
                          <h1 style="margin: 12px 0 0 0; font-size: 24px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.4px;">
                            ${job.company} is Hiring!
                          </h1>
                        </td>
                      </tr>

                      <!-- Body -->
                      <tr>
                        <td style="padding: 32px 36px;">
                          <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155; line-height: 1.5;">
                            Hi <strong>${follower.user.name || 'Student'}</strong>, <strong>${job.company}</strong> (a company you follow) has just posted a new opening!
                          </p>

                          <!-- Job Card Box -->
                          <div style="background: #F8FAFC; border-radius: 16px; padding: 24px; border: 1px solid #E2E8F0; margin-bottom: 24px;">
                            <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px;">
                              <div style="width: 48px; height: 48px; border-radius: 50%; background: #FFFFFF; border: 1px solid #E2E8F0; font-size: 24px; text-align: center; line-height: 46px;">
                                ${job.logo || '💼'}
                              </div>
                              <div>
                                <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #0F172A;">
                                  ${job.title}
                                </h2>
                                <p style="margin: 4px 0 0 0; font-size: 13.5px; color: #475569; font-weight: 700;">
                                  ${job.company} • ${job.location} (${job.workMode})
                                </p>
                              </div>
                            </div>

                            <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #475569;">
                              <tr>
                                <td style="padding: 4px 0;"><strong>Salary:</strong> ${job.salary || 'Competitive'}</td>
                                <td style="padding: 4px 0;"><strong>Employment:</strong> ${job.employmentType}</td>
                              </tr>
                            </table>
                          </div>

                          <!-- CTA Button -->
                          <div style="text-align: center; margin: 28px 0;">
                            <a href="${frontendUrl}/companies/${encodeURIComponent(job.company)}" target="_blank" style="background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 14.5px; font-weight: 800; display: inline-block; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);">
                              View Company Profile & Apply →
                            </a>
                          </div>

                          <p style="margin: 24px 0 0 0; font-size: 12.5px; color: #94A3B8; border-top: 1px solid #F1F5F9; padding-top: 16px;">
                            You are receiving this update because you follow <strong>${job.company}</strong> on ZenScore AI.
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `

          await sendEmail({
            to: follower.user.email,
            subject: `🏢 ${job.company} has posted a new job: ${job.title}`,
            html: htmlContent
          })
        } catch (emailErr) {
          console.error('[CompanyActivity Service] Email send error:', emailErr.message)
        }
      }
    }
  } catch (err) {
    console.error('[CompanyActivity Service] Error notifying followers:', err.message)
  }
}

/**
 * Aggregates company activity summary and profile details
 * @param {string} companyName
 */
const getCompanyActivitySummary = async (companyName) => {
  try {
    const jobs = await JobListing.find({
      company: { $regex: new RegExp(`^${companyName.trim()}$`, 'i') },
      isActive: true
    }).sort({ createdAt: -1 }).lean()

    const activeJobsCount = jobs.length
    const internshipsCount = jobs.filter(j => j.employmentType?.toLowerCase().includes('intern')).length

    const skillsSet = new Set()
    jobs.forEach(j => {
      if (Array.isArray(j.requiredSkills)) {
        j.requiredSkills.forEach(s => skillsSet.add(s))
      }
    })

    const sampleJob = jobs[0] || {}

    return {
      companyName,
      companyLogo: sampleJob.logo || '🏢',
      industry: sampleJob.category || 'Technology',
      activeJobs: activeJobsCount,
      internships: internshipsCount,
      hiringStatus: activeJobsCount > 0 ? 'Actively Hiring' : 'Passively Hiring',
      frequentlyHiredSkills: Array.from(skillsSet).slice(0, 8),
      latestJobs: jobs
    }
  } catch (err) {
    console.error('[CompanyActivity Service] Profile aggregation error:', err.message)
    throw err
  }
}

module.exports = {
  notifyCompanyFollowers,
  getCompanyActivitySummary
}
