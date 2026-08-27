const express = require('express')
const router = express.Router()
const { sendEmail } = require('../services/email/resendService')

// TODO: Remove this route before production.
router.get('/email', async (req, res) => {
  try {
    const recipientEmail = req.query.to || process.env.TEST_EMAIL_RECIPIENT || 'delivered@resend.dev'

    await sendEmail({
      to: "prudhvi114489@gmail.com",
      subject: "ZenScore AI - Email Service Test",
      html: `
    <h1>✅ Email Service Working</h1>
    <p>This is a test email from the ZenScore AI backend.</p>
    <p>If you received this email, the Resend integration is configured correctly.</p>
  `
    })

    return res.status(200).json({
      success: true,
      message: 'Test email sent successfully.'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send test email.'
    })
  }
})

module.exports = router
