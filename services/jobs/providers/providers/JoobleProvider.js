const BaseProvider = require('../BaseProvider')
const providerLogger = require('../../utils/providerLogger')

/**
 * Jooble Live Job Provider Implementation for ZenScore AI.
 * Connects to Jooble REST API v1 via POST requests,
 * normalizes raw job payloads into canonical ZenScore Job Schema,
 * and seamlessly feeds the Ingestion & Sync Engine.
 * 
 * @extends BaseProvider
 */
class JoobleProvider extends BaseProvider {
  constructor() {
    super('jooble')
  }

  getProviderName() {
    return 'jooble'
  }

  getProviderVersion() {
    return '1.0.0'
  }

  /**
   * Validates presence and format of required API credentials
   * @returns {Object} { isValid: boolean, error?: string }
   */
  validateCredentials() {
    const apiKey = process.env.JOOBLE_API_KEY

    if (!apiKey) {
      return { isValid: false, error: 'Missing JOOBLE_API_KEY environment variable.' }
    }
    if (apiKey.includes('placeholder')) {
      return { isValid: false, error: 'JOOBLE_API_KEY contains placeholder value.' }
    }
    return { isValid: true }
  }

  /**
   * Fetches raw job listings from Jooble REST API
   * @param {Object} [params]
   * @returns {Promise<Array<Object>>} Array of raw job objects
   */
  async fetchJobs(params = {}) {
    const credCheck = this.validateCredentials()
    const country = params.country || process.env.JOOBLE_COUNTRY || 'in'
    const resultsPerPage = params.resultsPerPage || process.env.JOOBLE_RESULTS_PER_PAGE || 50
    const page = params.page || 1

    providerLogger.info(this.getProviderName(), 'FETCH', `Initiating Jooble API fetch (country: ${country}, page: ${page})...`)

    // Check credentials
    if (!credCheck.isValid) {
      providerLogger.warn(
        this.getProviderName(),
        'FETCH',
        `Jooble Provider unavailable (${credCheck.error}). Serving structured sample dataset.`
      )
      return this.getFallbackJoobleData()
    }

    const apiKey = process.env.JOOBLE_API_KEY
    const searchQueries = params.keywords
      ? [params.keywords]
      : ['software engineer', 'react developer', 'python engineer', 'data scientist', 'devops engineer']

    const aggregatedResults = []
    const seenExternalIds = new Set()

    try {
      for (const query of searchQueries) {
        const url = `https://jooble.org/api/${apiKey}`
        const body = {
          keywords: query,
          location: country === 'in' ? 'India' : country,
          page: String(page),
          result_on_page: String(resultsPerPage)
        }

        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          })

          if (response.ok) {
            const data = await response.json()
            if (data && Array.isArray(data.jobs)) {
              for (const item of data.jobs) {
                const itemId = String(item.id || item.link)
                if (!seenExternalIds.has(itemId)) {
                  seenExternalIds.add(itemId)
                  aggregatedResults.push(item)
                }
              }
            }
          } else {
            providerLogger.warn(
              this.getProviderName(),
              'FETCH',
              `Jooble API request for query '${query}' returned status ${response.status}`
            )
          }
        } catch (subErr) {
          providerLogger.warn(this.getProviderName(), 'FETCH', `Fetch query '${query}' failed: ${subErr.message}`)
        }
      }

      if (aggregatedResults.length > 0) {
        providerLogger.success(
          this.getProviderName(),
          'FETCH',
          `Successfully fetched ${aggregatedResults.length} live jobs from Jooble API.`
        )
        return aggregatedResults
      }

      providerLogger.warn(this.getProviderName(), 'FETCH', 'Jooble API returned empty jobs array. Using fallback dataset.')
      return this.getFallbackJoobleData()
    } catch (err) {
      providerLogger.error(
        this.getProviderName(),
        'FETCH',
        `Jooble API request failed (${err.message}). Falling back to sample dataset.`,
        err
      )
      return this.getFallbackJoobleData()
    }
  }

  /**
   * Normalizes raw Jooble job payload into canonical ZenScore Job Schema
   * @param {Object} rawJob
   * @returns {Object} Canonical normalized job
   */
  normalize(rawJob) {
    if (!rawJob) return null

    // Clean HTML tags from title/snippet
    const cleanText = (str) => (str ? str.replace(/<\/?[^>]+(>|$)/g, '').trim() : '')

    const rawTitle = cleanText(rawJob.title)
    const companyName = rawJob.company || rawJob.source || 'Tech Enterprise'
    const rawLoc = rawJob.location || 'India'
    const snippet = cleanText(rawJob.snippet || rawJob.description || '')

    // Dynamic Company Logo / Badge Mapping
    const getCompanyLogo = (comp) => {
      const c = comp.toLowerCase()
      if (c.includes('oracle')) return '🔴'
      if (c.includes('sap')) return '🟦'
      if (c.includes('cisco')) return '🔷'
      if (c.includes('paypal')) return '💳'
      if (c.includes('atlassian')) return '🔷'
      if (c.includes('microsoft')) return '🟦'
      if (c.includes('google')) return '🔵'
      if (c.includes('amazon')) return '🟧'
      if (c.includes('adobe')) return '🟥'
      if (c.includes('salesforce')) return '☁️'
      return '🏢'
    }

    // Determine Work Mode
    const combinedStr = `${rawTitle} ${rawLoc} ${snippet}`.toLowerCase()
    let workMode = 'On-site'
    if (combinedStr.includes('remote') || combinedStr.includes('work from home') || combinedStr.includes('wfh')) {
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

    // Categorization based on Title & Snippet
    let category = 'Software Engineering'
    const titleLower = rawTitle.toLowerCase()
    if (titleLower.includes('react') || titleLower.includes('frontend') || titleLower.includes('ui') || titleLower.includes('web developer')) {
      category = 'Frontend'
    } else if (titleLower.includes('backend') || titleLower.includes('node') || titleLower.includes('python') || titleLower.includes('java')) {
      category = 'Backend'
    } else if (titleLower.includes('full stack') || titleLower.includes('mern')) {
      category = 'Full Stack'
    } else if (titleLower.includes('devops') || titleLower.includes('cloud') || titleLower.includes('kubernetes') || titleLower.includes('aws')) {
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
      if (regex.test(`${rawTitle} ${snippet}`)) {
        matchedSkills.push(sk)
      }
    }

    const requiredSkills = matchedSkills.length > 0
      ? matchedSkills.slice(0, 5)
      : [category, 'Problem Solving', 'Git']

    // Format Salary String & Minimum Value
    let salaryStr = rawJob.salary || 'Competitive Salary'
    let minSalaryVal = 0

    if (rawJob.salary) {
      const nums = rawJob.salary.match(/\d[\d,.]*/g)
      if (nums && nums.length > 0) {
        const val = parseFloat(nums[0].replace(/,/g, ''))
        if (val > 0) {
          minSalaryVal = val >= 100000 ? Math.round(val / 100000) : val
        }
      }
    }

    const externalId = String(rawJob.id || Date.now())

    return {
      title: rawTitle || 'Software Engineer',
      company: companyName,
      logo: getCompanyLogo(companyName),
      location: rawLoc,
      workMode,
      employmentType,
      experience: '0–1 Years',
      salary: salaryStr,
      minSalaryVal,
      category,
      requiredSkills,
      description: snippet || 'Join our high-performing technology team to design and deliver robust digital products.',
      responsibilities: [
        `Architect, implement, and maintain enterprise software services for ${companyName}.`,
        'Participate in agile sprint planning, code reviews, and technical documentation.',
        'Optimize application performance and ensure system scalability.'
      ],
      requirements: [
        'Bachelor degree in Computer Science, Software Engineering, or related technical field.',
        `Hands-on proficiency in ${requiredSkills.slice(0, 2).join(', ')}.`,
        'Solid understanding of data structures, algorithms, and cloud software patterns.'
      ],
      benefits: [
        'Competitive remuneration and annual performance bonuses.',
        'Comprehensive family health coverage and wellness allowances.',
        'Professional certification sponsorship and continuous learning.'
      ],
      applyLink: rawJob.link || 'https://jooble.org',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      source: 'Jooble',
      externalId,
      postedDate: rawJob.updated ? new Date(rawJob.updated) : new Date(),
      featured: Math.random() > 0.6,
      latest: true
    }
  }

  /**
   * Structured fallback datasets matching live Jooble response format
   */
  getFallbackJoobleData() {
    return [
      {
        id: 'JBL-3001',
        title: 'Oracle Database & Cloud Infrastructure Engineer',
        company: 'Oracle',
        location: 'Bengaluru, Karnataka',
        salary: '₹14.0L - ₹22.0L / yr',
        snippet: 'Seeking an experienced Database Engineer to manage high-availability Oracle Autonomous Cloud DB instances, SQL performance tuning, and PL/SQL procedures.',
        type: 'Full Time',
        link: 'https://jooble.org/desc/JBL-3001',
        updated: new Date().toISOString()
      },
      {
        id: 'JBL-3002',
        title: 'SAP S/4HANA Backend Java Microservices Developer',
        company: 'SAP',
        location: 'Gurugram, Haryana',
        salary: '₹12.0L - ₹18.0L / yr',
        snippet: 'Build cloud-native backend services using Java, Spring Boot, SAP BTP, and OData REST APIs for global enterprise customers.',
        type: 'Full Time',
        link: 'https://jooble.org/desc/JBL-3002',
        updated: new Date().toISOString()
      },
      {
        id: 'JBL-3003',
        title: 'Network Security & Cloud DevOps Engineer',
        company: 'Cisco',
        location: 'Bengaluru, Karnataka (Hybrid)',
        salary: '₹16.0L - ₹26.0L / yr',
        snippet: 'Automate cloud security infrastructure using Python, Terraform, Docker, and Kubernetes across AWS and Cisco cloud environments.',
        type: 'Full Time',
        link: 'https://jooble.org/desc/JBL-3003',
        updated: new Date().toISOString()
      },
      {
        id: 'JBL-3004',
        title: 'Senior Payments Platform Engineer (Node.js/Go)',
        company: 'PayPal',
        location: 'Chennai, Tamil Nadu (Remote)',
        salary: '₹18.0L - ₹30.0L / yr',
        snippet: 'Architect low-latency financial transaction microservices using Node.js, Go, Redis, and PostgreSQL for global merchant payments.',
        type: 'Full Time',
        link: 'https://jooble.org/desc/JBL-3004',
        updated: new Date().toISOString()
      },
      {
        id: 'JBL-3005',
        title: 'Frontend React & TypeScript Engineer',
        company: 'Atlassian',
        location: 'Bengaluru, Karnataka',
        salary: '₹15.0L - ₹24.0L / yr',
        snippet: 'Join the Jira & Confluence core team to build accessible, high-performance UI components using React, TypeScript, and GraphQL.',
        type: 'Full Time',
        link: 'https://jooble.org/desc/JBL-3005',
        updated: new Date().toISOString()
      }
    ]
  }
}

module.exports = JoobleProvider
