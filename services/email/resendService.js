const { Resend } = require('resend')

/**
 * Reusable Resend Email Service for ZenScore AI
 * Production-ready singleton instance and wrapper function.
 */

// Initialize Resend SDK instance using environment API Key
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key')

/**
 * Send email using Resend SDK
 * @param {Object} options
 * @param {string|string[]} options.to - Recipient email address(es)
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - Email HTML content body
 * @param {string} [options.text] - Optional plain text alternative
 * @param {string} [options.from] - Optional override sender email
 * @returns {Promise<Object>} Resend API response
 */
const sendEmail = async ({ to, subject, html, text, from }) => {
  const sender = from || process.env.EMAIL_FROM || 'ZenScore AI <onboarding@resend.dev>'
  const targetRecipients = Array.isArray(to) ? to : [to]

  try {
    const response = await resend.emails.send({
      from: sender,
      to: targetRecipients,
      subject,
      html,
      ...(text && { text })
    })

    if (response.error) {
      // If using resend.dev testing domain and sending to unverified recipient, auto-fallback to account owner for local dev testing
      const isSandboxRestriction = (response.error.statusCode === 403 || response.error.statusCode === 422) && sender.includes('resend.dev')
      if (isSandboxRestriction) {
        const ownerEmail = process.env.TEST_EMAIL_RECIPIENT || 'prudhvi114489@gmail.com'
        console.warn(`[Email Notice] Resend sandbox restriction for ${targetRecipients.join(', ')}. Routing test email to account owner: ${ownerEmail}`)
        
        const fallbackResponse = await resend.emails.send({
          from: sender,
          to: [ownerEmail],
          subject: `[Dev Test for ${targetRecipients.join(', ')}] ${subject}`,
          html: `<div style="padding: 12px 16px; background: #fff3cd; color: #856404; font-family: sans-serif; font-size: 13px; margin-bottom: 20px; border-radius: 8px; border: 1px solid #ffeeba;"><strong>⚠️ Resend Sandbox Notice:</strong> Intended recipient was <code>${targetRecipients.join(', ')}</code>. To send emails directly to external recipients, verify your custom domain at <a href="https://resend.com/domains" target="_blank">resend.com/domains</a>.</div>${html}`,
          ...(text && { text })
        })
        console.log(`[Email] Sent successfully to ${ownerEmail} (Sandbox Fallback)`)
        return fallbackResponse
      }

      console.error(`[Email] Failed to send: ${response.error.message || JSON.stringify(response.error)}`)
      throw response.error
    }

    const recipientLog = targetRecipients.join(', ')
    console.log(`[Email] Sent successfully to ${recipientLog}`)
    return response
  } catch (error) {
    // Also handle catch block fallback for sandbox restrictions
    const isSandboxError = (error.statusCode === 403 || error.statusCode === 422 || error.message?.includes('testing emails')) && sender.includes('resend.dev')
    if (isSandboxError) {
      const ownerEmail = process.env.TEST_EMAIL_RECIPIENT || 'prudhvi114489@gmail.com'
      console.warn(`[Email Notice] Resend sandbox error for ${targetRecipients.join(', ')}. Routing test email to account owner: ${ownerEmail}`)

      const fallbackResponse = await resend.emails.send({
        from: sender,
        to: [ownerEmail],
        subject: `[Dev Test for ${targetRecipients.join(', ')}] ${subject}`,
        html: `<div style="padding: 12px 16px; background: #fff3cd; color: #856404; font-family: sans-serif; font-size: 13px; margin-bottom: 20px; border-radius: 8px; border: 1px solid #ffeeba;"><strong>⚠️ Resend Sandbox Notice:</strong> Intended recipient was <code>${targetRecipients.join(', ')}</code>. To send emails directly to external recipients, verify your custom domain at <a href="https://resend.com/domains" target="_blank">resend.com/domains</a>.</div>${html}`,
        ...(text && { text })
      })
      console.log(`[Email] Sent successfully to ${ownerEmail} (Sandbox Fallback)`)
      return fallbackResponse
    }

    const recipientLog = targetRecipients.join(', ')
    console.error(`[Email] Failed to send to ${recipientLog}:`, error.message || error)
    throw error
  }
}

/**
 * Send Welcome Email to newly registered user (Non-blocking)
 * @param {Object} user - { name, email }
 */
const sendWelcomeEmail = async (user = {}) => {
  const userEmail = user.email
  if (!userEmail) return

  const displayName = user.name || 'Student'
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ZenScore AI</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 10px;">
            <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
              
              <!-- Header with Gradient -->
              <tr>
                <td style="background: linear-gradient(135deg, #7C3AED 0%, #9333EA 100%); padding: 32px 40px; text-align: center;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">⚡ ZenScore AI</h1>
                  <p style="margin: 6px 0 0 0; color: #e9d5ff; font-size: 14px; font-weight: 500;">Advanced Engineering Learning Ecosystem</p>
                </td>
              </tr>

              <!-- Content Body -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #0f172a;">Welcome, ${displayName}! 👋</h2>
                  
                  <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                    Thank you for joining ZenScore AI! We're thrilled to have you here. Your journey toward mastering core engineering skills, building real-world projects, and accelerating your career starts now.
                  </p>

                  <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                    Explore our interactive skill pathways, track your daily learning streak, take quizzes, and earn official digital certifications.
                  </p>

                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${frontendUrl}/skills" target="_blank" style="background: linear-gradient(135deg, #7C3AED 0%, #9333EA 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: 700; display: inline-block; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);">
                      Start Learning
                    </a>
                  </div>

                  <p style="margin: 28px 0 0 0; font-size: 14px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                    Happy learning,<br>
                    <strong>The ZenScore AI Team</strong>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                    © ZenScore AI. All rights reserved.
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

  try {
    await sendEmail({
      to: userEmail,
      subject: 'Welcome to ZenScore AI! 🚀',
      html: htmlContent
    })
    console.log(`Welcome email sent to ${userEmail}`)
  } catch (error) {
    console.error(`Welcome email failed: ${error?.message || error}`)
  }
}

module.exports = {
  resend,
  sendEmail,
  sendWelcomeEmail
}
