const JobAlert = require('../../models/JobAlert')
const Notification = require('../../models/Notification')
const { sendEmail } = require('../email/resendService')

/**
 * Parses numeric currency value from salary string (e.g. "$120,000 / yr" -> 120000)
 */
const parseSalaryNumber = (salaryStr) => {
  if (!salaryStr) return 0
  const match = salaryStr.replace(/,/g, '').match(/\d+/)
  return match ? parseInt(match[0], 10) : 0
}

/**
 * Generate HTML email template for job alerts
 */
const buildJobAlertEmailHtml = ({ user, alert, job }) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const userName = user.name || 'Student'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Job Match Found - ZenScore AI</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F8FAFC; color: #0F172A;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 12px;">
            <table role="presentation" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #E2E8F0;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #7C3AED 100%); padding: 32px 36px; text-align: center;">
                  <span style="background: rgba(255,255,255,0.2); color: #FFFFFF; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase;">
                    🎯 Job Alert Match
                  </span>
                  <h1 style="margin: 12px 0 0 0; font-size: 24px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.4px;">
                    New Job Match Found!
                  </h1>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 32px 36px;">
                  <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155; line-height: 1.5;">
                    Hi <strong>${userName}</strong>, a new job matching your alert <strong>"${alert.name}"</strong> has just been posted on ZenScore AI!
                  </p>

                  <!-- Job Card Banner -->
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
                          ${job.company}
                        </p>
                      </div>
                    </div>

                    <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #475569;">
                      <tr>
                        <td style="padding: 4px 0;"><strong>Location:</strong> ${job.location} (${job.workMode})</td>
                        <td style="padding: 4px 0;"><strong>Salary:</strong> ${job.salary || 'Competitive'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0;"><strong>Category:</strong> ${job.category}</td>
                        <td style="padding: 4px 0;"><strong>Type:</strong> ${job.employmentType}</td>
                      </tr>
                    </table>
                  </div>

                  <!-- Action Buttons -->
                  <div style="text-align: center; margin: 28px 0;">
                    <a href="${frontendUrl}/jobs/listings" target="_blank" style="background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 14.5px; font-weight: 800; display: inline-block; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);">
                      View & Apply Now →
                    </a>
                  </div>

                  <p style="margin: 24px 0 0 0; font-size: 12.5px; color: #94A3B8; border-top: 1px solid #F1F5F9; padding-top: 16px;">
                    You are receiving this email because you configured job alert <strong>"${alert.name}"</strong> on ZenScore AI. You can manage your alerts anytime under <strong>Jobs > Alerts</strong>.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #F8FAFC; padding: 20px 36px; text-align: center; border-top: 1px solid #E2E8F0;">
                  <p style="margin: 0; font-size: 12px; color: #94A3B8;">
                    © ZenScore AI Placement System. All rights reserved.
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
}

/**
 * Processes a newly created or updated job against active student job alerts
 * @param {Object} job - MongoDB JobListing document
 */
const processNewJobForAlerts = async (job) => {
  if (!job || job.isActive === false) return

  try {
    const activeAlerts = await JobAlert.find({ isActive: true }).populate('user')

    for (const alert of activeAlerts) {
      if (!alert.user) continue

      let isMatch = true

      // 1. Keywords Match
      if (alert.keywords && alert.keywords.length > 0) {
        const searchText = `${job.title} ${job.description || ''} ${(job.requiredSkills || []).join(' ')}`.toLowerCase()
        const keywordMatched = alert.keywords.some(kw => searchText.includes(kw.toLowerCase()))
        if (!keywordMatched) isMatch = false
      }

      // 2. Categories Match
      if (isMatch && alert.categories && alert.categories.length > 0) {
        const catMatched = alert.categories.some(c => c.toLowerCase() === (job.category || '').toLowerCase())
        if (!catMatched) isMatch = false
      }

      // 3. Companies Match
      if (isMatch && alert.companies && alert.companies.length > 0) {
        const companyMatched = alert.companies.some(comp => comp.toLowerCase() === (job.company || '').toLowerCase())
        if (!companyMatched) isMatch = false
      }

      // 4. Locations Match
      if (isMatch && alert.locations && alert.locations.length > 0) {
        const locMatched = alert.locations.some(loc => loc.toLowerCase() === (job.location || '').toLowerCase())
        if (!locMatched) isMatch = false
      }

      // 5. Work Modes Match
      if (isMatch && alert.workModes && alert.workModes.length > 0) {
        const wmMatched = alert.workModes.some(wm => wm.toLowerCase() === (job.workMode || '').toLowerCase())
        if (!wmMatched) isMatch = false
      }

      // 6. Employment Types Match
      if (isMatch && alert.employmentTypes && alert.employmentTypes.length > 0) {
        const etMatched = alert.employmentTypes.some(et => et.toLowerCase() === (job.employmentType || '').toLowerCase())
        if (!etMatched) isMatch = false
      }

      // 7. Minimum Salary Match
      if (isMatch && alert.minimumSalary > 0) {
        const numSalary = parseSalaryNumber(job.salary)
        if (numSalary > 0 && numSalary < alert.minimumSalary) {
          isMatch = false
        }
      }

      // If matched, send notifications
      if (isMatch) {
        // A. In-App Notification
        if (alert.notifyInApp) {
          try {
            await Notification.create({
              user: alert.user._id,
              title: `🎯 New Job Match: ${job.title}`,
              message: `${job.company} is hiring for ${job.title} in ${job.location} (${job.workMode}).`,
              type: 'NEW_JOB_MATCH',
              read: false
            })
          } catch (notifErr) {
            console.error('[JobAlert Engine] Failed to create in-app notification:', notifErr.message)
          }
        }

        // B. Email Notification via Resend
        if (alert.notifyEmail && alert.user.email) {
          try {
            const html = buildJobAlertEmailHtml({ user: alert.user, alert, job })
            await sendEmail({
              to: alert.user.email,
              subject: `🎯 New Job Match Found - ${job.title} at ${job.company}`,
              html
            })
          } catch (emailErr) {
            console.error('[JobAlert Engine] Failed to send email alert:', emailErr.message)
          }
        }

        // Update alert last checked timestamp
        alert.lastCheckedAt = new Date()
        await alert.save()
      }
    }
  } catch (err) {
    console.error('[JobAlert Engine] Error processing job alerts:', err.message)
  }
}

module.exports = {
  processNewJobForAlerts
}
