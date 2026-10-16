const { analyzeATS, analyzeCareerMatch } = require('../../services/resume/resumeAnalysisService')

describe('ATS Scoring Engine (services/resume/resumeAnalysisService)', () => {
  test('evaluates maximum 100/100 score on comprehensive resume', () => {
    const fullResume = {
      candidate: {
        email: 'john.doe@example.com',
        phone: '+91 9876543210',
        location: 'Hyderabad, India',
        linkedin: 'linkedin.com/in/johndoe',
        github: 'github.com/johndoe'
      },
      summary: 'Passionate and results-driven full-stack software engineer with 3 years experience building cloud applications.',
      education: [
        { degree: 'B.Tech in Computer Science', institution: 'JNTU Hyderabad', year: 2025 }
      ],
      experience: [
        { title: 'Software Engineering Intern', company: 'Amazon', duration: '6 months' },
        { title: 'Web Developer', company: 'Tech Solutions', duration: '1 year' }
      ],
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'SQL', 'MongoDB', 'Docker', 'Git'],
      projects: [
        { title: 'ZenScore AI Platform', tech: 'MERN Stack' },
        { title: 'Distributed Cache', tech: 'Go, Redis' }
      ],
      certifications: [
        { name: 'AWS Certified Cloud Practitioner' }
      ]
    }

    const result = analyzeATS(fullResume)
    expect(result.atsScore).toBe(100)
    expect(result.completeness).toBe(100)
    expect(result.missingSections).toHaveLength(0)
    expect(result.formatIssues).toHaveLength(0)
  })

  test('penalizes missing sections and flags missing contact and experience items', () => {
    const sparseResume = {
      candidate: {
        location: 'Bengaluru' // Missing email, phone, linkedin
      },
      summary: 'Short summary', // Under 25 chars -> rejected (0 pts)
      education: [],
      experience: [],
      skills: ['JavaScript'], // 1 skill -> 6 pts
      projects: [],
      certifications: []
    }

    const result = analyzeATS(sparseResume)
    // Contact: 3 pts (location only). Summary: 0. Education: 0. Experience: 0. Skills: 6. Projects: 0. Certs: 0. Total = 9
    expect(result.atsScore).toBe(9)
    expect(result.missingSections).toContain('Email Address')
    expect(result.missingSections).toContain('Phone Number')
    expect(result.missingSections).toContain('Professional Summary')
    expect(result.missingSections).toContain('Education')
    expect(result.missingSections).toContain('Work Experience')
    expect(result.missingSections).toContain('Projects')
    expect(result.completeness).toBeLessThan(50)
  })

  test('career match correctly compares skills against role requirements', () => {
    const parsedSkills = ['JavaScript', 'React', 'HTML', 'CSS', 'Tailwind CSS']
    const result = analyzeCareerMatch(parsedSkills, 'Frontend Developer')
    expect(result.matchScore).toBeGreaterThan(0)
    expect(result.missingSkills).toEqual(expect.arrayContaining(['TypeScript', 'Next.js', 'Git', 'REST API']))
    expect(result.matchingSkills).toEqual(expect.arrayContaining(['JavaScript', 'React', 'HTML', 'CSS', 'Tailwind CSS']))
  })
})
