/**
 * eval_ats_scoring.js
 * Section 5: ATS Scoring Distribution
 *
 * Runs 10 synthetic resume profiles through analyzeATS() for two target roles.
 * Reports: min, max, median score; sub-score breakdown for one sample.
 * All computation is purely deterministic - no API calls needed.
 *
 * Run: node scratch/eval_ats_scoring.js
 */

const { analyzeATS, analyzeCareerMatch } = require('../services/resume/resumeAnalysisService')

// ── 10 synthetic resume profiles of varying quality ──────────────────────────
const resumes = [
  {
    id: 'R01', label: 'Complete strong resume - Full Stack',
    data: {
      candidate: { email: 'a@a.com', phone: '9000000001', location: 'Hyderabad', linkedin: 'li/a' },
      summary: 'Experienced full-stack developer with 2 years of professional experience building scalable web applications.',
      education: [{ degree: 'B.Tech CSE', institution: 'XYZ University', year: 2025 }],
      experience: [
        { company: 'TechCorp', title: 'Software Engineer', duration: '1 year' },
        { company: 'StartupXY', title: 'Intern', duration: '6 months' }
      ],
      internships: [],
      projects: [
        { title: 'Portfolio Site', tech: 'React, Node.js' },
        { title: 'E-commerce App', tech: 'Next.js, MongoDB' }
      ],
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'SQL', 'MongoDB', 'HTML', 'CSS', 'Docker', 'Git'],
      certifications: [{ name: 'AWS Cloud Practitioner' }],
      achievements: []
    }
  },
  {
    id: 'R02', label: 'Strong backend resume',
    data: {
      candidate: { email: 'b@b.com', phone: '9000000002', location: 'Pune', github: 'gh/b' },
      summary: 'Backend engineer with expertise in microservices and distributed systems, 3 years experience.',
      education: [{ degree: 'M.Tech CS', institution: 'IIT', year: 2024 }],
      experience: [
        { company: 'BigCo', title: 'Backend Dev', duration: '2 years' },
        { company: 'SmallCo', title: 'Intern', duration: '6 months' }
      ],
      internships: [],
      projects: [
        { title: 'Microservice Platform', tech: 'Node.js, Kubernetes' },
        { title: 'REST API Service', tech: 'Python, PostgreSQL' }
      ],
      skills: ['Node.js', 'Python', 'Java', 'SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'REST API', 'Git'],
      certifications: [{ name: 'Google Cloud Associate' }],
      achievements: []
    }
  },
  {
    id: 'R03', label: 'Mid-level - missing summary and certs',
    data: {
      candidate: { email: 'c@c.com', phone: '9000000003', location: 'Bengaluru' },
      summary: null,
      education: [{ degree: 'B.Tech IT', institution: 'ABC College', year: 2025 }],
      experience: [{ company: 'Corp', title: 'Dev', duration: '1 year' }],
      internships: [],
      projects: [
        { title: 'Blog App', tech: 'React' },
        { title: 'Chat App', tech: 'Socket.io' }
      ],
      skills: ['JavaScript', 'React', 'HTML', 'CSS', 'Node.js', 'Git', 'MongoDB'],
      certifications: [],
      achievements: []
    }
  },
  {
    id: 'R04', label: 'Entry level - no experience, 2 projects, good skills',
    data: {
      candidate: { email: 'd@d.com', phone: '9000000004', location: 'Chennai', github: 'gh/d' },
      summary: 'Final year student passionate about web development and machine learning with hands-on project experience.',
      education: [{ degree: 'B.Tech CSE', institution: 'DEF University', year: 2026 }],
      experience: [],
      internships: [],
      projects: [
        { title: 'ML Classifier', tech: 'Python, Scikit-Learn' },
        { title: 'Web Scraper', tech: 'Python, BeautifulSoup' }
      ],
      skills: ['Python', 'JavaScript', 'React', 'HTML', 'CSS', 'Git', 'SQL', 'Scikit-Learn'],
      certifications: [{ name: 'Coursera ML Certificate' }],
      achievements: []
    }
  },
  {
    id: 'R05', label: 'Sparse resume - email only, 1 skill, no projects',
    data: {
      candidate: { email: 'e@e.com', phone: null, location: null },
      summary: null,
      education: [],
      experience: [],
      internships: [],
      projects: [],
      skills: ['Python'],
      certifications: [],
      achievements: []
    }
  },
  {
    id: 'R06', label: 'Completely empty resume',
    data: {
      candidate: {},
      summary: null,
      education: [],
      experience: [],
      internships: [],
      projects: [],
      skills: [],
      certifications: [],
      achievements: []
    }
  },
  {
    id: 'R07', label: 'Internship-heavy, no full experience',
    data: {
      candidate: { email: 'g@g.com', phone: '9000000007', location: 'Mumbai', linkedin: 'li/g' },
      summary: 'Computer science graduate with two internship stints and strong academic background in algorithms.',
      education: [{ degree: 'B.Tech CSE', institution: 'GHI College', year: 2025 }],
      experience: [],
      internships: [
        { company: 'TechA', title: 'Dev Intern', duration: '3 months' },
        { company: 'TechB', title: 'QA Intern', duration: '2 months' }
      ],
      projects: [
        { title: 'Inventory System', tech: 'Java, MySQL' },
        { title: 'Portfolio', tech: 'HTML, CSS' }
      ],
      skills: ['Java', 'SQL', 'JavaScript', 'HTML', 'CSS', 'Git', 'Python', 'REST API'],
      certifications: [{ name: 'Oracle Java Cert' }],
      achievements: []
    }
  },
  {
    id: 'R08', label: 'Good contact + education + certs, but no skills',
    data: {
      candidate: { email: 'h@h.com', phone: '9000000008', location: 'Delhi', linkedin: 'li/h' },
      summary: 'Driven graduate with academic excellence and leadership experience in college hackathons.',
      education: [{ degree: 'B.Tech CSE', institution: 'JKL University', year: 2025 }],
      experience: [{ company: 'CorpX', title: 'Analyst', duration: '1 year' }],
      internships: [],
      projects: [],
      skills: [],
      certifications: [{ name: 'PMP Certification' }],
      achievements: [{ name: 'Hackathon Winner 2024' }]
    }
  },
  {
    id: 'R09', label: 'AI / ML researcher profile',
    data: {
      candidate: { email: 'i@i.com', phone: '9000000009', location: 'Hyderabad', linkedin: 'li/i', github: 'gh/i' },
      summary: 'AI research engineer with 2 publications in NLP and deep learning, proficient in LLM fine-tuning and RAG pipelines.',
      education: [{ degree: 'M.Tech AI', institution: 'MNO University', year: 2025 }],
      experience: [
        { company: 'AI Lab', title: 'Research Engineer', duration: '18 months' },
        { company: 'StartupZ', title: 'ML Intern', duration: '6 months' }
      ],
      internships: [],
      projects: [
        { title: 'RAG Chatbot', tech: 'Python, LangChain, Vector DB' },
        { title: 'LLM Fine-Tuner', tech: 'PyTorch, Hugging Face' }
      ],
      skills: ['Python', 'PyTorch', 'TensorFlow', 'LLM', 'RAG', 'LangChain', 'FastAPI', 'Vector DB', 'SQL', 'Git', 'Docker'],
      certifications: [{ name: 'Deep Learning Specialization' }],
      achievements: [{ name: 'Best Paper Award EMNLP 2024' }]
    }
  },
  {
    id: 'R10', label: 'Single project, 4 skills, no experience',
    data: {
      candidate: { email: 'j@j.com', phone: '9000000010', location: 'Pune', github: 'gh/j' },
      summary: 'Self-taught developer exploring web technologies and cloud computing fundamentals.',
      education: [{ degree: 'B.Sc CS', institution: 'PQR College', year: 2026 }],
      experience: [],
      internships: [],
      projects: [{ title: 'Personal Blog', tech: 'WordPress' }],
      skills: ['HTML', 'CSS', 'JavaScript', 'WordPress'],
      certifications: [],
      achievements: []
    }
  }
]

const targetRoles = ['Full Stack Developer', 'AI Engineer']

console.log('════════════════════════════════════════════════════════════════')
console.log('  Section 5: ATS Scoring Distribution — 10 Synthetic Resumes')
console.log('════════════════════════════════════════════════════════════════\n')

for (const role of targetRoles) {
  console.log(`\n═══ Role: ${role} ═══`)
  const scores = []
  const breakdowns = []

  for (const resume of resumes) {
    const ats = analyzeATS(resume.data)
    const career = analyzeCareerMatch(resume.data.skills, role)
    scores.push(ats.atsScore)
    breakdowns.push({ id: resume.id, label: resume.label, ats, career, role })

    // Compute sub-scores manually for verification
    // Contact: max 15 | Summary: 10 | Education: 15 | Exp: 20 | Skills: 20 | Projects: 10 | Certs: 10 = 100
    const contactPts = (resume.data.candidate?.email ? 5 : 0) +
                       (resume.data.candidate?.phone ? 4 : 0) +
                       (resume.data.candidate?.location ? 3 : 0) +
                       ((resume.data.candidate?.linkedin || resume.data.candidate?.github || resume.data.candidate?.portfolio) ? 3 : 0)
    const summaryPts = (resume.data.summary && resume.data.summary.length >= 25) ? 10 : 0
    const educationPts = (resume.data.education && resume.data.education.length > 0) ? 15 : 0
    const expCount = (resume.data.experience?.length || 0) + (resume.data.internships?.length || 0)
    const experiencePts = expCount >= 2 ? 20 : expCount === 1 ? 12 : 0
    const skillCount = resume.data.skills?.length || 0
    const skillsPts = skillCount >= 8 ? 20 : skillCount >= 4 ? 12 : skillCount > 0 ? 6 : 0
    const projCount = resume.data.projects?.length || 0
    const projectsPts = projCount >= 2 ? 10 : projCount === 1 ? 6 : 0
    const certCount = (resume.data.certifications?.length || 0) + (resume.data.achievements?.length || 0)
    const certsPts = certCount >= 1 ? 10 : 0
    const totalCheck = contactPts + summaryPts + educationPts + experiencePts + skillsPts + projectsPts + certsPts

    console.log(`\n  ${resume.id}: ${resume.label}`)
    console.log(`    ATS Score: ${ats.atsScore}/100  |  Career Match (${role}): ${career.matchScore}%  |  Completeness: ${ats.completeness}%`)
    console.log(`    Sub-scores [Contact:${contactPts}/15 | Summary:${summaryPts}/10 | Education:${educationPts}/15 | Experience:${experiencePts}/20 | Skills:${skillsPts}/20 | Projects:${projectsPts}/10 | Certs:${certsPts}/10]`)
    console.log(`    Sum check: ${totalCheck} (engine returned: ${ats.atsScore})  match=${totalCheck === ats.atsScore ? 'YES ✅' : 'NO ❌'}`)
  }

  scores.sort((a, b) => a - b)
  const min = scores[0]
  const max = scores[scores.length - 1]
  const median = scores.length % 2 === 0
    ? (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2
    : scores[Math.floor(scores.length / 2)]

  console.log(`\n  ── Distribution for ${role} ──`)
  console.log(`  Scores:  ${scores.join(', ')}`)
  console.log(`  Min: ${min}  Max: ${max}  Median: ${median}`)
}

// ── Detailed sub-score example for R01 ───────────────────────────────────────
console.log('\n════════════════════════════════════════════════════════════════')
console.log('  DETAILED EXAMPLE: R01 scored for Full Stack Developer')
console.log('════════════════════════════════════════════════════════════════')
const r01 = resumes.find(r => r.id === 'R01')
const r01Ats = analyzeATS(r01.data)
console.log('Scoring Reasons:')
r01Ats.scoringReasons.forEach(r => console.log(`  - ${r}`))
console.log('Missing Sections:', r01Ats.missingSections.length === 0 ? 'None' : r01Ats.missingSections.join(', '))
console.log('Format Issues:', r01Ats.formatIssues.length === 0 ? 'None' : r01Ats.formatIssues.join(', '))
console.log('Total Score:', r01Ats.atsScore, '/100')
