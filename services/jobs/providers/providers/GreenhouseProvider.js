const BaseProvider = require('../BaseProvider')
const providerLogger = require('../../utils/providerLogger')

/**
 * Greenhouse Direct ATS Provider Implementation for ZenScore AI.
 * Connects directly to public Greenhouse Job Board REST APIs across configured companies
 * (e.g. Stripe, Notion, Canva, Discord, Airbnb) without requiring private API keys.
 * Normalizes raw ATS job payloads into canonical ZenScore Job Schema.
 * 
 * @extends BaseProvider
 */
class GreenhouseProvider extends BaseProvider {
  constructor() {
    super('greenhouse')
  }

  getProviderName() {
    return 'greenhouse'
  }

  getProviderVersion() {
    return '1.0.0'
  }

  /**
   * Validates configuration for Greenhouse companies list
   * @returns {Object} { isValid: boolean, error?: string }
   */
  validateCredentials() {
    const rawCompanies = process.env.GREENHOUSE_COMPANIES

    if (!rawCompanies || !rawCompanies.trim()) {
      return { isValid: false, error: 'Missing or empty GREENHOUSE_COMPANIES environment variable.' }
    }
    const companies = rawCompanies.split(',').map(c => c.trim()).filter(Boolean)
    if (companies.length === 0) {
      return { isValid: false, error: 'No valid company tokens found in GREENHOUSE_COMPANIES.' }
    }
    return { isValid: true }
  }

  /**
   * Fetches raw job listings directly from public Greenhouse Job Board endpoints across configured companies
   * @param {Object} [params]
   * @returns {Promise<Array<Object>>} Array of raw Greenhouse job objects
   */
  async fetchJobs(params = {}) {
    const credCheck = this.validateCredentials()
    const limit = params.limit || process.env.GREENHOUSE_RESULTS_LIMIT || 100

    providerLogger.info(this.getProviderName(), 'FETCH', `Initiating Greenhouse multi-company ATS fetch...`)

    if (!credCheck.isValid) {
      providerLogger.warn(
        this.getProviderName(),
        'FETCH',
        `Greenhouse Provider configuration incomplete (${credCheck.error}). Serving structured sample dataset.`
      )
      return this.getFallbackGreenhouseData()
    }

    const rawCompanies = params.companies || process.env.GREENHOUSE_COMPANIES || 'stripe,notion,canva,discord,airbnb'
    const companyTokens = rawCompanies.split(',').map(c => c.trim().toLowerCase()).filter(Boolean)

    const aggregatedJobs = []
    const seenIds = new Set()

    for (const token of companyTokens) {
      try {
        const url = `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`
        providerLogger.info(this.getProviderName(), 'FETCH', `Fetching Greenhouse job board for company '${token}'...`)

        const response = await fetch(url)
        if (!response.ok) {
          providerLogger.warn(
            this.getProviderName(),
            'FETCH',
            `Greenhouse board '${token}' returned HTTP ${response.status}. Skipping company.`
          )
          continue
        }

        const data = await response.json()
        if (data && Array.isArray(data.jobs)) {
          const companyDisplayName = token.charAt(0).toUpperCase() + token.slice(1)
          let fetchedForCompany = 0

          for (const item of data.jobs) {
            const externalId = String(item.id)
            if (!seenIds.has(externalId)) {
              seenIds.add(externalId)
              aggregatedJobs.push({
                ...item,
                company_name: companyDisplayName,
                board_token: token
              })
              fetchedForCompany++
            }
          }
          providerLogger.info(
            this.getProviderName(),
            'FETCH',
            `Fetched ${fetchedForCompany} jobs from company '${companyDisplayName}'.`
          )
        }
      } catch (subErr) {
        providerLogger.warn(
          this.getProviderName(),
          'FETCH',
          `Failed to fetch Greenhouse board '${token}': ${subErr.message}`
        )
      }
    }

    if (aggregatedJobs.length > 0) {
      providerLogger.success(
        this.getProviderName(),
        'FETCH',
        `Successfully aggregated ${aggregatedJobs.length} live jobs directly from ${companyTokens.length} Greenhouse company boards.`
      )
      return aggregatedJobs.slice(0, parseInt(limit))
    }

    providerLogger.warn(
      this.getProviderName(),
      'FETCH',
      'Greenhouse API returned 0 aggregated jobs. Serving fallback dataset.'
    )
    return this.getFallbackGreenhouseData()
  }

  /**
   * Normalizes raw Greenhouse ATS job payload into canonical ZenScore Job Schema
   * @param {Object} rawJob
   * @returns {Object} Canonical normalized job
   */
  normalize(rawJob) {
    if (!rawJob) return null

    // Clean HTML tags from text
    const cleanText = (str) => (str ? str.replace(/<\/?[^>]+(>|$)/g, '').replace(/&nbsp;/g, ' ').trim() : '')

    const rawTitle = cleanText(rawJob.title)
    const companyName = rawJob.company_name || (rawJob.board_token ? rawJob.board_token.charAt(0).toUpperCase() + rawJob.board_token.slice(1) : 'Tech Organization')
    const rawLoc = rawJob.location?.name || 'Remote / Global'
    const descContent = cleanText(rawJob.content || rawJob.notes || '')

    // Dynamic Company Logo / Badge Mapping
    const getCompanyLogo = (comp) => {
      const c = comp.toLowerCase()
      if (c.includes('stripe')) return '💜'
      if (c.includes('notion')) return '📝'
      if (c.includes('canva')) return '🎨'
      if (c.includes('discord')) return '💬'
      if (c.includes('airbnb')) return '🏠'
      if (c.includes('figma')) return '🎨'
      if (c.includes('doordash')) return '🔴'
      if (c.includes('coinbase')) return '🪙'
      if (c.includes('google')) return '🔵'
      if (c.includes('microsoft')) return '🟦'
      return '🏢'
    }

    // Determine Work Mode
    const combinedStr = `${rawTitle} ${rawLoc} ${descContent}`.toLowerCase()
    let workMode = 'On-site'
    if (combinedStr.includes('remote') || combinedStr.includes('work from home') || combinedStr.includes('wfh') || combinedStr.includes('anywhere')) {
      workMode = 'Remote'
    } else if (combinedStr.includes('hybrid')) {
      workMode = 'Hybrid'
    }

    // Determine Employment Type
    let employmentType = 'Full Time'
    if (combinedStr.includes('intern') || combinedStr.includes('internship')) {
      employmentType = 'Internship'
    } else if (combinedStr.includes('contract') || combinedStr.includes('freelance')) {
      employmentType = 'Contract'
    } else if (combinedStr.includes('part-time') || combinedStr.includes('part time')) {
      employmentType = 'Part Time'
    }

    // Categorization based on Title & Description
    let category = 'Software Engineering'
    const titleLower = rawTitle.toLowerCase()
    if (titleLower.includes('react') || titleLower.includes('frontend') || titleLower.includes('ui') || titleLower.includes('web developer')) {
      category = 'Frontend'
    } else if (titleLower.includes('backend') || titleLower.includes('node') || titleLower.includes('python') || titleLower.includes('java') || titleLower.includes('go')) {
      category = 'Backend'
    } else if (titleLower.includes('full stack') || titleLower.includes('fullstack') || titleLower.includes('mern')) {
      category = 'Full Stack'
    } else if (titleLower.includes('devops') || titleLower.includes('cloud') || titleLower.includes('infrastructure') || titleLower.includes('kubernetes') || titleLower.includes('aws')) {
      category = 'DevOps'
    } else if (titleLower.includes('data') || titleLower.includes('machine learning') || titleLower.includes('ai') || titleLower.includes('ml')) {
      category = 'AI/ML'
    } else if (titleLower.includes('security') || titleLower.includes('cyber')) {
      category = 'Cybersecurity'
    }

    // Word Boundary Skill Extraction
    const SKILL_KEYWORDS = [
      'React', 'Node.js', 'Python', 'Java', 'TypeScript', 'JavaScript',
      'C++', 'AWS', 'Docker', 'Kubernetes', 'SQL', 'MongoDB',
      'PostgreSQL', 'Express', 'FastAPI', 'Spring Boot', 'Next.js', 'Tailwind',
      'Git', 'REST API', 'GraphQL', 'Machine Learning', 'TensorFlow', 'PyTorch', 'Go'
    ]

    const matchedSkills = []
    for (const sk of SKILL_KEYWORDS) {
      const regex = new RegExp(`\\b${sk.replace('+', '\\+')}\\b`, 'i')
      if (regex.test(`${rawTitle} ${descContent}`)) {
        matchedSkills.push(sk)
      }
    }

    const requiredSkills = matchedSkills.length > 0
      ? matchedSkills.slice(0, 5)
      : [category, 'Problem Solving', 'Git']

    const externalId = String(rawJob.id || Date.now())

    return {
      title: rawTitle || 'Software Engineer',
      company: companyName,
      logo: getCompanyLogo(companyName),
      location: rawLoc,
      workMode,
      employmentType,
      experience: '0–1 Years',
      salary: 'Competitive Equity & Benefits',
      minSalaryVal: 15,
      category,
      requiredSkills,
      description: descContent.slice(0, 800) || 'Work directly on high-scale global systems with industry leaders.',
      responsibilities: [
        `Design, deploy, and scale core systems at ${companyName}.`,
        'Drive software architecture discussions, code reviews, and reliability engineering.',
        'Partner with product design and infrastructure engineering teams.'
      ],
      requirements: [
        'Degree in Computer Science, Software Engineering, or equivalent practical experience.',
        `Deep technical proficiency in ${requiredSkills.slice(0, 2).join(', ')}.`,
        'Demonstrated experience building reliable distributed systems.'
      ],
      benefits: [
        'Top-of-market compensation packages with company equity / stock options.',
        'Full medical, dental, vision insurance coverage for employees & dependents.',
        'Flexible remote/hybrid options with home office setups.'
      ],
      applyLink: rawJob.absolute_url || 'https://boards.greenhouse.io',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      source: 'Greenhouse',
      externalId,
      postedDate: rawJob.updated_at ? new Date(rawJob.updated_at) : new Date(),
      featured: true,
      latest: true
    }
  }

  /**
   * Structured fallback datasets matching direct Greenhouse company ATS payloads
   */
  getFallbackGreenhouseData() {
    return [
      {
        id: 'GH-4001',
        title: 'Senior Infrastructure & Billing Core Engineer',
        company_name: 'Stripe',
        location: { name: 'Remote (US/Global)' },
        content: 'Stripe is looking for a Senior Infrastructure Engineer to build fault-tolerant payment transaction pipelines using Ruby, Go, AWS, and Distributed Ledger Databases.',
        absolute_url: 'https://boards.greenhouse.io/stripe/jobs/GH-4001',
        updated_at: new Date().toISOString()
      },
      {
        id: 'GH-4002',
        title: 'Full Stack Product Engineer (React / Node.js)',
        company_name: 'Notion',
        location: { name: 'San Francisco, CA (Hybrid)' },
        content: 'Join Notion core product engineering to scale multi-user collaborative editors using React, TypeScript, Node.js, and PostgreSQL.',
        absolute_url: 'https://boards.greenhouse.io/notion/jobs/GH-4002',
        updated_at: new Date().toISOString()
      },
      {
        id: 'GH-4003',
        title: 'Frontend Platform & Web Performance Engineer',
        company_name: 'Canva',
        location: { name: 'Sydney, Australia / Remote' },
        content: 'Help build high-performance web graphics engines and UI design tools using TypeScript, React, WebAssembly, and WebGL.',
        absolute_url: 'https://boards.greenhouse.io/canva/jobs/GH-4003',
        updated_at: new Date().toISOString()
      },
      {
        id: 'GH-4004',
        title: 'Real-Time Audio/Video & Backend Systems Engineer',
        company_name: 'Discord',
        location: { name: 'San Francisco, CA (Remote)' },
        content: 'Scale real-time voice, video, and message routing infrastructure for 200M+ monthly active users using Rust, Elixir, C++, and WebRTC.',
        absolute_url: 'https://boards.greenhouse.io/discord/jobs/GH-4004',
        updated_at: new Date().toISOString()
      },
      {
        id: 'GH-4005',
        title: 'Data & Machine Learning Platform Engineer',
        company_name: 'Airbnb',
        location: { name: 'Seattle, WA' },
        content: 'Architect distributed machine learning pipelines and real-time search ranking engines using PyTorch, Python, Spark, and Kubernetes.',
        absolute_url: 'https://boards.greenhouse.io/airbnb/jobs/GH-4005',
        updated_at: new Date().toISOString()
      }
    ]
  }
}

module.exports = GreenhouseProvider
