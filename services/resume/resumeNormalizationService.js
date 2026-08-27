/**
 * resumeNormalizationService.js
 * Normalizes RChilli API's proprietary JSON response (ResumeParserData) into ZenScore's standard schema.
 * Ultra-robust type casting prevents Mongoose schema casting errors when RChilli returns nested objects or arrays.
 * Includes rawText fallback project extractor for resumes where projects are in custom sections.
 */

function extractUrlString(item) {
  if (!item) return ''
  if (typeof item === 'string') return item
  if (typeof item.Url === 'string') return item.Url
  if (item.Url && typeof item.Url.Url === 'string') return item.Url.Url
  if (typeof item.Url === 'object') return JSON.stringify(item.Url)
  return String(item.Url || item || '')
}

function toStringVal(val) {
  if (val === null || val === undefined) return null
  if (typeof val === 'string') return val.trim() || null
  if (Array.isArray(val)) {
    const joined = val.map(v => toStringVal(v)).filter(Boolean).join(', ')
    return joined || null
  }
  if (typeof val === 'object') {
    const str = val.Name || val.FormattedName || val.Title || val.FormattedAddress || val.City || val.EmployerName || val.InstitutionName || val.DegreeName || val.Specialization || val.ProjectTitle || val.ProjectName
    if (str && typeof str === 'string') return str.trim()
    if (val.City || val.State || val.Country) {
      return [val.City, val.State, val.Country].filter(Boolean).join(', ')
    }
  }
  return null
}

function extractProjectsFromRawText(rawText) {
  if (!rawText) return []
  const projects = []
  
  const match = rawText.match(/PROJECTS?\s*\n([\s\S]*?)(?=\n[A-Z\s]{4,}\n|\n[A-Z][a-z]+\s*:|$)/i)
  if (match && match[1]) {
    const lines = match[1].split('\n').map(l => l.trim()).filter(Boolean)
    let currentProj = null

    lines.forEach(line => {
      if (!line.startsWith('-') && !line.startsWith('•') && line.length < 90 && (line.includes('|') || line.includes(':') || /^[A-Z]/.test(line))) {
        if (currentProj) projects.push(currentProj)
        const parts = line.split('|').map(s => s.trim())
        currentProj = {
          title: parts[0],
          technologies: parts[1] ? parts[1].split(/[,|]/).map(s => s.trim()) : [],
          link: null,
          highlights: [],
          description: line
        }
      } else if (currentProj) {
        currentProj.highlights.push(line.replace(/^[-•]\s*/, ''))
        currentProj.description = (currentProj.description ? currentProj.description + ' ' : '') + line.replace(/^[-•]\s*/, '')
      }
    })
    if (currentProj) projects.push(currentProj)
  }

  return projects
}

function normalizeRChilliData(rchilliData = {}) {
  if (!rchilliData) {
    return {
      candidate: { name: null, email: null, phone: null, location: null, linkedin: null, github: null, portfolio: null },
      summary: null,
      education: [],
      experience: [],
      internships: [],
      projects: [],
      skills: [],
      certifications: [],
      achievements: [],
      languages: [],
      rawText: null,
      provider: 'RChilli'
    }
  }

  // Raw Text
  const rawText = toStringVal(rchilliData.ResumeText || rchilliData.ParsedText)

  // 1. Candidate Contact Information
  const name = toStringVal(rchilliData.Name?.FormattedName || rchilliData.CandidateName || rchilliData.Name?.FullName)
  
  let email = null
  if (Array.isArray(rchilliData.Email) && rchilliData.Email.length > 0) {
    email = toStringVal(rchilliData.Email[0]?.EmailAddress || rchilliData.Email[0])
  } else {
    email = toStringVal(rchilliData.Email)
  }

  let phone = null
  if (Array.isArray(rchilliData.PhoneNumber) && rchilliData.PhoneNumber.length > 0) {
    phone = toStringVal(rchilliData.PhoneNumber[0]?.Number || rchilliData.PhoneNumber[0]?.HandSet || rchilliData.PhoneNumber[0])
  } else {
    phone = toStringVal(rchilliData.PhoneNumber)
  }

  let location = null
  if (Array.isArray(rchilliData.Address) && rchilliData.Address.length > 0) {
    location = toStringVal(rchilliData.Address[0]?.FormattedAddress || rchilliData.Address[0]?.City || rchilliData.Address[0])
  } else {
    location = toStringVal(rchilliData.Address || rchilliData.Location)
  }

  const webSiteArray = Array.isArray(rchilliData.WebSite) ? rchilliData.WebSite : []
  const linkedinMatch = webSiteArray.find(w => extractUrlString(w).toLowerCase().includes('linkedin'))
  const githubMatch = webSiteArray.find(w => extractUrlString(w).toLowerCase().includes('github'))
  const portfolioMatch = webSiteArray.find(w => {
    const url = extractUrlString(w).toLowerCase()
    return url && !url.includes('linkedin') && !url.includes('github')
  })

  const linkedin = toStringVal(rchilliData.LinkedIn) || (linkedinMatch ? extractUrlString(linkedinMatch) : null)
  const github = toStringVal(rchilliData.GitHub) || (githubMatch ? extractUrlString(githubMatch) : null)
  const portfolio = portfolioMatch ? extractUrlString(portfolioMatch) : null

  const candidate = {
    name,
    email,
    phone,
    location,
    linkedin,
    github,
    portfolio
  }

  // 2. Professional Summary
  const summary = toStringVal(rchilliData.ExecutiveSummary || rchilliData.Summary || rchilliData.Objective)

  // 3. Education List
  const rawQualifications = rchilliData.SegregatedQualification || rchilliData.EducationDetail || []
  const education = (Array.isArray(rawQualifications) ? rawQualifications : []).map(q => ({
    degree: toStringVal(q.Degree?.DegreeName || q.DegreeName || q.Qualification),
    fieldOfStudy: toStringVal(q.Degree?.Specialization || q.Specialization),
    institution: toStringVal(q.Institution?.Name || q.Institution?.InstitutionName || q.SchoolName || q.Institution),
    location: toStringVal(q.Institution?.Location || q.Location),
    startDate: toStringVal(q.StartDate),
    endDate: toStringVal(q.EndDate),
    gpa: toStringVal(q.AggregateRate || q.GPA),
    description: toStringVal(q.Description)
  }))

  // 4. Experience List
  const rawExp = rchilliData.SegregatedExperience || rchilliData.WorkExperience || []
  const experience = (Array.isArray(rawExp) ? rawExp : []).map(e => ({
    title: toStringVal(e.JobProfile?.Title || e.JobTitle || e.Title),
    company: toStringVal(e.Employer?.EmployerName || e.Employer?.Name || e.CompanyName || e.Employer),
    location: toStringVal(e.Location || e.Employer?.Location),
    startDate: toStringVal(e.StartDate),
    endDate: toStringVal(e.EndDate),
    isCurrent: Boolean(e.IsCurrentEmployer || (e.EndDate && typeof e.EndDate === 'string' && e.EndDate.toLowerCase().includes('present'))),
    highlights: Array.isArray(e.JobDescription)
      ? e.JobDescription.map(toStringVal).filter(Boolean)
      : (toStringVal(e.JobDescription || e.Description) ? [toStringVal(e.JobDescription || e.Description)] : []),
    description: toStringVal(e.JobDescription || e.Description)
  }))

  // 5. Internships List (filter from experience if titled intern)
  const internships = experience.filter(e => (e.title || '').toLowerCase().includes('intern'))

  // 6. Projects List
  const rawProjects = rchilliData.Projects || rchilliData.ProjectDetails || rchilliData.SegregatedProject || rchilliData.ProjectDetail || rchilliData.Project || []
  let projects = (Array.isArray(rawProjects) ? rawProjects : []).map(p => ({
    title: toStringVal(p.ProjectTitle || p.Title || p.ProjectName || p.Name),
    technologies: Array.isArray(p.UsedSkills)
      ? p.UsedSkills.map(toStringVal).filter(Boolean)
      : (toStringVal(p.UsedSkills || p.Technologies || p.Skills) ? toStringVal(p.UsedSkills || p.Technologies || p.Skills).split(/[,|]/).map(s => s.trim()) : []),
    link: toStringVal(p.URL || p.Link),
    highlights: [toStringVal(p.ProjectDescription || p.Description || p.Summary)].filter(Boolean),
    description: toStringVal(p.ProjectDescription || p.Description || p.Summary)
  })).filter(p => p.title || p.description)

  if (projects.length === 0 && rawText) {
    projects = extractProjectsFromRawText(rawText)
  }

  // 7. Skills List
  const skillsSet = new Set()
  if (Array.isArray(rchilliData.SkillKeywords)) {
    rchilliData.SkillKeywords.forEach(s => {
      const skillName = toStringVal(typeof s === 'string' ? s : s.Skill || s.SkillName)
      if (skillName) skillsSet.add(skillName.trim())
    })
  } else if (typeof rchilliData.SkillKeywords === 'string') {
    rchilliData.SkillKeywords.split(/[,|•]/).forEach(s => {
      if (s.trim()) skillsSet.add(s.trim())
    })
  }
  const skills = Array.from(skillsSet)

  // 8. Certifications List
  const rawCerts = rchilliData.Certifications || rchilliData.CertificationDetails || []
  const certifications = (Array.isArray(rawCerts) ? rawCerts : []).map(c => ({
    name: toStringVal(typeof c === 'string' ? c : c.CertificationName || c.Name),
    issuer: toStringVal(c.IssuingAuthority || c.Issuer),
    date: toStringVal(c.IssueDate || c.Date),
    url: toStringVal(c.URL)
  }))

  // 9. Achievements List
  const rawAchievements = rchilliData.Achievements || rchilliData.Awards || []
  const achievements = (Array.isArray(rawAchievements) ? rawAchievements : [])
    .map(a => toStringVal(typeof a === 'string' ? a : a.Achievement || a.Title))
    .filter(Boolean)

  // 10. Languages List
  const rawLangs = rchilliData.LanguageData || rchilliData.Languages || []
  const languages = (Array.isArray(rawLangs) ? rawLangs : [])
    .map(l => toStringVal(typeof l === 'string' ? l : l.Language))
    .filter(Boolean)

  return {
    candidate,
    summary,
    education,
    experience,
    internships,
    projects,
    skills,
    certifications,
    achievements,
    languages,
    rawText,
    provider: 'RChilli'
  }
}

module.exports = {
  normalizeRChilliData
}
