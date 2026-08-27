const mongoose = require('mongoose')
require('dotenv').config()
const JobListing = require('./models/JobListing')

const COMPANIES = [
  { name: 'Google', logo: '🔵', about: 'Google is a global technology leader focused on improving how people connect with information.' },
  { name: 'Microsoft', logo: '🟦', about: 'Microsoft enables digital transformation for the era of an intelligent cloud and intelligent edge.' },
  { name: 'Amazon', logo: '🟧', about: 'Amazon is a global technology leader spanning e-commerce, cloud computing, online advertising, and digital streaming.' },
  { name: 'Adobe', logo: '🟥', about: 'Adobe is the global leader in digital media and digital marketing solutions.' },
  { name: 'IBM', logo: '🔷', about: 'IBM is a global technology and consulting corporation producing hardware, middleware, and software.' },
  { name: 'TCS', logo: '💎', about: 'Tata Consultancy Services is an IT services, consulting and business solutions organization.' },
  { name: 'Infosys', logo: '💠', about: 'Infosys is a global leader in next-generation digital services and consulting.' },
  { name: 'Accenture', logo: '🟣', about: 'Accenture is a leading global professional services company providing solutions in strategy, consulting, and technology.' },
  { name: 'Capgemini', logo: '♠️', about: 'Capgemini is a global leader in partnering with companies to transform and manage their business through technology.' },
  { name: 'Deloitte', logo: '🟢', about: 'Deloitte provides industry-leading audit, consulting, tax, and advisory services to many of the world’s most admired brands.' },
  { name: 'Wipro', logo: '🟡', about: 'Wipro Limited is a leading technology services and consulting company focused on building innovative solutions.' },
  { name: 'Cognizant', logo: '🔵', about: 'Cognizant helps companies modernize technology, reimagine processes and transform experiences.' }
]

const TITLES = [
  { title: 'Frontend Engineer', category: 'Frontend', skills: ['React', 'TypeScript', 'TailwindCSS', 'Redux', 'HTML5'] },
  { title: 'React Developer', category: 'Frontend', skills: ['React', 'JavaScript', 'CSS3', 'Next.js', 'Jest'] },
  { title: 'UI Software Engineer', category: 'Frontend', skills: ['Vue.js', 'JavaScript', 'Sass', 'Webpack', 'Figma'] },
  { title: 'Backend Developer', category: 'Backend', skills: ['Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'Redis'] },
  { title: 'Java Systems Engineer', category: 'Backend', skills: ['Java', 'Spring Boot', 'Microservices', 'Kafka', 'Hibernate'] },
  { title: 'Python Backend Engineer', category: 'Backend', skills: ['Python', 'Django', 'FastAPI', 'PostgreSQL', 'Docker'] },
  { title: 'Full Stack Engineer', category: 'Full Stack', skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'AWS'] },
  { title: 'MERN Stack Developer', category: 'Full Stack', skills: ['MongoDB', 'Express', 'React', 'Node.js', 'TailwindCSS'] },
  { title: 'DevOps & Cloud Engineer', category: 'DevOps', skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD'] },
  { title: 'Cloud Infrastructure Associate', category: 'Cloud', skills: ['Azure', 'Linux', 'Docker', 'Bash', 'Networking'] },
  { title: 'AI & Machine Learning Engineer', category: 'AI/ML', skills: ['Python', 'PyTorch', 'TensorFlow', 'LLMs', 'Scikit-Learn'] },
  { title: 'Data Engineer', category: 'Data Science', skills: ['Python', 'SQL', 'Spark', 'Snowflake', 'Airflow'] },
  { title: 'Cybersecurity Associate', category: 'Cybersecurity', skills: ['Network Security', 'Linux', 'Python', 'Ethical Hacking', 'SIEM'] }
]

const LOCATIONS = ['Hyderabad', 'Bangalore', 'Pune', 'Chennai', 'Noida', 'Gurgaon', 'Mumbai', 'Remote']
const WORK_MODES = ['Remote', 'Hybrid', 'On-site']
const EMP_TYPES = ['Full Time', 'Internship', 'Contract', 'Part Time']
const EXPERIENCES = ['Fresher', '0–1 Years', '1–3 Years']

const SALARY_TIERS = [
  { text: '₹22 - ₹35 LPA', val: 22 },
  { text: '₹18 - ₹28 LPA', val: 18 },
  { text: '₹14 - ₹22 LPA', val: 14 },
  { text: '₹10 - ₹16 LPA', val: 10 },
  { text: '₹6 - ₹10 LPA', val: 6 },
  { text: '₹45,000/mo', val: 5 },
  { text: '₹35,000/mo', val: 4 }
]

async function seedDatabase() {
  const uris = [
    process.env.MONGO_URI,
    'mongodb://127.0.0.1:27017/zenscore'
  ].filter(Boolean)

  let connected = false
  for (const uri of uris) {
    try {
      console.log(`Connecting to MongoDB (${uri.split('@')[1] || uri})...`)
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 })
      connected = true
      break
    } catch (err) {
      console.warn(`Connection failed for ${uri.split('@')[1] || uri}: ${err.message}`)
    }
  }

  if (!connected) {
    console.error('❌ Could not connect to any MongoDB instance.')
    process.exit(1)
  }

  try {
    const existingCount = await JobListing.countDocuments()
    if (existingCount >= 80) {
      console.log(`Database already has ${existingCount} jobs. Skipping seed.`)
      process.exit(0)
    }

    console.log('Clearing existing job listings...')
    await JobListing.deleteMany({})

    const mockJobsList = []

    for (let i = 1; i <= 90; i++) {
      const company = COMPANIES[i % COMPANIES.length]
      const titleObj = TITLES[i % TITLES.length]
      const location = LOCATIONS[i % LOCATIONS.length]
      const workMode = WORK_MODES[i % WORK_MODES.length]
      const empType = (i % 5 === 0) ? 'Internship' : EMP_TYPES[i % EMP_TYPES.length]
      const exp = (empType === 'Internship') ? 'Fresher' : EXPERIENCES[i % EXPERIENCES.length]
      const salTier = (empType === 'Internship')
        ? (i % 2 === 0 ? SALARY_TIERS[5] : SALARY_TIERS[6])
        : SALARY_TIERS[i % 5]

      const isFeatured = i <= 15
      const isRecommended = (i % 3 === 0)
      const isLatest = (i % 4 === 0) || i > 75

      mockJobsList.push({
        title: titleObj.title,
        company: company.name,
        logo: company.logo,
        location: location,
        workMode: workMode,
        employmentType: empType,
        experience: exp,
        salary: salTier.text,
        minSalaryVal: salTier.val,
        category: titleObj.category,
        requiredSkills: titleObj.skills,
        description: `Join ${company.name} engineering division as a ${titleObj.title}. Build scalable, high-performance web systems for global enterprise applications.`,
        responsibilities: [
          `Architect and deliver responsive features for ${company.name}'s flagship web platform.`,
          `Collaborate with cross-functional teams to build accessible UI components and backend REST APIs.`,
          `Write high-coverage unit test suites and optimize front-end/back-end latency.`
        ],
        requirements: [
          `Strong proficiency in ${titleObj.skills.slice(0, 3).join(', ')}.`,
          `Solid understanding of data structures, algorithms, and modular design patterns.`,
          `Excellent communication skills and passion for continuous learning.`
        ],
        benefits: ['Health & Wellness Insurance', 'Flexible Work Options', 'Mentorship Program', 'Learning & Certification Grant'],
        hiringProcess: ['Online Assessment', 'Technical Deep Dive', 'System Design / Code Review', 'HR Discussion'],
        aboutCompany: company.about,
        eligibility: {
          cgpa: i % 2 === 0 ? '7.5+' : '6.5+',
          branches: ['CSE', 'IT', 'ECE', 'AI/ML', 'Data Science'],
          graduationYear: '2026 / 2027'
        },
        aiMatch: 80 + (i % 18),
        recommendationReason: [
          `${titleObj.skills[0]} proficiency matched`,
          `ZenScore placement readiness score verified`,
          `Eligible batch & CGPA threshold satisfied`
        ],
        postedDate: `${(i % 5) + 1} days ago`,
        deadline: `Sep ${(i % 28) + 1}, 2026`,
        featured: isFeatured,
        recommended: isRecommended,
        latest: isLatest,
        applyLink: '#',
        isActive: true
      })
    }

    await JobListing.insertMany(mockJobsList)
    console.log('✅ Successfully seeded 90 production job listings into MongoDB!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Error seeding jobs:', err)
    process.exit(1)
  }
}

seedDatabase()
