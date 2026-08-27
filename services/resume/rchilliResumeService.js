const fs = require('fs')
const path = require('path')

const RCHILLI_API_URL = process.env.RCHILLI_API_URL || 'https://rest.rchilli.com/RChilliParser/Rchilli/parseResumeBinary'
const RCHILLI_USER_KEY = process.env.RCHILLI_USER_KEY || process.env.RCHILLI_API_KEY || ''
const RCHILLI_VERSION = process.env.RCHILLI_VERSION || '8.0.0'
const RCHILLI_SUB_USER_KEY = process.env.RCHILLI_SUB_USER_KEY || process.env.RCHILLI_SUB_USER_ID || ''

const pdfParse = require('pdf-parse')

/**
 * Parses uploaded resume file using external RChilli REST API.
 * Supports RCHILLI_MOCK=true in .env to test parsing without consuming API credits.
 */
async function parseResumeWithRChilli(file) {
  if (!file || !file.path) {
    throw new Error('No valid resume file provided for RChilli parsing.')
  }

  const filePath = file.path
  const fileName = file.originalname || path.basename(filePath)

  // DRY-RUN MOCK MODE (Zero API Credit Consumption)
  if (process.env.RCHILLI_MOCK === 'true' || process.env.ENABLE_RCHILLI_MOCK === 'true') {
    console.info('[RChilliResumeService] 🧪 RCHILLI_MOCK mode active — parsing file locally without consuming RChilli credits.')
    try {
      const fileBuffer = fs.readFileSync(filePath)
      let extractedText = ''
      if (fileName.toLowerCase().endsWith('.pdf')) {
        const parsedPdf = await pdfParse(fileBuffer).catch(() => ({ text: '' }))
        extractedText = parsedPdf.text || ''
      } else {
        extractedText = fileBuffer.toString('utf-8')
      }

      // Synthesize RChilli structure locally
      const mockRChilliData = {
        ResumeParserData: {
          CandidateName: { FormattedName: fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") },
          Email: [{ EmailAddress: "student.candidate@example.com" }],
          PhoneNumber: [{ HandSet: "+1 (555) 234-5678" }],
          Location: { City: "San Francisco", State: "CA", Country: "USA" },
          ExecutiveSummary: extractedText.slice(0, 300) || "Enthusiastic software engineer with experience in full-stack web development.",
          SkillKeywords: extractedText.match(/\b(React|JavaScript|TypeScript|Node\.js|Express|MongoDB|Python|Java|SQL|HTML|CSS|Git|Docker|AWS|REST)\b/gi) || ["React", "JavaScript", "Node.js", "Git", "SQL"],
          SegregatedExperience: [
            {
              JobProfile: { Title: "Software Engineering Developer" },
              Employer: { CompanyName: "Tech Solutions Inc." },
              JobDescription: extractedText.slice(0, 200) || "Developed responsive web applications and REST APIs.",
              StartDate: "2023-01-01",
              EndDate: "Present"
            }
          ],
          SegregatedQualification: [
            {
              Degree: { DegreeName: "Bachelor of Science in Computer Science" },
              Institution: { Name: "State University" },
              DegreeYear: "2023"
            }
          ],
          Projects: [
            { Title: "ZenScore AI Web Platform", UsedSkills: "React, Node.js, MongoDB" }
          ]
        }
      }

      return {
        success: true,
        status: 'parsed',
        provider: 'RChilli (Mock)',
        fileName,
        fileSize: file.size || 0,
        rchilliData: mockRChilliData.ResumeParserData
      }
    } catch (mockErr) {
      console.warn('[RChilliResumeService] Mock parse notice:', mockErr?.message)
    }
  }

  // 1. Verify environment credentials
  if (!RCHILLI_USER_KEY) {
    console.warn('[RChilliResumeService] RCHILLI_USER_KEY / RCHILLI_API_KEY environment variable is missing.')
    return {
      success: false,
      status: 'credentials_missing',
      message: 'RChilli API credentials (RCHILLI_USER_KEY) are missing from backend environment variables.'
    }
  }

  try {
    // 2. Read file & convert to Base64
    const fileBuffer = fs.readFileSync(filePath)
    const base64Data = fileBuffer.toString('base64')

    const subUserIdVal = process.env.RCHILLI_SUB_USER_ID || process.env.RCHILLI_SUB_USER_KEY || RCHILLI_USER_KEY || 'ZenScore'

    const payload = {
      filedata: base64Data,
      filename: fileName,
      userkey: RCHILLI_USER_KEY,
      version: RCHILLI_VERSION,
      subUserId: subUserIdVal,
      subuserid: subUserIdVal
    }

    // 3. Post to RChilli API
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 sec timeout

    const response = await fetch(RCHILLI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`RChilli API HTTP ${response.status}: ${errText || response.statusText}`)
    }

    const rchilliResult = await response.json()

    // 4. Validate RChilli response status
    if (rchilliResult?.error || rchilliResult?.status === 'error') {
      return {
        success: false,
        status: 'error',
        message: rchilliResult.error?.errormsg || rchilliResult.message || 'RChilli parser returned an error response.'
      }
    }

    // Return raw RChilli structured payload
    return {
      success: true,
      status: 'parsed',
      provider: 'RChilli',
      fileName,
      fileSize: file.size || 0,
      rchilliData: rchilliResult?.ResumeParserData || rchilliResult
    }

  } catch (err) {
    console.error('[RChilliResumeService] Parsing failed:', err?.message || err)
    if (err.name === 'AbortError') {
      throw new Error('RChilli API call timed out after 30 seconds.')
    }
    throw new Error(`RChilli resume parsing failed: ${err.message}`)
  } finally {
    // Clean up temporary file
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (cleanupErr) {
      console.warn('[RChilliResumeService] Temp file cleanup warning:', cleanupErr?.message)
    }
  }
}

module.exports = {
  parseResumeWithRChilli,
  RCHILLI_API_URL
}
