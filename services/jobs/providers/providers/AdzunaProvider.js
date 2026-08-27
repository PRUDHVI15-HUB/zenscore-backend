const BaseProvider = require('../BaseProvider')
const providerLogger = require('../../utils/providerLogger')

/**
 * Adzuna Live Job Provider Implementation for ZenScore AI.
 * Connects to Adzuna Jobs REST API v1 across multiple search queries,
 * normalizes raw job results cleanly with word-boundary skill matching,
 * and feeds the ZenScore Ingestion & Sync Pipeline.
 * 
 * @extends BaseProvider
 */
class AdzunaProvider extends BaseProvider {
  constructor() {
    super('adzuna')
  }

  getProviderName() {
    return 'adzuna'
  }

  getProviderVersion() {
    return '1.0.0'
  }

  /**
   * Validates presence and format of required API credentials
   * @returns {Object} { isValid: boolean, error?: string }
   */
  validateCredentials() {
    const appId = process.env.ADZUNA_APP_ID
    const appKey = process.env.ADZUNA_APP_KEY

    if (!appId || !appKey) {
      return { isValid: false, error: 'Missing ADZUNA_APP_ID or ADZUNA_APP_KEY environment variables.' }
    }
    if (appId.includes('placeholder') || appKey.includes('placeholder')) {
      return { isValid: false, error: 'ADZUNA_APP_ID or ADZUNA_APP_KEY contains placeholder values.' }
    }
    return { isValid: true }
  }

  /**
   * Fetches raw job listings from Adzuna API across diverse search terms
   * @param {Object} [params]
   * @returns {Promise<Array<Object>>} Array of raw job objects
   */
  async fetchJobs(params = {}) {
    const credCheck = this.validateCredentials()
    const country = params.country || process.env.ADZUNA_COUNTRY || 'in'
    const resultsPerPage = params.resultsPerPage || process.env.ADZUNA_RESULTS_PER_PAGE || 20

    providerLogger.info(this.getProviderName(), 'FETCH', `Initiating Adzuna multi-query fetch (country: ${country})...`)

    // Check credentials
    if (!credCheck.isValid) {
      providerLogger.warn(
        this.getProviderName(),
        'FETCH',
        `Adzuna Provider unavailable (${credCheck.error}). Using live-structured sample dataset.`
      )
      return this.getFallbackAdzunaData()
    }

    const appId = process.env.ADZUNA_APP_ID
    const appKey = process.env.ADZUNA_APP_KEY

    // Search keywords to guarantee a rich & diverse job feed across domains
    const searchQueries = params.what
      ? [params.what]
      : ['software engineer', 'react developer', 'python engineer', 'data scientist', 'devops engineer']

    const aggregatedResults = []
    const seenExternalIds = new Set()

    try {
      for (const query of searchQueries) {
        const queryParams = new URLSearchParams({
          app_id: appId,
          app_key: appKey,
          results_per_page: String(resultsPerPage),
          what: query
        })
        const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${queryParams.toString()}`

        try {
          const response = await fetch(url)
          if (response.ok) {
            const data = await response.json()
            if (data && Array.isArray(data.results)) {
              for (const item of data.results) {
                const itemId = String(item.id)
                if (!seenExternalIds.has(itemId)) {
                  seenExternalIds.add(itemId)
                  aggregatedResults.push(item)
                }
              }
            }
          }
        } catch (subErr) {
          providerLogger.warn(this.getProviderName(), 'FETCH', `Fetch query '${query}' failed: ${subErr.message}`)
        }
      }

      if (aggregatedResults.length > 0) {
        providerLogger.success(
          this.getProviderName(),
          'FETCH',
          `Successfully fetched ${aggregatedResults.length} diverse live jobs from Adzuna API across queries.`
        )
        return aggregatedResults
      }

      providerLogger.warn(this.getProviderName(), 'FETCH', 'Adzuna API returned empty results. Using fallback dataset.')
      return this.getFallbackAdzunaData()
    } catch (err) {
      providerLogger.error(
        this.getProviderName(),
        'FETCH',
        `Adzuna API request failed (${err.message}). Falling back to sample dataset.`,
        err
      )
      return this.getFallbackAdzunaData()
    }
  }

  /**
   * Normalizes raw Adzuna job payload into canonical ZenScore Job Schema
   * @param {Object} rawJob
   * @returns {Object} Canonical normalized job
   */
  normalize(rawJob) {
    if (!rawJob) return null

    // Clean HTML tags from title/description
    const cleanText = (str) => (str ? str.replace(/<\/?[^>]+(>|$)/g, '').trim() : '')

    const rawTitle = cleanText(rawJob.title || rawJob.job_heading)
    const companyName = rawJob.company?.display_name || rawJob.employer_name || 'Tech Organization'
    const rawLoc = rawJob.location?.display_name || rawJob.location_raw || 'India'
    const desc = cleanText(rawJob.description || rawJob.job_summary || '')

    // Dynamic Company Logo / Emoji Mapping
    const getCompanyLogo = (comp) => {
      const c = comp.toLowerCase()
      if (c.includes('google')) return '🔵'
      if (c.includes('microsoft')) return '🟦'
      if (c.includes('amazon')) return '🟧'
      if (c.includes('accenture')) return '🟣'
      if (c.includes('swiggy') || c.includes('zomato')) return '🔴'
      if (c.includes('flipkart')) return '🟡'
      if (c.includes('zoho') || c.includes('deloitte')) return '🟢'
      if (c.includes('freshworks')) return '🍀'
      if (c.includes('tcs') || c.includes('infosys') || c.includes('wipro') || c.includes('hcl') || c.includes('ibm')) return '💎'
      if (c.includes('stripe')) return '💜'
      if (c.includes('adobe')) return '🟥'
      return '🏢'
    }

    // Determine Work Mode
    const combinedStr = `${rawTitle} ${rawLoc} ${desc}`.toLowerCase()
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

    // Categorization based on Title & Description
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

    // Word Boundary Skill Extraction (Prevents "Good" or "Government" matching "Go")
    const SKILL_KEYWORDS = [
      'React', 'Node.js', 'Python', 'Java', 'TypeScript', 'JavaScript',
      'C++', 'AWS', 'Docker', 'Kubernetes', 'SQL', 'MongoDB',
      'PostgreSQL', 'Express', 'FastAPI', 'Spring Boot', 'Next.js', 'Tailwind',
      'Git', 'REST API', 'GraphQL', 'Machine Learning', 'TensorFlow', 'PyTorch', 'Go'
    ]

    const matchedSkills = []
    for (const sk of SKILL_KEYWORDS) {
      // Use exact word boundary matching
      const regex = new RegExp(`\\b${sk.replace('+', '\\+')}\\b`, 'i')
      if (regex.test(`${rawTitle} ${desc}`)) {
        matchedSkills.push(sk)
      }
    }

    const requiredSkills = matchedSkills.length > 0
      ? matchedSkills.slice(0, 5)
      : [category, 'Problem Solving', 'Git']

    // Format Salary String & Minimum Value
    let salaryStr = 'Competitive Salary'
    let minSalaryVal = 0

    if (rawJob.salary_min || rawJob.salary_max) {
      minSalaryVal = Math.round(rawJob.salary_min || 0)
      const maxVal = Math.round(rawJob.salary_max || minSalaryVal)

      if (minSalaryVal > 0 && maxVal > 0) {
        if (minSalaryVal >= 100000) {
          const minLPA = (minSalaryVal / 100000).toFixed(1)
          const maxLPA = (maxVal / 100000).toFixed(1)
          salaryStr = `₹${minLPA}L - ₹${maxLPA}L / yr`
        } else {
          salaryStr = `$${minSalaryVal.toLocaleString()} - $${maxVal.toLocaleString()} / yr`
        }
      } else if (minSalaryVal > 0) {
        salaryStr = `₹${(minSalaryVal / 100000).toFixed(1)}L+ / yr`
      }
    } else if (rawJob.compensation_str) {
      salaryStr = rawJob.compensation_str
    }

    const externalId = String(rawJob.id || rawJob.provider_job_id || Date.now())

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
      description: desc || 'Join our high-impact engineering team to build scalable software solutions.',
      responsibilities: [
        `Design, build, and maintain efficient, reusable, and reliable code for ${companyName}.`,
        'Collaborate with cross-functional teams to define and ship new features.',
        'Identify and correct bottlenecks and fix software bugs.'
      ],
      requirements: [
        'Bachelor degree in Computer Science, IT, or related engineering discipline.',
        `Strong proficiency in ${requiredSkills.slice(0, 2).join(', ')}.`,
        'Good understanding of web architecture and database fundamentals.'
      ],
      benefits: [
        'Competitive salary package with health insurance benefits.',
        'Flexible working hours and work-from-home options.',
        'Continuous learning allowance and mentorship.'
      ],
      applyLink: rawJob.redirect_url || rawJob.direct_apply_url || 'https://www.adzuna.in',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      source: 'Adzuna',
      externalId,
      postedDate: rawJob.created ? new Date(rawJob.created) : new Date(),
      featured: Math.random() > 0.6,
      latest: true
    }
  }

  /**
   * Structured fallback datasets matching live Adzuna responses
   */
  getFallbackAdzunaData() {
    return [
      {
        id: 'ADZ-2001',
        title: 'Full Stack React & Node.js Developer',
        company: { display_name: 'InfoEdge India' },
        location: { display_name: 'Bengaluru, Karnataka' },
        salary_min: 800000,
        salary_max: 1400000,
        category: { label: 'Full Stack' },
        description: 'Looking for a skilled Full Stack Engineer with expertise in React, Node.js, and MongoDB to build scalable cloud portals.',
        redirect_url: 'https://www.adzuna.in/details/ADZ-2001',
        created: new Date().toISOString()
      },
      {
        id: 'ADZ-2002',
        title: 'Backend Python & FastAPI Engineer (Remote)',
        company: { display_name: 'Zoho Corporation' },
        location: { display_name: 'Chennai, Tamil Nadu (Remote)' },
        salary_min: 1000000,
        salary_max: 1800000,
        category: { label: 'Backend' },
        description: 'Work remotely on high-concurrency microservices using Python, FastAPI, PostgreSQL, and Docker.',
        redirect_url: 'https://www.adzuna.in/details/ADZ-2002',
        created: new Date().toISOString()
      },
      {
        id: 'ADZ-2003',
        title: 'Cloud DevOps & Kubernetes Specialist',
        company: { display_name: 'Freshworks' },
        location: { display_name: 'Hyderabad, Telangana' },
        salary_min: 1200000,
        salary_max: 2000000,
        category: { label: 'DevOps' },
        description: 'Manage AWS cloud infrastructure, Kubernetes clusters, CI/CD pipelines, and Terraform configurations.',
        redirect_url: 'https://www.adzuna.in/details/ADZ-2003',
        created: new Date().toISOString()
      },
      {
        id: 'ADZ-2004',
        title: 'Junior Frontend Developer (React/TypeScript)',
        company: { display_name: 'Swiggy' },
        location: { display_name: 'Bengaluru, Karnataka' },
        salary_min: 600000,
        salary_max: 1000000,
        category: { label: 'Frontend' },
        description: 'Develop responsive user interfaces using React, TypeScript, and Redux Toolkit for high-traffic consumer web apps.',
        redirect_url: 'https://www.adzuna.in/details/ADZ-2004',
        created: new Date().toISOString()
      },
      {
        id: 'ADZ-2005',
        title: 'AI & Data Engineer (Machine Learning)',
        company: { display_name: 'Flipkart' },
        location: { display_name: 'Bengaluru, Karnataka (Hybrid)' },
        salary_min: 1400000,
        salary_max: 2400000,
        category: { label: 'AI/ML' },
        description: 'Build machine learning recommendation models, PyTorch data pipelines, and real-time analytics engines.',
        redirect_url: 'https://www.adzuna.in/details/ADZ-2005',
        created: new Date().toISOString()
      }
    ]
  }
}

module.exports = AdzunaProvider
